/* =========================================================================
   À deux · service worker

   LE NUMÉRO DE VERSION NE VIT QU'ICI.
   Changer VERSION suffit à invalider tout le cache : le nom du cache en
   dérive et l'ancien est supprimé à l'activation. Aucun paramètre ?v=... à
   répercuter dans le HTML, le CSS ou les modules.
   ========================================================================= */

const VERSION = '0.1.0';
const SHELL = 'ad-shell-' + VERSION;

const FILES = [
  './',
  './index.html',
  './css/app.css',
  './js/coeur.js',
  './js/idees.js',
  './js/store.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  /* `cache: 'reload'` est indispensable : sans lui, addAll() passe par le
     cache HTTP du navigateur et peut remplir un cache tout neuf avec les
     ANCIENS fichiers. On obtient un cache nommé 0.2.0 contenant du 0.1.0, et
     une mise à jour qui ne met rien à jour. */
  e.waitUntil(
    caches.open(SHELL)
      .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;

  /* Navigation : le réseau d'abord si disponible, sinon la coquille. */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }

  /* Les URL à paramètre ne sont pas mises en cache : l'app n'en demande
     jamais, mais les outils de contrôle importent `audit.js?t=<horodatage>`
     à chaque passage, et chaque import laisserait une entrée de plus dans un
     cache que rien ne purge avant le changement de VERSION.

     `res.ok` est tout aussi indispensable : sans lui, un 404 finit en cache
     et est resservi indéfiniment, y compris pour un fichier ajouté plus
     tard. */
  const jetable = new URL(req.url).search !== '';

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && !jetable) {
        const copie = res.clone();
        caches.open(SHELL).then(c => c.put(req, copie)).catch(() => {});
      }
      return res;
    }))
  );
});
