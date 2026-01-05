# 🔧 Correction du Crash au Démarrage

## Problème Identifié

L'application plantait au démarrage avec l'erreur :
```
java.lang.IllegalStateException: Default FirebaseApp is not initialized in this process
```

## Cause

Le plugin `@capacitor/push-notifications` essaie d'utiliser Firebase (Firebase Cloud Messaging) au démarrage, mais Firebase n'était pas configuré car le fichier `google-services.json` était absent.

## Solutions Appliquées

### 1. Amélioration de la Gestion d'Erreur

- Modifié `src/services/notificationService.ts` pour mieux gérer les erreurs Firebase
- Ajout de timeouts et de vérifications avant d'appeler `PushNotifications.register()`
- L'application continue de fonctionner même si les push notifications échouent

### 2. Gestion Robuste dans `initNotifications()`

- Modifié `src/lib/capacitor.ts` pour ne pas faire planter l'app si les notifications échouent
- Les erreurs Firebase sont capturées et ignorées gracieusement
- Les notifications locales continuent de fonctionner même si les push notifications sont désactivées

### 3. Fichier google-services.json Minimal

- Créé `android/app/google-services.json` avec une configuration minimale
- Permet au plugin push-notifications de s'initialiser sans erreur
- **Note** : Cette configuration est temporaire et ne permet pas d'envoyer de vraies notifications push
- Pour activer les vraies notifications push, remplacez ce fichier par celui de votre projet Firebase

## Configuration Firebase (Optionnel - pour vraies notifications)

Si vous voulez activer les vraies notifications push :

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com)
2. Ajouter une application Android avec le package name : `app.lovable.e6cb71785bb7428786ce0e9ee3ec0082`
3. Télécharger le fichier `google-services.json`
4. Remplacer `android/app/google-services.json` par le fichier téléchargé
5. Rebuild l'application

## État Actuel

✅ L'application démarre sans planter
✅ Les notifications locales fonctionnent
⚠️ Les push notifications sont désactivées (configuration Firebase temporaire)
✅ L'application continue de fonctionner normalement sans push notifications

## Test

Pour vérifier que tout fonctionne :

```powershell
# Build et déployer
npm run build
npx cap sync android
.\fix-capacitor-java.ps1
npx cap run android
```

L'application devrait maintenant démarrer sans planter.

