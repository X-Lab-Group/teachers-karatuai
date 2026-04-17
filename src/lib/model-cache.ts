const CACHE_NAME = 'karatuai-model-cache-v1'
const MODEL_URL = 'https://storage.googleapis.com/karatuai-models/gemma-4-E2B-it-web.task'

async function responseToBlobUrl(response: Response): Promise<string> {
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

export async function getCachedModelUrl(
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!('caches' in window)) {
    return MODEL_URL
  }

  try {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(MODEL_URL)

    if (cachedResponse) {
      onProgress?.(100)
      return responseToBlobUrl(cachedResponse)
    }

    onProgress?.(5)
    const response = await fetch(MODEL_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.status}`)
    }

    if (!response.body) {
      await cache.put(MODEL_URL, response.clone())
      onProgress?.(100)
      const fresh = await cache.match(MODEL_URL)
      if (!fresh) throw new Error('Cache miss after put')
      return responseToBlobUrl(fresh)
    }

    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0

    const [forCache, forProgress] = response.body.tee()

    const cacheResponse = new Response(forCache, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    })
    const cachePut = cache.put(MODEL_URL, cacheResponse)

    const reader = forProgress.getReader()
    let received = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength

      if (total > 0) {
        const progress = Math.min(95, Math.round((received / total) * 90) + 5)
        onProgress?.(progress)
      }
    }

    await cachePut
    onProgress?.(100)

    const fresh = await cache.match(MODEL_URL)
    if (!fresh) throw new Error('Cache miss after put')
    return responseToBlobUrl(fresh)
  } catch (error) {
    console.error('Cache error, falling back to direct URL:', error)
    return MODEL_URL
  }
}

export async function isModelCached(): Promise<boolean> {
  if (!('caches' in window)) {
    return false
  }

  try {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(MODEL_URL)
    return !!cachedResponse
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
