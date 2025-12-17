# Capacitor iOS/Android - Guide Complet d'Intégration

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Application** : Aurora Society

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Installation et Configuration](#installation-et-configuration)
4. [Configuration iOS](#configuration-ios)
5. [Configuration Android](#configuration-android)
6. [Plugins Capacitor Essentiels](#plugins-capacitor-essentiels)
7. [Build et Publication](#build-et-publication)
8. [Intégration avec Onfido et Biométrie](#intégration-avec-onfido-et-biométrie)
9. [Plan d'Implémentation](#plan-dimplémentation)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'Ensemble

Ce document explique comment transformer l'application web **Aurora Society** (React + Vite) en applications mobiles natives pour **iOS** et **Android** en utilisant **Capacitor**.

Capacitor permet de :
- ✅ Transformer l'app web en apps natives iOS/Android
- ✅ Réutiliser 95%+ du code existant
- ✅ Accéder aux fonctionnalités natives (caméra, notifications, biométrie, etc.)
- ✅ Performance native
- ✅ Distribution via App Store et Google Play

### Architecture Capacitor

```
┌─────────────────────────────────────────────┐
│         AURORA SOCIETY MOBILE                │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐    │
│  │   WebView    │      │   Native     │    │
│  │   (React)    │◄────►│   Plugins    │    │
│  └──────────────┘      └──────────────┘    │
│         │                      │            │
│         └──────────┬───────────┘            │
│                    ▼                        │
│         ┌──────────────────┐               │
│         │    CAPACITOR     │               │
│         │     Bridge       │               │
│         └──────────────────┘               │
│                    │                        │
│         ┌──────────┴───────────┐           │
│         ▼                      ▼           │
│  ┌──────────────┐      ┌──────────────┐    │
│  │  iOS Native  │      │ Android      │    │
│  │   (Swift)    │      │  (Java/Kot)  │    │
│  └──────────────┘      └──────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📦 Prérequis

### Pour iOS

- **macOS** : macOS 10.15 (Catalina) ou supérieur (requis pour Xcode)
- **Xcode** : Version 14+ (télécharger depuis App Store)
- **Xcode Command Line Tools** :
  ```bash
  xcode-select --install
  ```
- **CocoaPods** (gestionnaire de dépendances iOS) :
  ```bash
  sudo gem install cocoapods
  ```
- **Node.js** : Version 18+ et npm

### Pour Android

- **Java Development Kit (JDK)** : Version 17 (OpenJDK recommandé)
- **Android Studio** : Version Flamingo (2022.2.1) ou supérieur
  - Télécharger depuis [developer.android.com](https://developer.android.com/studio)
- **Android SDK** : Installé via Android Studio
  - SDK Platform 33+
  - Android SDK Build-Tools
- **Node.js** : Version 18+ et npm

### Vérification des Prérequis

```bash
# Vérifier Node.js
node --version  # Doit être 18+

# Vérifier npm
npm --version

# Vérifier Java (Android)
java -version  # Doit être 17+

# Vérifier CocoaPods (iOS - macOS uniquement)
pod --version
```

---

## 🚀 Installation et Configuration

### 1. Installer Capacitor CLI

```bash
npm install -g @capacitor/cli
```

### 2. Installer Capacitor dans le Projet

```bash
# Depuis la racine du projet
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
```

### 3. Initialiser Capacitor

```bash
npx cap init "Aurora Society" "com.aurora.society" --web-dir=dist
```

Cette commande crée le fichier `capacitor.config.ts` :

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aurora.society',
  appName: 'Aurora Society',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // En développement : décommenter pour utiliser le serveur Vite
    // url: 'http://192.168.0.10:5173',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a1a',
    },
  },
};

export default config;
```

### 4. Build de l'Application Web

```bash
# Build de production
npm run build

# Le build est dans le dossier dist/
```

### 5. Ajouter les Plateformes

```bash
# Ajouter iOS (macOS uniquement)
npx cap add ios

# Ajouter Android
npx cap add android

# Synchroniser le build web avec les plateformes natives
npx cap sync
```

> **Important** : Après chaque modification du code web, exécuter :
> 1. `npm run build`
> 2. `npx cap sync` (ou `npx cap copy` pour copier uniquement le web)

---

## 📱 Configuration iOS

### 1. Ouvrir le Projet iOS dans Xcode

```bash
npx cap open ios
```

Cette commande ouvre le projet dans Xcode.

### 2. Configurer les Capacités iOS

Dans Xcode :

1. **Sélectionner le projet** dans le navigateur (icône bleue en haut)
2. **Sélectionner le target** "App"
3. **Onglet "Signing & Capabilities"** :
   - Sélectionner votre **Team** (Apple Developer Account requis)
   - **Bundle Identifier** : `com.aurora.society`

4. **Ajouter les Capacités** :
   - Cliquer sur **"+ Capability"**
   - Ajouter :
     - **Keychain Sharing** (pour stockage sécurisé)
     - **Face ID** (pour authentification biométrique)
     - **Background Modes** (pour notifications push)
     - **Push Notifications** (si nécessaire)

### 3. Configurer Info.plist

Ouvrir `ios/App/App/Info.plist` et ajouter :

```xml
<key>NSFaceIDUsageDescription</key>
<string>Aurora Society utilise Face ID pour sécuriser votre compte</string>

<key>NSCameraUsageDescription</key>
<string>Aurora Society a besoin de la caméra pour scanner vos documents d'identité</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Aurora Society a besoin d'accéder à vos photos pour télécharger des images</string>
```

### 4. Configurer les Permissions Capacitor

Dans `capacitor.config.ts` :

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aurora.society',
  appName: 'Aurora Society',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    scheme: 'aurora',
    allowsLinkPreview: false,
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  plugins: {
    Camera: {
      iosImagePickerMaxWidth: 1920,
      iosImagePickerMaxHeight: 1920,
      quality: 90,
    },
    // ... autres plugins
  },
};
```

### 5. Tester sur Simulateur iOS

1. Dans Xcode, sélectionner un **simulateur** (ex: iPhone 14 Pro)
2. Cliquer sur le bouton **Play** (▶️) ou `Cmd + R`
3. L'application devrait se lancer

### 6. Tester sur Device iOS (Physical Device)

1. Connecter votre iPhone via USB
2. Dans Xcode, sélectionner votre device dans la liste
3. Configurer le **Signing** avec votre compte Apple Developer
4. Cliquer sur **Play** pour installer et lancer l'app

---

## 🤖 Configuration Android

### 1. Ouvrir le Projet Android dans Android Studio

```bash
npx cap open android
```

Cette commande ouvre le projet dans Android Studio.

### 2. Configurer build.gradle

Ouvrir `android/app/build.gradle` et vérifier :

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.aurora.society"
        minSdkVersion 22  // Android 5.1+
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Configurer AndroidManifest.xml

Ouvrir `android/app/src/main/AndroidManifest.xml` et ajouter les permissions :

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false">
        
        <!-- ... -->
    </application>
</manifest>
```

### 4. Configurer les Variables d'Environnement Android

Créer `android/local.properties` :

```properties
## This file must *NOT* be checked into Version Control Systems,
# as it contains information specific to your local configuration.
#
# Location of the SDK. This is only used by Gradle.
# For customization when using a Version Control System, please read the
# header note.
sdk.dir=/Users/username/Library/Android/sdk
```

> **Important** : Ce fichier est généré automatiquement par Android Studio, ne pas le committer dans Git.

### 5. Tester sur Émulateur Android

1. Dans Android Studio, aller dans **Tools** → **Device Manager**
2. Créer un **Virtual Device** (AVD) si nécessaire
3. Cliquer sur **Run** (▶️) ou `Shift + F10`
4. Sélectionner l'émulateur et l'app devrait se lancer

### 6. Tester sur Device Android (Physical Device)

1. Activer le **Mode développeur** sur votre appareil Android :
   - Aller dans **Paramètres** → **À propos du téléphone**
   - Taper 7 fois sur **Numéro de build**
2. Activer le **Débogage USB** :
   - Aller dans **Paramètres** → **Options pour les développeurs**
   - Activer **Débogage USB**
3. Connecter votre appareil via USB
4. Dans Android Studio, sélectionner votre device et cliquer sur **Run**

---

## 🔌 Plugins Capacitor Essentiels

### 1. Status Bar

Gérer la barre de statut :

```bash
npm install @capacitor/status-bar
```

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

// Dans App.tsx ou main.tsx
StatusBar.setStyle({ style: Style.Dark });
StatusBar.setBackgroundColor({ color: '#1a1a1a' });
```

### 2. Splash Screen

Gérer l'écran de démarrage :

```bash
npm install @capacitor/splash-screen
```

```typescript
import { SplashScreen } from '@capacitor/splash-screen';

// Cacher le splash screen après le chargement
SplashScreen.hide();
```

### 3. Camera

Accéder à la caméra (nécessaire pour Onfido) :

```bash
npm install @capacitor/camera
```

```typescript
import { Camera, CameraResultType } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl
  });
  
  return image.dataUrl;
};
```

### 4. App (Lifecycle)

Gérer le cycle de vie de l'application :

```bash
npm install @capacitor/app
```

```typescript
import { App } from '@capacitor/app';

App.addListener('appStateChange', ({ isActive }) => {
  console.log('App state changed. Is active?', isActive);
});

App.addListener('backButton', ({ canGoBack }) => {
  if (!canGoBack) {
    App.exitApp();
  } else {
    window.history.back();
  }
});
```

### 5. Keyboard

Gérer le clavier :

```bash
npm install @capacitor/keyboard
```

```typescript
import { Keyboard } from '@capacitor/keyboard';

Keyboard.addListener('keyboardWillShow', (info) => {
  console.log('Keyboard height:', info.keyboardHeight);
});

Keyboard.addListener('keyboardWillHide', () => {
  console.log('Keyboard hidden');
});
```

### 6. Secure Storage (pour tokens)

Stockage sécurisé (Keychain iOS / Keystore Android) :

```bash
npm install @capacitor/preferences
```

```typescript
import { Preferences } from '@capacitor/preferences';

// Stocker une valeur
await Preferences.set({
  key: 'auth_token',
  value: 'token_value'
});

// Récupérer une valeur
const { value } = await Preferences.get({ key: 'auth_token' });

// Supprimer une valeur
await Preferences.remove({ key: 'auth_token' });
```

### 7. Biometric (Authentification biométrique)

Voir le document [03-BIOMETRIE_AUTH.md](./03-BIOMETRIE_AUTH.md) pour l'intégration complète.

---

## 📦 Build et Publication

### iOS - Build de Production

#### 1. Préparer le Build

```bash
# Build web
npm run build

# Synchroniser avec iOS
npx cap sync ios
```

#### 2. Configurer dans Xcode

1. Ouvrir Xcode : `npx cap open ios`
2. **Sélectionner le projet** → Target "App"
3. **General** :
   - **Version** : 1.0.0
   - **Build** : 1
4. **Signing & Capabilities** :
   - Sélectionner votre **Team** (Apple Developer Account)
   - Vérifier que le **Bundle Identifier** est unique

#### 3. Archiver et Distribuer

1. Dans Xcode, **Product** → **Archive**
2. Attendre que l'archive soit créée
3. Dans **Organizer** (Xcode → Window → Organizer) :
   - Sélectionner l'archive
   - Cliquer sur **Distribute App**
   - Choisir **App Store Connect**
   - Suivre les étapes pour uploader

#### 4. TestFlight (Tests Bêta)

1. Dans [App Store Connect](https://appstoreconnect.apple.com)
2. Aller dans **TestFlight**
3. Ajouter les testeurs
4. L'app sera disponible pour tests bêta

### Android - Build de Production

#### 1. Générer une Keystore

```bash
keytool -genkey -v -keystore aurora-release.keystore -alias aurora -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. Configurer le Signing

Créer `android/keystore.properties` :

```properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=aurora
storeFile=../aurora-release.keystore
```

#### 3. Modifier build.gradle

Dans `android/app/build.gradle` :

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ...
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 4. Générer le Bundle

```bash
cd android
./gradlew bundleRelease
```

Le fichier `.aab` sera dans `android/app/build/outputs/bundle/release/`

#### 5. Publier sur Google Play

1. Aller sur [Google Play Console](https://play.google.com/console)
2. Créer une nouvelle application
3. Télécharger le fichier `.aab`
4. Compléter les informations (description, captures d'écran, etc.)
5. Soumettre pour révision

---

## 🔗 Intégration avec Onfido et Biométrie

### Onfido dans Capacitor

L'intégration Onfido fonctionne directement dans Capacitor car elle utilise le WebView :

1. **SDK Onfido** : Le SDK JavaScript fonctionne dans le WebView Capacitor
2. **Caméra** : Utiliser `@capacitor/camera` si nécessaire
3. **Webhooks** : Les webhooks Onfido fonctionnent de la même manière

Voir le document [01-ONFIDO_INTEGRATION.md](./01-ONFIDO_INTEGRATION.md) pour plus de détails.

### Biométrie dans Capacitor

Voir le document [03-BIOMETRIE_AUTH.md](./03-BIOMETRIE_AUTH.md) pour l'intégration complète de Face ID / Touch ID / Fingerprint.

---

## 📋 Plan d'Implémentation

### Phase 1 : Installation et Configuration (Semaine 1)

- [ ] Installer Capacitor CLI et packages
- [ ] Initialiser Capacitor
- [ ] Configurer `capacitor.config.ts`
- [ ] Ajouter plateformes iOS/Android
- [ ] Premier build et test sur simulateur/émulateur

### Phase 2 : Configuration iOS (Semaine 2)

- [ ] Configurer Xcode project
- [ ] Configurer Signing & Capabilities
- [ ] Ajouter permissions (Face ID, Camera, etc.)
- [ ] Tester sur simulateur iOS
- [ ] Tester sur device iOS physique

### Phase 3 : Configuration Android (Semaine 2-3)

- [ ] Configurer Android Studio project
- [ ] Configurer build.gradle
- [ ] Ajouter permissions Android
- [ ] Tester sur émulateur Android
- [ ] Tester sur device Android physique

### Phase 4 : Plugins et Fonctionnalités (Semaine 3-4)

- [ ] Installer plugins essentiels (StatusBar, SplashScreen, Camera, etc.)
- [ ] Intégrer plugins dans le code
- [ ] Adapter UI pour mobile (responsive)
- [ ] Optimiser performances

### Phase 5 : Tests et Optimisation (Semaine 4)

- [ ] Tests fonctionnels sur iOS
- [ ] Tests fonctionnels sur Android
- [ ] Tests de performance
- [ ] Correction des bugs

### Phase 6 : Publication (Semaine 5)

- [ ] Préparer builds production
- [ ] Configurer certificats/signatures
- [ ] Publier sur TestFlight (iOS)
- [ ] Publier sur Internal Testing (Android)
- [ ] Soumettre pour révision App Store / Google Play

**Total estimé** : 5 semaines

---

## 🔍 Troubleshooting

### Problème : "Capacitor command not found"

**Solution** :
```bash
npm install -g @capacitor/cli
```

### Problème : "Xcode not found" (iOS)

**Solution** :
- Installer Xcode depuis l'App Store
- Installer les Command Line Tools : `xcode-select --install`

### Problème : "Java not found" (Android)

**Solution** :
- Installer JDK 17
- Configurer JAVA_HOME dans les variables d'environnement

### Problème : Build iOS échoue

**Solution** :
- Vérifier que CocoaPods est installé : `pod --version`
- Installer les pods : `cd ios/App && pod install`
- Vérifier le Signing dans Xcode

### Problème : Build Android échoue

**Solution** :
- Vérifier que Android SDK est configuré
- Vérifier `local.properties` dans `android/`
- Nettoyer et rebuilder : `cd android && ./gradlew clean`

### Problème : L'app ne charge pas le contenu web

**Solution** :
- Vérifier que `npm run build` a été exécuté
- Vérifier que `npx cap sync` a été exécuté
- Vérifier `webDir` dans `capacitor.config.ts` (doit être `dist`)

### Problème : Plugins ne fonctionnent pas

**Solution** :
- Vérifier que les plugins sont installés : `npm list @capacitor/plugin-name`
- Vérifier que `npx cap sync` a été exécuté après installation
- Vérifier les permissions dans Info.plist (iOS) ou AndroidManifest.xml (Android)

---

## 📚 Ressources et Documentation

### Documentation Officielle

- **Capacitor** : [capacitorjs.com/docs](https://capacitorjs.com/docs)
- **Plugins Capacitor** : [capacitorjs.com/docs/apis](https://capacitorjs.com/docs/apis)
- **iOS Setup** : [capacitorjs.com/docs/ios](https://capacitorjs.com/docs/ios)
- **Android Setup** : [capacitorjs.com/docs/android](https://capacitorjs.com/docs/android)

### Apple Developer

- **Apple Developer** : [developer.apple.com](https://developer.apple.com)
- **App Store Connect** : [appstoreconnect.apple.com](https://appstoreconnect.apple.com)

### Google Play

- **Google Play Console** : [play.google.com/console](https://play.google.com/console)
- **Android Developer** : [developer.android.com](https://developer.android.com)

---

## ✅ Checklist de Mise en Place

### Prérequis
- [ ] Node.js 18+ installé
- [ ] Xcode installé (macOS pour iOS)
- [ ] Android Studio installé
- [ ] Java JDK 17 installé (Android)
- [ ] CocoaPods installé (iOS)

### Installation
- [ ] Capacitor CLI installé
- [ ] Capacitor packages installés dans le projet
- [ ] Capacitor initialisé
- [ ] Plateformes iOS/Android ajoutées

### Configuration
- [ ] `capacitor.config.ts` configuré
- [ ] Permissions iOS configurées (Info.plist)
- [ ] Permissions Android configurées (AndroidManifest.xml)
- [ ] Signing iOS configuré (Xcode)
- [ ] Signing Android configuré (keystore)

### Plugins
- [ ] Plugins essentiels installés
- [ ] Plugins intégrés dans le code
- [ ] Plugins testés

### Tests
- [ ] App fonctionne sur simulateur iOS
- [ ] App fonctionne sur émulateur Android
- [ ] App fonctionne sur device iOS physique
- [ ] App fonctionne sur device Android physique

### Publication
- [ ] Build production iOS créé
- [ ] Build production Android créé
- [ ] App soumise sur TestFlight (iOS)
- [ ] App soumise sur Google Play (Android)

---

## 🎯 Conclusion

L'intégration de **Capacitor** permet de transformer Aurora Society en applications mobiles natives pour iOS et Android, en réutilisant la majorité du code existant.

**Temps d'implémentation** : 5 semaines  
**Réutilisation du code** : 95%+  
**Performance** : Native  
**Distribution** : App Store et Google Play

---

**Dernière mise à jour** : Décembre 2024  
**Version** : 1.0.0  
**Solution** : Capacitor 5+

