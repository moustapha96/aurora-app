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

# 4. Configurer Gradle pour Android (Java 17/21)
cp android-config/gradle.properties android/gradle.properties
# Éditer android/gradle.properties et décommenter la ligne JAVA_HOME

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
cp android-config/gradle.properties android/gradle.properties
# Décommenter JAVA_HOME dans android/gradle.properties
npx cap sync android
npx cap run android
```

**Prérequis**: Java 17 ou 21, Android Studio

---

## 🍎 iOS Uniquement (macOS requis)

```bash
npm install
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

**Prérequis**: Xcode 14+, CocoaPods

**Post-setup dans Xcode**:
1. Configurer Signing (Team + Bundle ID)
2. Ajouter capabilities: Keychain Sharing, Face ID
3. Ajouter permissions dans Info.plist (voir ios-config/)

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
