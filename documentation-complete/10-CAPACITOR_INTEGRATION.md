# Intégration Capacitor - Guide Pratique (Web → Mobile)

**Version** : 1.0.0  
**Date** : Décembre 2024  
**Application** : Aurora Society (React + Vite + Supabase)

---

## 🎯 Objectif
Transformer l’application React (Vite) en app mobile Android/iOS via **Capacitor**, avec un minimum d’effort côté code et en réutilisant votre base web.

---

## 📦 Pré-requis
- Node 18+ / npm
- Android Studio (SDK + émulateur) pour Android
- Xcode (macOS) pour iOS
- Java 17 (Android Gradle)

---

## 🚀 Installation de Capacitor

```bash
# Depuis la racine du projet
npm install @capacitor/core @capacitor/cli

# Initialiser Capacitor
npx cap init "Aurora Society" "com.aurora.society"
```

---

## 🏗️ Build web + ajout des plateformes

```bash
# Build web (sortie par défaut : dist/)
npm run build

# Ajouter Android / iOS
npx cap add android
npx cap add ios

# Copier le build web dans les projets natifs
npx cap sync
```

> À chaque modification front :
> 1) `npm run build`
> 2) `npx cap sync` (ou `npx cap copy` si plateformes déjà ajoutées)

---

## ⚙️ Configuration Capacitor

Fichier `capacitor.config.ts` (généré) : adaptez si besoin.

```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aurora.society',
  appName: 'Aurora Society',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // En dev : pour utiliser le serveur Vite sur device/émulateur
    // url: 'http://192.168.0.10:5173',
    // cleartext: true
  }
};

export default config;
```

Conseils :
- Garder `webDir: 'dist'` (build Vite).
- En dev sur device : dé-commenter `server.url` avec l’IP de votre machine et le port Vite (5173).

---

## 🔌 Plugins utiles

Installez uniquement ce dont vous avez besoin :

```bash
npm install @capacitor/status-bar @capacitor/app @capacitor/haptics @capacitor/keyboard
```

Exemple d’usage :

```ts
import { StatusBar } from '@capacitor/status-bar';

StatusBar.setStyle({ style: 'dark' });
```

Plugins additionnels fréquents :
- Camera : `@capacitor/camera`
- Filesystem : `@capacitor/filesystem`
- Push : via FCM (`@capacitor/push-notifications` + config Firebase)

---

## 🔐 Supabase & Capacitor

Pas de changement côté client : `@supabase/supabase-js` fonctionne dans Capacitor.

Points d’attention :
- **Deep links / auth** : utilisez les Custom URL Schemes ou App Links si vous ajoutez l’auth magic link.
- **Stockage session** : Capacitor embarque le WebView, `localStorage` fonctionne. Pour plus de sécurité, envisagez `@capacitor/preferences` ou un wrapper sécurisé si nécessaire.

---

## 🌍 Gestion des env

Capacitor copie les fichiers buildés. Assurez-vous d’avoir les bonnes variables au build :

```bash
# Exemple build prod avec Vite
VITE_SUPABASE_URL=... \
VITE_SUPABASE_PUBLISHABLE_KEY=... \
npm run build

npx cap sync
```

---

## 🧪 Tester

### Android
```bash
npx cap open android   # Ouvre dans Android Studio
# Puis Run sur émulateur ou device
```

### iOS (macOS uniquement)
```bash
npx cap open ios       # Ouvre dans Xcode
# Sélectionner un simulateur ou device, puis Run
```

### Dev rapide (optionnel)
- Lancer `npm run dev`
- Mettre `server.url` dans `capacitor.config.ts` vers `http://<IP_MACHINE>:5173`
- `npx cap sync` puis run sur device : le WebView pointera sur le dev server (hot reload web, pas natif).

---

## 📦 Publication (rappel succinct)

- **Android** : Générer un bundle signé (Android Studio > Build > Generate Signed Bundle/APK). Vérifier le `versionCode` et `versionName` dans `android/app/build.gradle`.
- **iOS** : Gérer certificats/profiles dans Xcode, incrémenter `CFBundleShortVersionString` et `CFBundleVersion`, archiver puis Distribuer via Xcode Organizer.

---

## 🧭 Checklist rapide
- [ ] Installer Capacitor et init (`cap init`)
- [ ] `npm run build` puis `npx cap add android ios`
- [ ] Configurer `capacitor.config.ts` (IP dev si besoin)
- [ ] Ajouter plugins nécessaires (Camera, etc.)
- [ ] `npx cap sync`
- [ ] Ouvrir et tester : `npx cap open android` / `npx cap open ios`
- [ ] Préparer la publication (signatures, versions)

---

## 📚 Ressources
- Docs Capacitor : https://capacitorjs.com/docs
- Plugins officiels : https://capacitorjs.com/docs/apis
- Vite + Capacitor guide : https://capacitorjs.com/docs/getting-started/environment-setup

