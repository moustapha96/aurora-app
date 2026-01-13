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

  // Toujours définir le polyfill, même s'il existe déjà, pour s'assurer qu'il est disponible
  try {
    // Essayer d'abord avec Object.defineProperty pour une définition propre
    if (!('documentPictureInPicture' in window)) {
      Object.defineProperty(window, 'documentPictureInPicture', {
        value: polyfill,
        writable: true,
        configurable: true,
        enumerable: false,
      });
    } else {
      // Si l'API existe déjà, s'assurer qu'elle a au moins la méthode requestWindow
      const existing = (window as any).documentPictureInPicture;
      if (!existing || typeof existing.requestWindow !== 'function') {
        Object.defineProperty(window, 'documentPictureInPicture', {
          value: polyfill,
          writable: true,
          configurable: true,
          enumerable: false,
        });
      }
    }
  } catch (e) {
      // Si Object.defineProperty échoue, utiliser l'assignation directe
      (window as any).documentPictureInPicture = polyfill;
  }

  // Vérifier aussi sur document au cas où (bien que normalement ce soit sur window)
  if (typeof document !== 'undefined') {
    const documentPolyfill = (window as any).documentPictureInPicture || polyfill;
    try {
      if (!('documentPictureInPicture' in document)) {
        Object.defineProperty(document, 'documentPictureInPicture', {
          value: documentPolyfill,
          writable: true,
          configurable: true,
          enumerable: false,
        });
      } else {
        // Si l'API existe déjà, s'assurer qu'elle a au moins la méthode requestWindow
        const existing = (document as any).documentPictureInPicture;
        if (!existing || typeof existing.requestWindow !== 'function') {
          Object.defineProperty(document, 'documentPictureInPicture', {
            value: documentPolyfill,
            writable: true,
            configurable: true,
            enumerable: false,
          });
        }
      }
    } catch (e) {
      // Si Object.defineProperty échoue, utiliser l'assignation directe
      (document as any).documentPictureInPicture = documentPolyfill;
    }
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
