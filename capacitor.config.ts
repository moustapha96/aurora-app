import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e6cb71785bb7428786ce0e9ee3ec0082',
  appName: 'Aurora Society',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    backgroundColor: '#0a0a0a',
    // Configuration spécifique iOS
    contentInset: 'always',
    // Désactiver le défilement élastique
    scrollEnabled: false,
    // Activer le défilement fluide
    allowsLinkPreview: false,
    // Configuration du clavier
    keyboardResize: 'body'
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: false,
    // Configuration spécifique Android
    webContentsDebuggingEnabled: true,
    // Activer le mode hybride
    hybrid: {
      // Activer le rendu accéléré par le matériel
      hardwareAcceleration: true,
      // Activer le défilement fluide
      smoothScroll: true
    }
  },
  plugins: {
    // Désactiver Push Notifications si Firebase n'est pas configuré
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    // Configuration pour l'authentification biométrique
    BiometricAuth: {
      // Configuration iOS
      ios: {
        reason: "Authentification requise",
        useFallback: true,
        useFallbackTitle: "Utiliser le code d'accès",
        // Désactiver la rotation automatique pendant l'authentification
        disableAutoLock: false
      },
      // Configuration Android
      android: {
        title: "Authentification requise",
        subtitle: "Vérification de sécurité",
        description: "Veuillez vous authentifier pour accéder à l'application",
        negativeButtonText: "Annuler",
        // Forcer l'utilisation de la biométrie (pas de PIN/mot de passe)
        disableBackup: false,
        // Type de biométrie à utiliser
        biometricAuthType: 1, // 1 = BIOMETRIC_STRONG
        // Configuration du cryptage
        encryptionRequired: true
      }
    },
    // Autres plugins
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#0a0a0a",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;