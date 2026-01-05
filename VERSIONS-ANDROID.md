# 🔧 Configuration des Versions Android

## ✅ Versions Configurées (Optimisées)

### Versions Capacitor
- **@capacitor/core** : 8.0.0
- **@capacitor/android** : 8.0.0
- **@capacitor/ios** : 8.0.0
- **@capacitor/app** : 8.0.0
- **@capacitor/camera** : 8.0.0
- **@capacitor/haptics** : 8.0.0
- **@capacitor/keyboard** : 8.0.0
- **@capacitor/local-notifications** : 8.0.0
- **@capacitor/preferences** : 8.0.0
- **@capacitor/push-notifications** : 8.0.0
- **@capacitor/splash-screen** : 8.0.0
- **@capacitor/status-bar** : 8.0.0

### Configuration Android
- **minSdkVersion** : 24 (Android 7.0)
- **compileSdkVersion** : 36 (Android 15) - Requis par androidx.activity:activity:1.11.0
- **targetSdkVersion** : 34 (Android 14) - Réduit pour éviter "System UI not responding"
- **Java** : 17 (LTS)
- **Gradle** : 8.14.3
- **Android Gradle Plugin** : 8.13.0

## 🔧 Corrections Appliquées

### 1. Java 17
- ✅ `android/app/capacitor.build.gradle` : JavaVersion.VERSION_17
- ✅ `android/app/build.gradle` : compileOptions avec Java 17
- ✅ `android/build.gradle` : Configuration globale pour tous les sous-projets
- ✅ `android/gradle.properties` : org.gradle.java.home=C:\\Program Files\\Java\\jdk-17

### 2. SDK Android
- ✅ `targetSdkVersion` réduit de 36 à 34 pour éviter les problèmes "System UI not responding"
- ✅ `compileSdkVersion` réduit à 34 pour correspondre

### 3. Configuration Gradle
- ✅ Mémoire augmentée : `-Xmx2048m`
- ✅ Mode parallèle activé : `org.gradle.parallel=true`
- ✅ AndroidX activé
- ✅ Non-transitive R class activé

## 📝 Pourquoi ces versions ?

### Java 17
- Version LTS (Long Term Support)
- Compatible avec Capacitor 8
- Plus stable que Java 21 pour le moment

### compileSdk 36 / targetSdk 34
- **compileSdk 36** : Requis par les dépendances AndroidX récentes (androidx.activity:activity:1.11.0)
- **targetSdk 34** : Réduit pour éviter les erreurs "System UI not responding" dans les émulateurs
- Cette configuration permet de compiler avec les dernières APIs tout en ciblant une version stable
- Évite les problèmes de performance dans les émulateurs tout en restant compatible avec les dépendances modernes

## 🚀 Utilisation

### Méthode Automatique (Recommandée)

```powershell
# Synchronisation complète avec corrections automatiques
.\sync-android.ps1
```

Ce script fait automatiquement :
- Build du projet web
- Synchronisation Capacitor
- Correction de capacitor.build.gradle (Java 17)

### Méthode Manuelle

```powershell
# 1. Build
npm run build

# 2. Synchroniser
npx cap sync android

# 3. Corriger Java (IMPORTANT après chaque sync)
.\fix-capacitor-java.ps1

# 4. Ouvrir dans Android Studio (recommandé)
npx cap open android
```

## ⚠️ Notes Importantes

1. **capacitor.build.gradle** est généré automatiquement avec Java 21. Utilisez `.\fix-capacitor-java.ps1` après chaque `npx cap sync` pour forcer Java 17
2. La configuration `afterEvaluate` dans `build.gradle` force Java 17 pour tous les modules
3. **compileSdk 36** est requis par les dépendances, mais **targetSdk 34** évite les problèmes de performance
4. Utilisez `.\sync-android.ps1` pour automatiser build + sync + corrections

## 🐛 Résolution des Problèmes

### "System UI not responding"
- ✅ Résolu en réduisant targetSdkVersion à 34
- Utiliser un émulateur plus récent si le problème persiste

### "Invalid source release: 21"
- ✅ Résolu en forçant Java 17 partout

### Problèmes ADB
- Utiliser `.\fix-adb.ps1` pour redémarrer ADB
- Ou utiliser Android Studio directement (plus fiable)

---

**Dernière mise à jour** : Configuration optimisée pour stabilité maximale

