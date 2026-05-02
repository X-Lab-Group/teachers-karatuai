const STATIC_CACHE = 'karatuai-static-v6'
const MODEL_CACHE = 'karatuai-model-cache-v5'
const MODEL_HOST = 'models.karatuai.com'
const MODEL_PATH = '/gemma-4-E2B-it-web.task'
const PRECACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-180.png',
  '/icons/favicon-32.png',
]

// Mirror of the constants in src/lib/model-cache.ts. The page writes the model
// to the cache as separate 50 MB entries keyed by `?chunk=N`, and this SW
// stitches them back together when MediaPipe asks for the full URL.
const MODEL_TOTAL_SIZE = 2_003_697_664
const MODEL_CHUNK_SIZE = 50 * 1024 * 1024
const MODEL_TOTAL_CHUNKS = Math.ceil(MODEL_TOTAL_SIZE / MODEL_CHUNK_SIZE)

// Caches that earlier SW versions left behind. They are deleted on activate.
// v2 held entries that resolved to the internal Cloud Run port (:8080) on the
// custom domain — bumping the version forces a clean rebuild of the cache.
const LEGACY_CACHES = [
  'teachassist-v1',
  'karatuai-static-v1',
  'karatuai-static-v2',
  'karatuai-static-v3',
  'karatuai-static-v4',
  'karatuai-static-v5',
  'karatuai-model-cache-v1',
  'karatuai-model-cache-v2',
  'karatuai-model-cache-v3',
  'karatuai-model-cache-v4',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE).catch(() => undefined),
    ),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter(
            (name) =>
              LEGACY_CACHES.includes(name) ||
              (name.startsWith('karatuai-static-') && name !== STATIC_CACHE) ||
              (name.startsWith('karatuai-model-cache-') && name !== MODEL_CACHE),
          )
          .map((name) => caches.delete(name).catch(() => undefined)),
      )
      await self.clients.claim()
    })(),
  )
})

function isModelRequest(url) {
  return url.host === MODEL_HOST && url.pathname === MODEL_PATH
}

function chunkKey(index) {
  return `https://${MODEL_HOST}${MODEL_PATH}?chunk=${index}`
}

function shouldHandle(request) {
  if (request.method !== 'GET') return false
  if (request.headers.has('range')) return false
  let url
  try {
    url = new URL(request.url)
  } catch {
    return false
  }
  // The AI model URL gets a dedicated path because it lives on a separate host
  // and is populated by the page's streaming download — not by the SW itself.
  if (isModelRequest(url)) return true
  if (url.origin !== self.location.origin) return false
  return true
}

// Stitches the 39 cached chunk entries into a single streaming body. We pull
// chunks one at a time so peak memory stays at one chunk (~50 MB) instead of
// the whole 1.87 GB model — that's the whole reason we chunked the download.
async function buildAssembledModelResponse() {
  const cache = await caches.open(MODEL_CACHE)

  // Confirm every chunk is present before we promise MediaPipe a full body.
  // If any chunk is missing the page-side resume logic should run again, so
  // we fall back to the network instead of streaming a truncated response.
  const chunkResponses = []
  for (let i = 0; i < MODEL_TOTAL_CHUNKS; i++) {
    const cached = await cache.match(chunkKey(i))
    if (!cached || !cached.body) return null
    chunkResponses.push(cached)
  }

  let index = 0
  let currentReader = null

  const stream = new ReadableStream({
    async pull(controller) {
      while (true) {
        if (!currentReader) {
          if (index >= chunkResponses.length) {
            controller.close()
            return
          }
          currentReader = chunkResponses[index].body.getReader()
        }
        const { done, value } = await currentReader.read()
        if (done) {
          currentReader = null
          index++
          continue
        }
        controller.enqueue(value)
        return
      }
    },
    cancel() {
      currentReader?.cancel().catch(() => undefined)
      currentReader = null
    },
  })

  const headers = new Headers()
  headers.set('Content-Type', 'application/octet-stream')
  headers.set('Content-Length', String(MODEL_TOTAL_SIZE))
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
  headers.set('Cache-Control', 'no-store')
  return new Response(stream, { status: 200, statusText: 'OK', headers })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (!shouldHandle(request)) return

  let requestUrl
  try {
    requestUrl = new URL(request.url)
  } catch {
    return
  }

  // Model: assemble the chunked cache entries into one streaming response.
  // We re-add CORS headers explicitly because MediaPipe issues this fetch
  // with cors mode, so the response we hand back must satisfy the
  // cross-origin check even though the bytes came from our own cache.
  if (isModelRequest(requestUrl)) {
    event.respondWith(
      (async () => {
        try {
          const assembled = await buildAssembledModelResponse()
          if (assembled) return assembled
          return fetch(request)
        } catch {
          return fetch(request)
        }
      })(),
    )
    return
  }

  // SPA navigations: network-first, fall back to the cached app shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request)
        } catch {
          const shell = await caches.match('/index.html')
          if (shell) return shell
          const root = await caches.match('/')
          if (root) return root
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        }
      })(),
    )
    return
  }

  // Static assets: cache-first, populate cache on first successful network hit.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request)
      if (cached) return cached
      try {
        const response = await fetch(request)
        if (response.ok && response.type === 'basic' && response.status === 200) {
          const clone = response.clone()
          caches
            .open(STATIC_CACHE)
            .then((cache) => cache.put(request, clone).catch(() => undefined))
        }
        return response
      } catch (err) {
        const fallback = await caches.match(request)
        if (fallback) return fallback
        throw err
      }
    })(),
  )
})
