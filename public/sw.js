/**
 * Service worker do Aprumo.
 *
 * Estratégia: a casca do app (HTML, JS, CSS) fica em cache para abrir offline;
 * as chamadas ao Supabase nunca são cacheadas, senão você veria dado velho e
 * acharia que perdeu registro.
 */
const CACHE = 'aprumo-v1'
const CASCA = ['/', '/index.html', '/manifest.webmanifest', '/icones/prumo.svg']

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const req = evento.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // Supabase e qualquer outra origem de dados passam direto para a rede.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/')) return

  // Navegação: tenta a rede, cai para o index em cache quando estiver offline.
  if (req.mode === 'navigate') {
    evento.respondWith(fetch(req).catch(() => caches.match('/index.html').then((r) => r ?? Response.error())))
    return
  }

  evento.respondWith(
    caches.match(req).then(
      (cacheado) =>
        cacheado ??
        fetch(req).then((resposta) => {
          if (resposta.ok && resposta.type === 'basic') {
            const copia = resposta.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
          }
          return resposta
        }),
    ),
  )
})
