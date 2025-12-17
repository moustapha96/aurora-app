# Aurora Society - Guide d'Authentification Biométrique

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Application** : Aurora Society

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Fonctionnalités](#fonctionnalités)
3. [Architecture](#architecture)
4. [Configuration Native](#configuration-native)
5. [Utilisation](#utilisation)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'Ensemble

Aurora Society supporte l'authentification biométrique native pour une connexion rapide et sécurisée sur iOS et Android.

### Technologies Utilisées

- **Plugin** : `@aparajita/capacitor-biometric-auth`
- **Stockage** : `@capacitor/preferences` (Keychain iOS / Keystore Android)
- **Plateformes** : iOS (Face ID, Touch ID), Android (Fingerprint)

---

## ✅ Fonctionnalités

| Fonctionnalité | iOS | Android |
|----------------|-----|---------|
| Face ID | ✅ | - |
| Touch ID | ✅ | - |
| Empreinte digitale | - | ✅ |
| Stockage sécurisé des tokens | ✅ | ✅ |
| Fallback vers mot de passe | ✅ | ✅ |
| Activation/Désactivation | ✅ | ✅ |

---

## 🏗️ Architecture

### Flux d'Authentification

```
PREMIÈRE CONNEXION
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Login      │────▶│  Supabase    │────▶│  Proposer       │
│  Email/Pwd  │     │  Auth        │     │  Biométrie      │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │  Stocker Tokens │
                                         │  (Keychain)     │
                                         └─────────────────┘

CONNEXIONS ULTÉRIEURES
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Ouvrir App │────▶│  Biométrie   │────▶│  Récupérer      │
│             │     │  (FaceID/FP) │     │  Tokens         │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │  Restaurer      │
                                         │  Session        │
                                         └─────────────────┘
```

### Fichiers Implémentés

| Fichier | Description |
|---------|-------------|
| `src/services/biometricService.ts` | Service principal de gestion biométrique |
| `src/components/BiometricSetup.tsx` | Composant d'activation/désactivation |
| `src/hooks/useBiometricAuth.ts` | Hook React pour l'authentification |

---

## ⚙️ Configuration Native

### iOS - Info.plist

Après `npx cap add ios`, ajouter dans `ios/App/App/Info.plist` :

```xml
<key>NSFaceIDUsageDescription</key>
<string>Aurora Society utilise Face ID pour sécuriser votre compte et vous permettre de vous connecter rapidement.</string>
```

### iOS - Capabilities (Xcode)

1. Ouvrir : `npx cap open ios`
2. Target "App" → Signing & Capabilities
3. Ajouter **Keychain Sharing**

### Android - AndroidManifest.xml

Ajouter dans `android/app/src/main/AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
```

---

## 🔧 Utilisation

### Dans le Code

#### Service Biométrique

```typescript
import { BiometricService } from '@/services/biometricService';

// Vérifier la disponibilité
const isAvailable = await BiometricService.isAvailable();

// Vérifier si activé
const isEnabled = await BiometricService.isBiometricEnabled();

// Activer la biométrie
const result = await BiometricService.enableBiometric();

// Désactiver
await BiometricService.disableBiometric();

// Authentifier
const authResult = await BiometricService.authenticate();
```

#### Hook useBiometricAuth

```typescript
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

const MyComponent = () => {
  const { 
    isNative,      // true si sur mobile
    isAvailable,   // true si biométrie disponible
    isEnabled,     // true si activée
    biometryType,  // 'face' | 'fingerprint' | 'none'
    authenticate   // fonction d'authentification
  } = useBiometricAuth();

  // ...
};
```

#### Composant BiometricSetup

```tsx
import { BiometricSetup } from '@/components/BiometricSetup';

// Utiliser dans les paramètres
<BiometricSetup />
```

### Intégrations Existantes

- **Login.tsx** : Authentification automatique au lancement + bouton biométrique
- **Settings.tsx** : Composant `BiometricSetup` pour activation/désactivation

---

## 🔍 Troubleshooting

### Biométrie non disponible

**Causes possibles** :
- L'application tourne sur le web (non natif)
- L'appareil ne supporte pas la biométrie
- La biométrie n'est pas configurée sur l'appareil

**Solution** :
- Vérifier sur un appareil physique ou émulateur avec biométrie configurée
- S'assurer que Face ID/Touch ID/Fingerprint est configuré dans les paramètres de l'appareil

### Erreur "Plugin biométrique non disponible"

**Solution** :
```bash
npx cap sync
```

### Session expirée après authentification biométrique

**Cause** : Les tokens stockés ont expiré (durée de vie limitée).

**Solution** : L'utilisateur doit se reconnecter avec email/mot de passe pour rafraîchir les tokens.

### L'authentification ne se déclenche pas automatiquement

**Vérifications** :
1. L'application est bien native (pas web)
2. La biométrie est activée dans les paramètres
3. Des tokens valides sont stockés

---

## 📊 États du Composant BiometricSetup

| État | Affichage |
|------|-----------|
| Web (non natif) | Message informatif |
| Biométrie non disponible | Message d'avertissement |
| Biométrie désactivée | Bouton d'activation |
| Biométrie activée | Statut vert + bouton désactivation |

---

## 🔐 Sécurité

### Stockage des Tokens

- **iOS** : Keychain (chiffré au niveau système)
- **Android** : Keystore (chiffré au niveau système)

### Bonnes Pratiques Implémentées

1. ✅ Tokens stockés uniquement après authentification biométrique réussie
2. ✅ Nettoyage automatique des tokens expirés
3. ✅ Fallback vers login classique en cas d'échec
4. ✅ Synchronisation avec la base de données (profil utilisateur)

---

## 📱 Test sur Émulateur

### iOS Simulator

1. Ouvrir Xcode : `npx cap open ios`
2. Features → Face ID → Enrolled
3. Pour simuler : Features → Face ID → Matching Face

### Android Emulator

1. AVD Manager → Créer un appareil avec biométrie
2. Settings → Security → Fingerprint
3. Enregistrer une empreinte de test

---

**Dernière mise à jour** : Décembre 2024  
**Plugin** : @aparajita/capacitor-biometric-auth
