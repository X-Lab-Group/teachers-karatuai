const STATIC_CACHE = 'karatuai-static-v2'
const PRECACHE = ['/', '/manifest.json', '/favicon.svg']

// Caches that earlier SW versions left behind. They are deleted on activate.
const LEGACY_CACHES = ['teachassist-v1', 'karatuai-static-v1']

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
              (name.startsWith('karatuai-static-') && name !== STATIC_CACHE),
          )
          .map((name) => caches.delete(name).catch(() => undefined)),
      )
      await self.clients.claim()
    })(),
  )
})

function shouldHandle(request) {
  if (request.method !== 'GET') return false
  if (request.headers.has('range')) return false
  let url
  try {
    url = new URL(request.url)
  } catch {
    return false
  }
  // Only handle same-origin requests. The AI model lives on models.karatuai.com
  // (and other large assets may live on CDNs); we must never proxy or cache them.
  if (url.origin !== self.location.origin) return false
  return true
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (!shouldHandle(request)) return

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
