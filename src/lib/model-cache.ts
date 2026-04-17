const CACHE_NAME = 'karatuai-model-cache-v1'
const MODEL_URL = 'https://storage.googleapis.com/karatuai-models/gemma-4-E2B-it-web.task'
const MIN_VALID_SIZE = 1_500_000_000

async function readCachedBlob(cache: Cache): Promise<Blob | null> {
  const cached = await cache.match(MODEL_URL)
  if (!cached) return null

  try {
    const blob = await cached.blob()
    if (blob.size < MIN_VALID_SIZE) {
      console.warn(`Cached model invalid (${blob.size} bytes), evicting`)
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
  if (blob.size < MIN_VALID_SIZE) {
    throw new Error(`Downloaded model is too small (${blob.size} bytes) — likely truncated`)
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
    if (len > 0) return len >= MIN_VALID_SIZE
    const blob = await cached.blob()
    return blob.size >= MIN_VALID_SIZE
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
