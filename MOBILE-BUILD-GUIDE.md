# Aurora Society - Guide de Build Mobile iOS/Android

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Application** : Aurora Society  
**App ID** : `app.lovable.e6cb71785bb7428786ce0e9ee3ec0082`

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Installation Rapide](#installation-rapide)
4. [Configuration iOS](#configuration-ios)
5. [Configuration Android](#configuration-android)
6. [Développement avec Hot Reload](#développement-avec-hot-reload)
7. [Build de Production](#build-de-production)
8. [Publication sur les Stores](#publication-sur-les-stores)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'Ensemble

Aurora Society utilise **Capacitor 7+** pour créer des applications mobiles natives iOS et Android à partir de la même base de code React/Vite.

### Architecture

```
┌─────────────────────────────────────────────┐
│         AURORA SOCIETY MOBILE               │
├─────────────────────────────────────────────┤
│  ┌──────────────┐      ┌──────────────┐    │
│  │   WebView    │      │   Plugins    │    │
│  │   (React)    │◄────►│   Natifs     │    │
│  └──────────────┘      └──────────────┘    │
│         │                      │            │
│         └──────────┬───────────┘            │
│                    ▼                        │
│         ┌──────────────────┐               │
│         │    CAPACITOR     │               │
│         └──────────────────┘               │
│                    │                        │
│         ┌──────────┴───────────┐           │
│         ▼                      ▼           │
│  ┌──────────────┐      ┌──────────────┐    │
│  │     iOS      │      │   Android    │    │
│  │   (Swift)    │      │   (Kotlin)   │    │
│  └──────────────┘      └──────────────┘    │
└─────────────────────────────────────────────┘
```

### Plugins Installés

| Plugin | Version | Usage |
|--------|---------|-------|
| @capacitor/core | ^7.4.4 | Core Capacitor |
| @capacitor/ios | ^7.4.4 | Plateforme iOS |
| @capacitor/android | ^7.4.4 | Plateforme Android |
| @capacitor/status-bar | ^8.0.0 | Barre de statut |
| @capacitor/splash-screen | ^8.0.0 | Écran de démarrage |
| @capacitor/camera | ^8.0.0 | Caméra |
| @capacitor/app | ^8.0.0 | Lifecycle app |
| @capacitor/keyboard | ^8.0.0 | Gestion clavier |
| @capacitor/preferences | ^8.0.0 | Stockage local |
| @capacitor/haptics | ^8.0.0 | Retour haptique |

---

## 📦 Prérequis

### Pour iOS (macOS requis)

```bash
# Vérifier les prérequis
node --version      # Node.js 18+
xcode-select -p     # Xcode Command Line Tools

# Installer CocoaPods si nécessaire
sudo gem install cocoapods
pod --version
```

- **macOS** : 10.15 (Catalina) ou supérieur
- **Xcode** : 14+ (depuis App Store)
- **Apple Developer Account** : Pour tester sur device physique

### Pour Android

> ✅ **VERSIONS SUPPORTÉES** : JDK **17** ou JDK **21** sont supportés. Java 25+ cause des erreurs.

```bash
# Vérifier les prérequis
node --version    # Node.js 18+
java -version     # DOIT afficher "17.x.x" ou "21.x.x" - pas 25!
```

- **Android Studio** : Flamingo (2022.2.1) ou supérieur
- **Android SDK** : Platform 33+
- **JDK** : Version **17** ou **21** (OpenJDK recommandé)

#### Installation JDK 17 ou 21

**macOS (Homebrew)** :
```bash
# Java 17 (recommandé)
brew install openjdk@17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# OU Java 21
brew install openjdk@21
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

# Ajouter à ~/.zshrc ou ~/.bash_profile :
export PATH="$JAVA_HOME/bin:$PATH"
```

**Windows** :
1. Télécharger depuis [Adoptium](https://adoptium.net/temurin/releases/)
   - Choisir Java 17 ou Java 21
2. Installer et configurer JAVA_HOME :
```powershell
# PowerShell (en admin) - Java 17
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.11-hotspot", "Machine")

# OU Java 21
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-21.0.3-hotspot", "Machine")
```

**Linux (Ubuntu/Debian)** :
```bash
sudo apt update
# Java 17
sudo apt install openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# OU Java 21
sudo apt install openjdk-21-jdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64

sudo update-alternatives --config java  # Sélectionner la version voulue
```

#### Configurer JDK dans Android Studio

1. Ouvrir Android Studio
2. **File → Project Structure → SDK Location**
3. Dans **JDK Location**, sélectionner le chemin JDK 17 ou 21
4. Ou : **File → Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK** → Sélectionner 17 ou 21

#### Configuration Gradle (Important!)

Après `npx cap add android`, copiez la configuration Gradle préparée:

```bash
cp android-config/gradle.properties android/gradle.properties
```

Puis éditez `android/gradle.properties` et décommentez la ligne correspondant à votre Java.

---

## 🚀 Installation Rapide

### 1. Cloner et Installer

```bash
# Cloner depuis GitHub (via Export to GitHub de Lovable)
git clone <votre-repo-github>
cd <nom-du-projet>

# Installer les dépendances
npm install
```

### 2. Ajouter les Plateformes

```bash
# Ajouter iOS (macOS uniquement)
npx cap add ios

# Ajouter Android
npx cap add android

# IMPORTANT: Copier la configuration Gradle pour Android
cp android-config/gradle.properties android/gradle.properties
# Puis éditer android/gradle.properties et décommenter la ligne JAVA_HOME appropriée
```

### 3. Build et Sync

```bash
# Build du projet web
npm run build

# Synchroniser avec les plateformes natives
npx cap sync
```

### 4. Lancer l'Application

```bash
# iOS (ouvre Xcode)
npx cap open ios

# Android (ouvre Android Studio)
npx cap open android
```

---

## 📱 Configuration iOS

### Info.plist - Permissions Requises

Après `npx cap add ios`, ajouter dans `ios/App/App/Info.plist` :

```xml
<!-- Face ID -->
<key>NSFaceIDUsageDescription</key>
<string>Aurora Society utilise Face ID pour sécuriser votre compte</string>

<!-- Caméra -->
<key>NSCameraUsageDescription</key>
<string>Aurora Society a besoin de la caméra pour scanner vos documents et photos de profil</string>

<!-- Photothèque -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Aurora Society a besoin d'accéder à vos photos pour télécharger des images</string>

<!-- Photothèque (ajout) -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Aurora Society a besoin d'enregistrer des photos dans votre bibliothèque</string>
```

### Signing & Capabilities dans Xcode

1. Ouvrir : `npx cap open ios`
2. Sélectionner le projet **App** dans le navigateur
3. Onglet **Signing & Capabilities** :
   - **Team** : Sélectionner votre Apple Developer Account
   - **Bundle Identifier** : `app.lovable.e6cb71785bb7428786ce0e9ee3ec0082`
4. Ajouter les capabilities :
   - **Keychain Sharing** (stockage sécurisé)
   - **Face ID** (biométrie)

### Tester sur iOS

```bash
# Simulateur
# Dans Xcode : sélectionner iPhone 14 Pro → Play (⌘R)

# Device physique
# Connecter iPhone via USB → Sélectionner dans Xcode → Play
```

---

## 🤖 Configuration Android

### AndroidManifest.xml - Permissions

Après `npx cap add android`, vérifier `android/app/src/main/AndroidManifest.xml` :

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.VIBRATE" />
    
    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        <!-- ... -->
    </application>
</manifest>
```

### Tester sur Android

```bash
# Émulateur
# Dans Android Studio : Tools → Device Manager → Créer AVD → Run

# Device physique
# 1. Activer Mode développeur (taper 7x sur Numéro de build)
# 2. Activer Débogage USB
# 3. Connecter via USB → Run dans Android Studio
```

---

## 🔄 Développement avec Hot Reload

Le projet est configuré pour le hot reload depuis le serveur Lovable en développement.

### Configuration Actuelle (capacitor.config.ts)

```typescript
server: {
  url: 'https://e6cb7178-5bb7-4287-86ce-0e9ee3ec0082.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

### Workflow de Développement

1. **Modifier le code** dans Lovable
2. **L'app mobile** se met à jour automatiquement (hot reload)
3. Pas besoin de rebuild pour les changements web

### Pour Build Offline (Production)

Commenter la section `server` dans `capacitor.config.ts` :

```typescript
// server: {
//   url: '...',
//   cleartext: true
// }
```

Puis :

```bash
npm run build
npx cap sync
```

---

## 📦 Build de Production

### iOS - Build pour App Store

```bash
# 1. Préparer le build
npm run build
npx cap sync ios

# 2. Dans Xcode
npx cap open ios

# 3. Product → Archive
# 4. Window → Organizer → Distribute App → App Store Connect
```

### Android - Build pour Google Play

```bash
# 1. Générer la keystore (une seule fois)
keytool -genkey -v -keystore aurora-release.keystore -alias aurora -keyalg RSA -keysize 2048 -validity 10000

# 2. Créer android/keystore.properties
storePassword=votre_password
keyPassword=votre_password
keyAlias=aurora
storeFile=../aurora-release.keystore

# 3. Build
npm run build
npx cap sync android
cd android
./gradlew bundleRelease

# Le fichier .aab est dans android/app/build/outputs/bundle/release/
```

---

## 🏪 Publication sur les Stores

### App Store (iOS)

1. **App Store Connect** : [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Créer une nouvelle app
3. Remplir les métadonnées :
   - Nom : Aurora Society
   - Bundle ID : `app.lovable.e6cb71785bb7428786ce0e9ee3ec0082`
   - Catégorie : Lifestyle / Social Networking
4. Uploader via Xcode Organizer
5. Soumettre pour révision

### Google Play (Android)

1. **Google Play Console** : [play.google.com/console](https://play.google.com/console)
2. Créer une nouvelle app
3. Uploader le fichier `.aab`
4. Remplir les informations
5. Soumettre pour révision

---

## 🔍 Troubleshooting

### Erreur : "Unsupported class file major version 69" (Android)

**Cause** : Vous utilisez Java 25+ au lieu de JDK 17 ou 21.

**Solution** :
```bash
# Vérifier la version Java
java -version
# Si ce n'est pas 17.x.x ou 21.x.x, installer une version supportée

# Configurer JAVA_HOME (macOS/Linux)
export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || /usr/libexec/java_home -v 21)
export PATH="$JAVA_HOME/bin:$PATH"

# Vérifier
java -version  # Doit afficher 17.x.x ou 21.x.x
```

**Configuration Gradle** :
```bash
# Copier la configuration préparée
cp android-config/gradle.properties android/gradle.properties
# Éditer et décommenter la ligne JAVA_HOME appropriée
```

**Dans Android Studio** :
1. File → Project Structure → SDK Location
2. Changer JDK Location vers JDK 17 ou 21
3. File → Invalidate Caches → Restart

### Erreur : "The Capacitor CLI needs to run at the root of an npm package"

**Cause** : Vous exécutez la commande depuis le mauvais répertoire.

**Solution** :
```bash
# TOUJOURS exécuter depuis la racine du projet
cd /chemin/vers/votre-projet  # PAS /android ou /ios
npx cap sync
```

### Erreur : "Capacitor command not found"

```bash
npm install -g @capacitor/cli
# ou
npx cap <commande>
```

### Erreur : Build iOS échoue

```bash
cd ios/App
pod install --repo-update
cd ../..
npx cap sync ios
```

### Erreur : Build Android échoue

```bash
# Vérifier JDK 17 d'abord!
java -version

# Nettoyer et rebuild
cd android
./gradlew clean
cd ..
npx cap sync android
```

### L'app affiche une page blanche

1. Vérifier que `npm run build` a été exécuté
2. Vérifier que `npx cap sync` a été exécuté
3. Vérifier `webDir: 'dist'` dans capacitor.config.ts

### Plugins ne fonctionnent pas

```bash
# Vérifier l'installation
npm list @capacitor/camera

# Re-synchroniser
npx cap sync
```

### Hot Reload ne fonctionne pas

1. Vérifier que le device/émulateur a accès internet
2. Vérifier l'URL dans `capacitor.config.ts`
3. Pour iOS simulateur : le réseau fonctionne automatiquement
4. Pour device physique : être sur le même réseau Wi-Fi

---

## 📚 Commandes Utiles

```bash
# Build web
npm run build

# Synchroniser toutes les plateformes
npx cap sync

# Synchroniser iOS uniquement
npx cap sync ios

# Synchroniser Android uniquement
npx cap sync android

# Copier le web sans sync des plugins
npx cap copy

# Ouvrir dans IDE
npx cap open ios
npx cap open android

# Lancer directement (si CLI configuré)
npx cap run ios
npx cap run android

# Vérifier la configuration
npx cap doctor
```

---

## ✅ Checklist Rapide

### Premier Setup

- [ ] `npm install`
- [ ] `npx cap add ios` (macOS)
- [ ] `npx cap add android`
- [ ] `npm run build`
- [ ] `npx cap sync`

### Après Modifications Web

- [ ] `npm run build`
- [ ] `npx cap sync`

### Pour Publication

- [ ] Commenter `server.url` dans capacitor.config.ts
- [ ] `npm run build`
- [ ] `npx cap sync`
- [ ] Build via Xcode (iOS) ou Android Studio

---

## 📞 Support

- **Documentation Capacitor** : [capacitorjs.com/docs](https://capacitorjs.com/docs)
- **Lovable Docs** : [docs.lovable.dev](https://docs.lovable.dev)

---

**Dernière mise à jour** : Décembre 2024  
**Capacitor** : 7.4.4  
**Plateformes** : iOS 7.4.4, Android 7.4.4
