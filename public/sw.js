// Service Worker pour Aurora Society PWA
// Version du cache - incrémenter à chaque build pour invalider le cache
const CACHE_NAME = 'aurora-society-v' + Date.now();
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 heures maximum

// Installation du service worker
self.addEventListener('install', (event) => {
  // Force l'activation immédiate du nouveau service worker
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Supprimer tous les anciens caches
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  // Prend le contrôle de toutes les pages immédiatement
  return self.clients.claim();
});

// Stratégie de cache: Network First avec cache minimal
self.addEventListener('fetch', (event) => {
  // Ne mettre en cache que les fichiers statiques essentiels
  const url = new URL(event.request.url);
  const isStaticAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
  const isManifest = url.pathname === '/manifest.json';
  
  // Pour les requêtes non-essentielles, ne pas utiliser de cache
  if (!isStaticAsset && !isManifest) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Vérifier si la réponse est valide
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Mettre en cache uniquement les assets statiques essentiels
        if (isStaticAsset || isManifest) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }

        return response;
      })
      .catch(() => {
        // Si le réseau échoue, essayer le cache uniquement pour les assets statiques
        if (isStaticAsset || isManifest) {
          return caches.match(event.request);
        }
        // Sinon, retourner une erreur
        return new Response('Ressource non disponible hors ligne', { status: 503 });
      })
  );
});

// Nettoyer le cache périodiquement
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    });
  }
});
