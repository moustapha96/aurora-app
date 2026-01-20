/**
 * Polyfills pour les APIs Web non supportées par tous les navigateurs
 */

/**
 * Polyfill pour documentPictureInPicture
 * L'API Document Picture-in-Picture n'est pas supportée par tous les navigateurs
 * Cette fonction assure qu'elle existe avant qu'elle ne soit utilisée par des dépendances
 * 
 * NOTE: Le polyfill principal est défini dans index.html pour s'assurer qu'il est
 * disponible avant tout autre code. Cette fonction sert de sauvegarde.
 */
export function setupDocumentPictureInPicturePolyfill() {
  if (typeof window === 'undefined') return;

  // Créer un objet polyfill minimal pour éviter les erreurs de référence
  const polyfill = {
    requestWindow: (options?: any) => Promise.reject(new Error('Document Picture-in-Picture API is not supported')),
  };

  // Fonction helper pour définir le polyfill de manière robuste
  const definePolyfill = (obj: any, name: string, value: any) => {
    try {
      if (!(name in obj)) {
        Object.defineProperty(obj, name, {
          value: value,
          writable: true,
          configurable: true,
          enumerable: false,
        });
      } else {
        // Si l'API existe déjà, s'assurer qu'elle a au moins la méthode requestWindow
        const existing = obj[name];
        if (!existing || typeof existing.requestWindow !== 'function') {
          Object.defineProperty(obj, name, {
            value: value,
            writable: true,
            configurable: true,
            enumerable: false,
          });
        }
      }
    } catch (e) {
      // Si Object.defineProperty échoue, utiliser l'assignation directe
      try {
        obj[name] = value;
      } catch (e2) {
        // Si même l'assignation directe échoue, ignorer silencieusement
        console.warn(`Could not define ${name} on object`, e2);
      }
    }
  };

  // Définir sur window
  definePolyfill(window, 'documentPictureInPicture', polyfill);

  // Définir aussi sur window.self pour les contextes de workers/iframes
  if (typeof window.self !== 'undefined' && window.self !== window) {
    definePolyfill(window.self, 'documentPictureInPicture', polyfill);
  }

  // Définir aussi sur globalThis pour une accessibilité maximale
  if (typeof globalThis !== 'undefined' && globalThis !== window) {
    definePolyfill(globalThis, 'documentPictureInPicture', polyfill);
  }

  // Vérifier aussi sur document au cas où (bien que normalement ce soit sur window)
  if (typeof document !== 'undefined') {
    const documentPolyfill = (window as any).documentPictureInPicture || polyfill;
    definePolyfill(document, 'documentPictureInPicture', documentPolyfill);
  }

  // Définir aussi un getter global pour les accès asynchrones
  // IMPORTANT: Stocker le polyfill dans une variable locale pour éviter la récursion
  const polyfillValue = polyfill;
  try {
    if (typeof globalThis !== 'undefined') {
      // Vérifier si globalThis a déjà une valeur définie (pas un getter)
      const existing = (globalThis as any).documentPictureInPicture;
      if (existing && typeof existing === 'object' && typeof existing.requestWindow === 'function') {
        // Déjà défini correctement, ne pas le redéfinir
        return;
      }
      
      // Définir directement la valeur, pas un getter, pour éviter la récursion
      try {
        Object.defineProperty(globalThis, 'documentPictureInPicture', {
          value: polyfillValue,
          writable: true,
          configurable: true,
          enumerable: false,
        });
      } catch (e) {
        // Fallback si defineProperty échoue
        (globalThis as any).documentPictureInPicture = polyfillValue;
      }
    }
  } catch (e) {
    // Ignorer si cela échoue
  }
}

// Initialiser immédiatement si on est dans un environnement de navigateur
// (sauvegarde au cas où le polyfill dans index.html n'aurait pas fonctionné)
if (typeof window !== 'undefined') {
  setupDocumentPictureInPicturePolyfill();
}

/**
 * Initialise tous les polyfills nécessaires
 */
export function initPolyfills() {
  setupDocumentPictureInPicturePolyfill();
}
