const CACHE_NAME = 'karatuai-model-cache-v1'
const MODEL_URL = 'https://storage.googleapis.com/karatuai-models/gemma-4-E2B-it-web.task'

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
      return MODEL_URL
    }

    onProgress?.(5)
    const response = await fetch(MODEL_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.status}`)
    }

    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0

    if (!response.body) {
      const clonedResponse = response.clone()
      await cache.put(MODEL_URL, clonedResponse)
      onProgress?.(100)
      return MODEL_URL
    }

    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let received = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      chunks.push(value)
      received += value.length

      if (total > 0) {
        const progress = Math.min(95, Math.round((received / total) * 90) + 5)
        onProgress?.(progress)
      }
    }

    const blob = new Blob(chunks)
    const cachedResponseToStore = new Response(blob, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(blob.size),
      },
    })

    await cache.put(MODEL_URL, cachedResponseToStore)
    onProgress?.(100)

    return MODEL_URL
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
