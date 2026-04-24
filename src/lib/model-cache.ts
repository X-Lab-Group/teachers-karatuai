const CACHE_NAME = 'karatuai-model-cache-v5'
const LEGACY_CACHE_NAMES = [
  'karatuai-model-cache-v1',
  'karatuai-model-cache-v2',
  'karatuai-model-cache-v3',
  'karatuai-model-cache-v4',
]
const MODEL_URL = 'https://models.karatuai.com/gemma-4-E2B-it-web.task'
const EXPECTED_SIZE = 2_003_697_664

// 50 MB chunks balance two failure modes on phones: small enough that an
// interrupted download (screen lock, app backgrounded) only loses up to one
// chunk's worth of bytes, large enough that we don't pay TCP setup cost on
// every other megabyte. The SW assembly logic and these constants are
// duplicated in public/sw.js — keep them in sync if any of these change.
const CHUNK_SIZE = 50 * 1024 * 1024
const TOTAL_CHUNKS = Math.ceil(EXPECTED_SIZE / CHUNK_SIZE)
// 10 minutes per chunk. A 50 MB chunk on a 1 Mbps connection (typical for
// rural African internet) takes ~7 minutes, so 2 minutes was aborting good
// downloads mid-stream. The Wake Lock keeps the page alive while this runs.
const CHUNK_TIMEOUT_MS = 600_000
const CHUNK_MAX_ATTEMPTS = 4

async function evictLegacyCaches(): Promise<void> {
  if (!('caches' in window)) return
  await Promise.all(
    LEGACY_CACHE_NAMES.map((name) => caches.delete(name).catch(() => undefined)),
  )
}

// Thrown when the browser's storage budget cannot fit the remaining model
// bytes. Two trigger sites: (1) the pre-flight estimate() check, where we know
// real numbers and can quote them; (2) a cache.put() rejection mid-download,
// where navigator.storage.estimate() routinely lies (iOS/Android browsers cap
// reported quota at round numbers that exceed actual writable disk), so we
// don't quote numbers we can't trust.
export class StorageQuotaError extends Error {
  readonly availableBytes: number | null
  readonly requiredBytes: number
  constructor(
    requiredBytes: number,
    availableBytes: number | null,
    detected: 'preflight' | 'write',
  ) {
    const reqMb = Math.round(requiredBytes / (1024 * 1024))
    const message =
      detected === 'preflight' && availableBytes !== null
        ? `Not enough free space on this device. The AI needs about ${reqMb} MB but only ${Math.round(availableBytes / (1024 * 1024))} MB is available. Free up storage in your phone settings and try again.`
        : `Your device ran out of space while saving the AI (it needs about ${reqMb} MB). Free up storage in your phone settings, then try again — the parts already downloaded will be reused.`
    super(message)
    this.name = 'StorageQuotaError'
    this.availableBytes = availableBytes
    this.requiredBytes = requiredBytes
  }
}

function isQuotaExceeded(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  // DOMException for cache.put can come through as either name (older WebKit
  // uses QuotaExceededError, Chromium also exposes it; some surfaces use code 22).
  return (
    err.name === 'QuotaExceededError' ||
    err.message.toLowerCase().includes('quota')
  )
}

// Headroom on top of the remaining download. The browser's reported quota
// rarely matches actual writable space — a 50 MB cushion absorbs the variance
// without being so large that we reject phones that *could* finish the download.
const STORAGE_HEADROOM_BYTES = 50 * 1024 * 1024

async function assertEnoughStorage(remainingBytes: number): Promise<void> {
  if (!navigator.storage?.estimate) return
  try {
    const { quota, usage } = await navigator.storage.estimate()
    if (typeof quota !== 'number' || typeof usage !== 'number') return
    const available = quota - usage
    const required = remainingBytes + STORAGE_HEADROOM_BYTES
    if (available < required) {
      throw new StorageQuotaError(required, available, 'preflight')
    }
  } catch (err) {
    if (err instanceof StorageQuotaError) throw err
    // estimate() failures shouldn't block the download — let the actual write
    // surface the quota error instead.
  }
}

async function ensurePersistentStorage(): Promise<void> {
  if (!navigator.storage?.persist) return
  try {
    const already = await navigator.storage.persisted?.()
    if (already) return
    const granted = await navigator.storage.persist()
    if (!granted) {
      console.warn(
        'Persistent storage was not granted — the cached model may be evicted between sessions.',
      )
    }
  } catch (err) {
    console.warn('Could not request persistent storage:', err)
  }
}

function chunkUrl(index: number): string {
  return `${MODEL_URL}?chunk=${index}`
}

function expectedChunkSize(index: number): number {
  if (index < TOTAL_CHUNKS - 1) return CHUNK_SIZE
  return EXPECTED_SIZE - (TOTAL_CHUNKS - 1) * CHUNK_SIZE
}

async function isChunkComplete(cache: Cache, index: number): Promise<boolean> {
  const cached = await cache.match(chunkUrl(index))
  if (!cached) return false
  const len = parseInt(cached.headers.get('content-length') ?? '0', 10)
  return len === expectedChunkSize(index)
}

async function countCompleteChunks(cache: Cache): Promise<number> {
  let count = 0
  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    if (await isChunkComplete(cache, i)) count++
  }
  return count
}

async function isCachedAndValid(cache: Cache): Promise<boolean> {
  return (await countCompleteChunks(cache)) === TOTAL_CHUNKS
}

async function downloadChunk(
  cache: Cache,
  index: number,
  onChunkBytes?: (bytes: number) => void,
): Promise<void> {
  const start = index * CHUNK_SIZE
  const end = Math.min(start + CHUNK_SIZE - 1, EXPECTED_SIZE - 1)
  const expected = end - start + 1

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CHUNK_TIMEOUT_MS)

  try {
    const response = await fetch(MODEL_URL, {
      headers: { Range: `bytes=${start}-${end}` },
      signal: controller.signal,
    })

    if (response.status !== 206 && !(index === 0 && response.status === 200)) {
      // A 200 for chunks beyond the first means the server ignored our Range
      // header and is sending the full file. Caching that as chunk N would
      // corrupt the model on assembly, so abort and surface the failure.
      throw new Error(`Chunk ${index} unexpected HTTP ${response.status}`)
    }
    if (!response.body) {
      throw new Error(`Chunk ${index} response had no body`)
    }

    // Drain the network stream into JS memory before handing it to cache.put.
    // Streaming straight into Cache.put() means any mid-flight network blip
    // surfaces as an opaque "Cache.put() encountered a network error" that the
    // retry loop cannot diagnose, and can leave a partially-written entry that
    // lies about its Content-Length. Fully buffering one chunk costs ~50 MB of
    // peak heap (fine on every device that can run this app) and turns network
    // failures into clean "truncated" errors that retry cleanly.
    const reader = response.body.getReader()
    const parts: Uint8Array[] = []
    let received = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      parts.push(value)
      received += value.byteLength
      onChunkBytes?.(received)
    }

    if (received !== expected) {
      throw new Error(`Chunk ${index} truncated: ${received}/${expected}`)
    }

    const buffer = new Uint8Array(received)
    let offset = 0
    for (const part of parts) {
      buffer.set(part, offset)
      offset += part.byteLength
    }

    const cacheHeaders = new Headers()
    cacheHeaders.set('Content-Type', 'application/octet-stream')
    cacheHeaders.set('Content-Length', String(received))

    try {
      await cache.put(
        chunkUrl(index),
        new Response(buffer, { status: 200, statusText: 'OK', headers: cacheHeaders }),
      )
    } catch (err) {
      // estimate() typically over-reports here (browsers on phones cap quota
      // at optimistic round numbers), so we don't quote a "free" figure that
      // would contradict the failure the user just hit.
      if (isQuotaExceeded(err)) {
        throw new StorageQuotaError(EXPECTED_SIZE, null, 'write')
      }
      throw err
    }
  } finally {
    clearTimeout(timer)
  }
}

async function downloadChunkWithRetry(
  cache: Cache,
  index: number,
  onChunkBytes?: (bytes: number) => void,
): Promise<void> {
  let lastErr: unknown
  for (let attempt = 0; attempt < CHUNK_MAX_ATTEMPTS; attempt++) {
    try {
      await downloadChunk(cache, index, onChunkBytes)
      return
    } catch (err) {
      lastErr = err
      // Quota exhaustion will not clear by waiting — the user has to free space.
      // Bail immediately so the UI surfaces the actionable error.
      if (err instanceof StorageQuotaError) throw err
      if (attempt === CHUNK_MAX_ATTEMPTS - 1) break
      // Exponential backoff: 1s, 2s, 4s. Network blip or server hiccup usually
      // clears within seconds; longer waits frustrate users on the loading screen.
      const delay = 1000 * Math.pow(2, attempt)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`Chunk ${index} failed after retries`)
}

interface WakeLockHandle {
  release: () => void
}

// Phones aggressively suspend background tabs and abort in-flight fetches when
// the screen locks. Wake Lock keeps the screen on while the page is visible,
// which on iOS Safari 16.4+ and Android Chrome is enough to prevent the
// suspend. We re-acquire on visibilitychange because the OS releases the lock
// when the tab hides.
async function acquireWakeLock(): Promise<WakeLockHandle> {
  const nav = navigator as Navigator & {
    wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> }
  }
  if (!nav.wakeLock) {
    return { release: () => undefined }
  }

  let sentinel: { release: () => Promise<void> } | null = null
  const tryAcquire = async () => {
    if (document.visibilityState !== 'visible') return
    try {
      sentinel = await nav.wakeLock!.request('screen')
    } catch {
      sentinel = null
    }
  }
  await tryAcquire()

  const onVisibility = () => {
    if (document.visibilityState === 'visible') void tryAcquire()
  }
  document.addEventListener('visibilitychange', onVisibility)

  return {
    release: () => {
      document.removeEventListener('visibilitychange', onVisibility)
      sentinel?.release().catch(() => undefined)
      sentinel = null
    },
  }
}

async function downloadAllChunks(
  cache: Cache,
  onProgress?: (progress: number) => void,
): Promise<void> {
  let completedBytes = 0
  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    if (await isChunkComplete(cache, i)) completedBytes += expectedChunkSize(i)
  }

  // Reject up front if the device clearly can't fit what's left. Discovering
  // this 1.5 GB into a 1.87 GB download wastes bandwidth on metered phones and
  // surfaces as a confusing "Quota exceeded" deep in the chunk loop.
  await assertEnoughStorage(EXPECTED_SIZE - completedBytes)

  const reportProgress = (inFlightBytes = 0) => {
    const total = completedBytes + inFlightBytes
    onProgress?.(Math.min(98, 2 + Math.round((total / EXPECTED_SIZE) * 96)))
  }
  reportProgress()

  const wakeLock = await acquireWakeLock()
  try {
    for (let i = 0; i < TOTAL_CHUNKS; i++) {
      if (await isChunkComplete(cache, i)) continue
      await downloadChunkWithRetry(cache, i, (bytes) => reportProgress(bytes))
      completedBytes += expectedChunkSize(i)
      reportProgress()
    }
  } finally {
    wakeLock.release()
  }
}

// Last-ditch path used only when the Cache API is missing entirely. Holds the
// full model in JS heap, which only desktops survive — but this branch is
// effectively unreachable on the browsers we target.
async function downloadModelToBlob(
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const response = await fetch(MODEL_URL)
  if (!response.ok) {
    throw new Error(`Model download failed: HTTP ${response.status}`)
  }
  if (!response.body) {
    throw new Error('Model download has no response body')
  }
  const total = parseInt(response.headers.get('content-length') ?? '0', 10)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  onProgress?.(2)
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.byteLength
    if (total > 0) {
      onProgress?.(Math.min(98, Math.round((received / total) * 95) + 2))
    }
  }
  if (received !== EXPECTED_SIZE) {
    throw new Error(`Truncated download: ${received}/${EXPECTED_SIZE}`)
  }
  return new Blob(chunks as BlobPart[], { type: 'application/octet-stream' })
}

export async function getCachedModelUrl(
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!('caches' in window)) {
    const blob = await downloadModelToBlob(onProgress)
    return URL.createObjectURL(blob)
  }

  await ensurePersistentStorage()
  await evictLegacyCaches()
  const cache = await caches.open(CACHE_NAME)

  if (await isCachedAndValid(cache)) {
    onProgress?.(100)
    // The SW intercepts this URL and assembles the chunked entries into a
    // single streaming Response for MediaPipe. The model never enters JS heap.
    return MODEL_URL
  }

  await downloadAllChunks(cache, onProgress)
  if (!(await isCachedAndValid(cache))) {
    throw new Error('Download completed but cache validation failed')
  }
  onProgress?.(100)
  return MODEL_URL
}

export async function isModelCached(): Promise<boolean> {
  if (!('caches' in window)) return false
  try {
    const cache = await caches.open(CACHE_NAME)
    return await isCachedAndValid(cache)
  } catch {
    return false
  }
}

export async function clearModelCache(): Promise<void> {
  if ('caches' in window) {
    await caches.delete(CACHE_NAME)
  }
}

export { MODEL_URL }
