# 📱 Guide de Déploiement Android

## ✅ Build Réussi !

Le build Gradle fonctionne correctement. Le problème actuel concerne uniquement la connexion ADB avec l'émulateur.

## 🔧 Problème ADB "unresponsive"

Si vous obtenez l'erreur `ADB is unresponsive`, suivez ces étapes :

### Solution Rapide

```powershell
# Exécuter le script de correction
.\fix-adb.ps1
```

### Solution Manuelle

1. **Arrêter tous les processus ADB** :
   ```powershell
   taskkill /F /IM adb.exe
   ```

2. **Redémarrer le serveur ADB** :
   ```powershell
   adb kill-server
   adb start-server
   ```

3. **Vérifier les appareils** :
   ```powershell
   adb devices
   ```

### Si aucun appareil n'est détecté

#### Option 1 : Utiliser Android Studio (Recommandé)

```powershell
# Ouvrir Android Studio
npx cap open android
```

Dans Android Studio :
1. Attendez que Gradle se synchronise
2. Si aucun émulateur n'est lancé :
   - Ouvrez **Device Manager** (icône téléphone en haut à droite)
   - Cliquez sur **▶️ Play** pour lancer un émulateur
3. Une fois l'émulateur démarré, cliquez sur **Run** (▶️ vert)

#### Option 2 : Lancer l'émulateur depuis la ligne de commande

```powershell
# Lister les AVD disponibles
emulator -list-avds

# Lancer un émulateur (remplacez NOM_AVD par le nom de votre AVD)
emulator -avd NOM_AVD
```

Attendez que l'émulateur démarre complètement, puis :
```powershell
adb devices  # Vérifier que l'émulateur est détecté
npx cap run android
```

#### Option 3 : Appareil physique

1. Activez le **mode développeur** sur votre téléphone Android
2. Activez le **débogage USB**
3. Connectez le téléphone via USB
4. Acceptez l'autorisation de débogage sur le téléphone
5. Vérifiez avec `adb devices`

## 🎯 Workflow Recommandé

Pour éviter les problèmes ADB, utilisez **Android Studio** directement :

```powershell
# 1. Build le projet web
npm run build

# 2. Synchroniser avec Android
npx cap sync android

# 3. Ouvrir Android Studio
npx cap open android

# 4. Dans Android Studio :
#    - Lancer un émulateur OU connecter un appareil
#    - Cliquer sur Run (▶️)
```

## 📝 Notes

- Le build Gradle fonctionne correctement (APK généré avec succès)
- Le problème est uniquement lié à la connexion ADB
- Android Studio gère ADB automatiquement, c'est la solution la plus fiable
- Si `npx cap run android` échoue, utilisez toujours Android Studio

## 🐛 Problèmes Courants

### "ADB is unresponsive"
→ Utiliser le script `fix-adb.ps1` ou redémarrer ADB manuellement

### "No devices found"
→ Lancer un émulateur depuis Android Studio ou connecter un appareil physique

### "device offline"
→ Redémarrer l'émulateur ou reconnecter l'appareil physique

---

**Conseil** : Pour un développement plus fluide, utilisez Android Studio plutôt que la ligne de commande pour le déploiement. Le build peut se faire via Gradle, mais le déploiement via Android Studio est plus fiable.

