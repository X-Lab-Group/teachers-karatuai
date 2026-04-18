const CACHE_NAME = 'karatuai-model-cache-v4'
const LEGACY_CACHE_NAMES = [
  'karatuai-model-cache-v1',
  'karatuai-model-cache-v2',
  'karatuai-model-cache-v3',
]
const MODEL_URL = 'https://models.karatuai.com/gemma-4-E2B-it-web.task'
const EXPECTED_SIZE = 2_003_697_664

async function evictLegacyCaches(): Promise<void> {
  if (!('caches' in window)) return
  await Promise.all(
    LEGACY_CACHE_NAMES.map((name) => caches.delete(name).catch(() => undefined)),
  )
}

function isValidSize(size: number): boolean {
  return size === EXPECTED_SIZE
}

async function readCachedBlob(cache: Cache): Promise<Blob | null> {
  const cached = await cache.match(MODEL_URL)
  if (!cached) return null

  try {
    const blob = await cached.blob()
    if (!isValidSize(blob.size)) {
      console.warn(`Cached model invalid (${blob.size} bytes, expected ${EXPECTED_SIZE}), evicting`)
      await cache.delete(MODEL_URL)
      return null
    }
    return blob
  } catch (err) {
    console.warn('Failed to read cached model, evicting:', err)
    await cache.delete(MODEL_URL)
    return null
  }
}

async function downloadModel(
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

  if (total > 0 && received !== total) {
    throw new Error(`Truncated download: ${received} of ${total} bytes`)
  }

  const blob = new Blob(chunks as BlobPart[], { type: 'application/octet-stream' })
  if (!isValidSize(blob.size)) {
    throw new Error(`Downloaded model size mismatch (${blob.size} bytes, expected ${EXPECTED_SIZE}) — likely truncated`)
  }
  return blob
}

async function tryCacheBlob(cache: Cache, blob: Blob): Promise<void> {
  try {
    const headers = new Headers({
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(blob.size),
    })
    await cache.put(MODEL_URL, new Response(blob, { headers }))
  } catch (err) {
    console.warn('Failed to cache model (will re-download next session):', err)
  }
}

export async function getCachedModelUrl(
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!('caches' in window)) {
    const blob = await downloadModel(onProgress)
    return URL.createObjectURL(blob)
  }

  await evictLegacyCaches()
  const cache = await caches.open(CACHE_NAME)

  const cached = await readCachedBlob(cache)
  if (cached) {
    onProgress?.(100)
    return URL.createObjectURL(cached)
  }

  const blob = await downloadModel(onProgress)
  await tryCacheBlob(cache, blob)
  onProgress?.(100)
  return URL.createObjectURL(blob)
}

export async function isModelCached(): Promise<boolean> {
  if (!('caches' in window)) return false
  try {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(MODEL_URL)
    if (!cached) return false
    const len = parseInt(cached.headers.get('content-length') ?? '0', 10)
    if (len > 0) return isValidSize(len)
    const blob = await cached.blob()
    return isValidSize(blob.size)
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
