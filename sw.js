/* Service worker da "Minha Semana"
   Só faz cache dos arquivos do app (a "casca") para abrir offline.
   NÃO toca nos seus dados — eles ficam no localStorage do navegador,
   que o service worker nem enxerga.
   Quando eu atualizar o app, troque o número da versão abaixo
   (ex.: v3) para forçar a atualização do cache. */
const CACHE = 'minha-semana-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

// instala e guarda os arquivos do app
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// limpa caches antigos quando uma versão nova assume
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// estratégia: tenta a rede, cai pro cache se estiver offline
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        // atualiza o cache em segundo plano (só mesma origem)
        if (res && res.ok && new URL(req.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
