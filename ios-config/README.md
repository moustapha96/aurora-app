# Configuration iOS pour Aurora Society

## 🎯 Prérequis

- **macOS** : 10.15 (Catalina) ou supérieur
- **Xcode** : 14+ (depuis App Store)
- **CocoaPods** : Pour les dépendances natives
- **Apple Developer Account** : Pour tester sur device physique

## 📋 Installation des Prérequis

### 1. Installer Xcode

```bash
# Depuis l'App Store ou via xcode-select
xcode-select --install
```

### 2. Installer CocoaPods

```bash
sudo gem install cocoapods
pod --version  # Vérifier l'installation
```

### 3. Vérifier les prérequis

```bash
node --version      # Node.js 18+
xcode-select -p     # Xcode Command Line Tools
pod --version       # CocoaPods
```

---

## 🚀 Installation Rapide

### Étape 1: Ajouter la plateforme iOS

Depuis la **racine du projet**:

```bash
# Build le projet web
npm run build

# Ajouter iOS
npx cap add ios

# Synchroniser
npx cap sync ios
```

### Étape 2: Configurer les permissions dans Info.plist

Ouvrez `ios/App/App/Info.plist` et ajoutez:

```xml
<!-- Face ID -->
<key>NSFaceIDUsageDescription</key>
<string>Aurora Society utilise Face ID pour sécuriser votre compte</string>

<!-- Caméra -->
<key>NSCameraUsageDescription</key>
<string>Aurora Society a besoin de la caméra pour scanner vos documents et photos de profil</string>

<!-- Photothèque (lecture) -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Aurora Society a besoin d'accéder à vos photos pour télécharger des images</string>

<!-- Photothèque (écriture) -->
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Aurora Society a besoin d'enregistrer des photos dans votre bibliothèque</string>
```

### Étape 3: Configurer Signing & Capabilities dans Xcode

```bash
# Ouvrir dans Xcode
npx cap open ios
```

1. Sélectionner le projet **App** dans le navigateur
2. Onglet **Signing & Capabilities**:
   - **Team**: Sélectionner votre Apple Developer Account
   - **Bundle Identifier**: `app.lovable.e6cb71785bb7428786ce0e9ee3ec0082`
3. Ajouter les capabilities:
   - **Keychain Sharing** (stockage sécurisé biométrique)
   - **Face ID** (authentification biométrique)

---

## 📱 Lancer l'Application

### Sur Simulateur

```bash
# Ouvrir Xcode
npx cap open ios

# Dans Xcode:
# 1. Sélectionner un simulateur (ex: iPhone 15 Pro)
# 2. Cliquer sur Play (⌘R)
```

### Sur Device Physique

1. Connecter l'iPhone via USB
2. Dans Xcode, sélectionner votre device dans la liste
3. Cliquer sur Play (⌘R)

> **Note**: Un compte Apple Developer est requis pour le déploiement sur device physique.

---

## 🔄 Workflow de Développement

### Avec Hot Reload (Développement)

Le projet est configuré pour hot reload depuis le serveur Lovable:

```typescript
// capacitor.config.ts
server: {
  url: 'https://e6cb7178-5bb7-4287-86ce-0e9ee3ec0082.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

Workflow:
1. Modifier le code dans Lovable
2. L'app se met à jour automatiquement sur le simulateur/device

### Build Offline (Production)

Pour un build offline, commenter la section `server` dans `capacitor.config.ts`:

```typescript
// server: {
//   url: '...',
//   cleartext: true
// }
```

Puis:
```bash
npm run build
npx cap sync ios
```

---

## 📦 Build de Production

### 1. Préparer le build

```bash
npm run build
npx cap sync ios
npx cap open ios
```

### 2. Archive dans Xcode

1. **Product → Archive**
2. Attendre la compilation
3. **Window → Organizer** s'ouvre automatiquement

### 3. Distribuer sur App Store

1. Dans Organizer, sélectionner l'archive
2. **Distribute App → App Store Connect**
3. Suivre les instructions

---

## 🏪 Publication sur App Store

### Configuration App Store Connect

1. Aller sur [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Créer une nouvelle app:
   - **Nom**: Aurora Society
   - **Bundle ID**: `app.lovable.e6cb71785bb7428786ce0e9ee3ec0082`
   - **SKU**: aurora-society
   - **Catégorie**: Lifestyle / Social Networking

### Métadonnées requises

- Screenshots (différentes tailles d'écran)
- Description de l'app
- Mots-clés
- URL de support
- Politique de confidentialité

---

## 🔍 Troubleshooting

### Erreur: "No signing certificate"

**Solution**:
1. Xcode → Preferences → Accounts
2. Ajouter votre Apple ID
3. Télécharger les certificats

### Erreur: Pod install échoue

```bash
cd ios/App
pod install --repo-update
cd ../..
npx cap sync ios
```

### Erreur: "Could not find module"

```bash
# Nettoyer et reconstruire
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../..
npx cap sync ios
```

### L'app affiche une page blanche

1. Vérifier que `npm run build` a été exécuté
2. Vérifier que `npx cap sync ios` a été exécuté
3. Vérifier `webDir: 'dist'` dans capacitor.config.ts

### Hot Reload ne fonctionne pas

1. Vérifier la connexion internet du simulateur
2. Vérifier l'URL dans `capacitor.config.ts`
3. Pour device physique: être sur le même réseau Wi-Fi

---

## 📚 Commandes Utiles

```bash
# Synchroniser iOS
npx cap sync ios

# Copier web sans sync plugins
npx cap copy ios

# Ouvrir dans Xcode
npx cap open ios

# Lancer sur simulateur
npx cap run ios

# Vérifier la configuration
npx cap doctor
```

---

## ✅ Checklist iOS

### Premier Setup
- [ ] Xcode installé (14+)
- [ ] CocoaPods installé
- [ ] `npm install`
- [ ] `npx cap add ios`
- [ ] Permissions ajoutées dans Info.plist
- [ ] Signing configuré dans Xcode
- [ ] Capabilities ajoutées (Keychain, Face ID)

### Avant Publication
- [ ] `npm run build`
- [ ] `npx cap sync ios`
- [ ] Tester sur device physique
- [ ] Screenshots préparées
- [ ] Métadonnées App Store complètes
- [ ] Build archivé et uploadé
