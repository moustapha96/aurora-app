# Aurora Society - Setup Mobile Rapide

## 🚀 Commandes Rapides

### Setup Complet (Android + iOS)

```bash
# 1. Installer les dépendances
npm install

# 2. Build le projet web
npm run build

# 3. Ajouter les plateformes
npx cap add android
npx cap add ios  # macOS uniquement

# 4. Configurer automatiquement (NOUVEAU!)
node scripts/setup-android-java.cjs   # Configure Java 17 pour Android
node scripts/setup-ios-permissions.cjs # Ajoute permissions iOS (Face ID, etc.)

# 5. Synchroniser
npx cap sync

# 6. Lancer
npx cap open android  # Ouvre Android Studio
npx cap open ios      # Ouvre Xcode (macOS)
```

---

## 📱 Android Uniquement

```bash
npm install
npm run build
npx cap add android

# Script automatique pour Java 17
node scripts/setup-android-java.cjs

npx cap sync android
npx cap run android
```

**Prérequis**: Java 17, Android Studio

**Java 17 déjà configuré** dans `android/gradle.properties`:
```properties
org.gradle.java.home=C:\Program Files\Java\jdk-17
```

---

## 🍎 iOS Uniquement (macOS requis)

```bash
npm install
npm run build
npx cap add ios

# Script automatique pour les permissions (Face ID, Camera, Photos)
node scripts/setup-ios-permissions.cjs

npx cap sync ios
npx cap open ios
```

**Prérequis**: Xcode 14+, CocoaPods

**Permissions ajoutées automatiquement**:
- ✅ `NSFaceIDUsageDescription` (Face ID / Touch ID)
- ✅ `NSCameraUsageDescription` (Caméra)
- ✅ `NSPhotoLibraryUsageDescription` (Photos - lecture)
- ✅ `NSPhotoLibraryAddUsageDescription` (Photos - écriture)

**Post-setup dans Xcode**:
1. Configurer Signing (Team + Bundle ID)
2. Ajouter capabilities: Keychain Sharing, Face ID

---

## 📖 Documentation Détaillée

- **Android**: `android-config/README.md`
- **iOS**: `ios-config/README.md`
- **Guide complet**: `MOBILE-BUILD-GUIDE.md`
- **JDK Setup**: `android-jdk17-setup.md`

---

## ⚡ Hot Reload

L'app est configurée pour le hot reload depuis Lovable.
Modifiez le code dans Lovable → L'app se met à jour automatiquement.

Pour build offline (production), commentez la section `server` dans `capacitor.config.ts`.

---

## ✅ Checklist Sécurité Biométrique

### Android
- [x] Permissions `USE_BIOMETRIC` et `USE_FINGERPRINT` dans AndroidManifest.xml
- [x] Java 17 configuré dans gradle.properties
- [x] Plugin `@aparajita/capacitor-biometric-auth` installé

### iOS
- [x] `NSFaceIDUsageDescription` dans Info.plist (via script)
- [x] Capability Face ID dans Xcode
- [x] Capability Keychain Sharing pour stockage tokens
- [x] Plugin `@aparajita/capacitor-biometric-auth` installé
