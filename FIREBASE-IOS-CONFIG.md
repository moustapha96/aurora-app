# 🔥 Configuration Firebase pour iOS - Guide Complet

Ce guide vous explique comment configurer Firebase pour votre application iOS en utilisant Swift Package Manager.

---

## 📋 Prérequis

- **macOS** : 10.15 (Catalina) ou supérieur
- **Xcode** : 14+ (depuis App Store)
- **Projet iOS** : Capacitor iOS déjà configuré (`npx cap add ios`)
- **Fichier GoogleService-Info.plist** : Téléchargé depuis Firebase Console

---

## 🚀 Étape 1 : Installation via Swift Package Manager

### 1.1 Ouvrir le projet dans Xcode

```bash
# Depuis la racine du projet
npx cap open ios
```

### 1.2 Ajouter le package Firebase

1. Dans Xcode, allez dans **File > Add Packages...** (ou **Fichier > Ajouter des packages...**)

2. Dans la barre de recherche, entrez l'URL du dépôt Firebase :
   ```
   https://github.com/firebase/firebase-ios-sdk
   ```

3. **Sélectionner la version** :
   - **Recommandé** : Utilisez la version par défaut (la plus récente)
   - **Alternative** : Vous pouvez sélectionner une version spécifique si nécessaire

4. Cliquez sur **Add Package** (Ajouter le package)

5. **Sélectionner les bibliothèques Firebase** :
   
   **⚠️ IMPORTANT** : Vous devez ajouter au minimum :
   - ✅ **FirebaseCore** (obligatoire)
   - ✅ **FirebaseAnalytics** (pour Analytics)
   
   **Alternative pour Analytics sans IDFA** :
   - ✅ **FirebaseAnalyticsWithoutAdId** (au lieu de FirebaseAnalytics)
   
   **Autres bibliothèques disponibles** (selon vos besoins) :
   - FirebaseAuth (Authentification)
   - FirebaseMessaging (Push Notifications)
   - FirebaseFirestore (Base de données)
   - FirebaseStorage (Stockage)
   - FirebaseCrashlytics (Rapports de crash)
   - Et bien d'autres...

6. Cliquez sur **Add Package** (Ajouter le package)

7. Xcode va automatiquement résoudre et télécharger les dépendances en arrière-plan

---

## 📁 Étape 2 : Ajouter le fichier GoogleService-Info.plist

### 2.1 Télécharger le fichier depuis Firebase Console

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur l'icône ⚙️ **Paramètres du projet**
4. Dans l'onglet **Vos applications**, sélectionnez votre application iOS
5. Téléchargez le fichier **GoogleService-Info.plist**

### 2.2 Ajouter le fichier au projet Xcode

1. Dans Xcode, faites un clic droit sur le dossier **App** dans le navigateur de projet
2. Sélectionnez **Add Files to "App"...** (Ajouter des fichiers à "App"...)
3. Naviguez vers le fichier `GoogleService-Info.plist` téléchargé
4. **⚠️ IMPORTANT** : Cochez les options suivantes :
   - ✅ **Copy items if needed** (Copier les éléments si nécessaire)
   - ✅ **Add to targets: App** (Ajouter aux cibles : App)
5. Cliquez sur **Add** (Ajouter)

### 2.3 Vérifier l'emplacement du fichier

Le fichier `GoogleService-Info.plist` doit être dans :
```
ios/App/App/GoogleService-Info.plist
```

**Vérification** : Le fichier doit apparaître dans le navigateur de projet Xcode, dans le dossier **App**.

---

## 💻 Étape 3 : Initialiser Firebase dans le code

### 3.1 Localiser le point d'entrée de l'application

Pour une application Capacitor iOS, le point d'entrée se trouve généralement dans :
- **Swift** : `ios/App/App/AppDelegate.swift`
- **Objective-C** : `ios/App/App/AppDelegate.m` ou `AppDelegate.h`

### 3.2 Configuration pour Swift

Si votre projet utilise **Swift**, modifiez `ios/App/App/AppDelegate.swift` :

```swift
import UIKit
import Capacitor
import FirebaseCore

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Initialize Firebase
        FirebaseApp.configure()
        
        // Capacitor initialization
        return true
    }

    // ... autres méthodes Capacitor ...
}
```

### 3.3 Configuration pour Objective-C

Si votre projet utilise **Objective-C**, modifiez `ios/App/App/AppDelegate.m` :

```objc
#import "AppDelegate.h"
#import <Capacitor/Capacitor.h>
@import UIKit;
@import FirebaseCore;

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  // Initialize Firebase
  [FIRApp configure];

  // Capacitor initialization
  return YES;
}

// ... autres méthodes Capacitor ...

@end
```

Et dans `AppDelegate.h` :

```objc
#import <UIKit/UIKit.h>
@import FirebaseCore;

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (strong, nonatomic) UIWindow *window;

@end
```

---

## ✅ Étape 4 : Vérification de la configuration

### 4.1 Vérifier que Firebase est bien initialisé

1. Compilez et lancez l'application dans Xcode
2. Vérifiez les logs de la console Xcode
3. Vous devriez voir un message indiquant que Firebase est initialisé

### 4.2 Tester Firebase Analytics (optionnel)

Si vous avez ajouté FirebaseAnalytics, vous pouvez tester avec :

**Swift** :
```swift
import FirebaseAnalytics

// Dans votre code
Analytics.logEvent("test_event", parameters: nil)
```

**Objective-C** :
```objc
@import FirebaseAnalytics;

// Dans votre code
[FIRAnalytics logEventWithName:@"test_event" parameters:nil];
```

---

## 📦 Bibliothèques Firebase disponibles

Voici les principales bibliothèques Firebase que vous pouvez ajouter selon vos besoins :

| Bibliothèque | Description | Package SPM |
|-------------|-------------|-------------|
| **FirebaseCore** | Core Firebase (obligatoire) | ✅ Toujours requis |
| **FirebaseAnalytics** | Analytics avec IDFA | Analytics |
| **FirebaseAnalyticsWithoutAdId** | Analytics sans IDFA | Analytics (sans IDFA) |
| **FirebaseAuth** | Authentification utilisateur | Authentication |
| **FirebaseMessaging** | Push Notifications | Cloud Messaging |
| **FirebaseFirestore** | Base de données NoSQL | Cloud Firestore |
| **FirebaseStorage** | Stockage de fichiers | Storage |
| **FirebaseCrashlytics** | Rapports de crash | Crashlytics |
| **FirebaseRemoteConfig** | Configuration à distance | Remote Config |
| **FirebasePerformance** | Monitoring des performances | Performance |
| **FirebaseAppCheck** | Protection contre les abus | App Check |

---

## 🔧 Configuration avancée

### Utiliser Firebase avec Capacitor Plugins

Si vous utilisez des plugins Capacitor pour Firebase (comme `@capacitor-firebase/analytics`), assurez-vous que :

1. Le plugin est installé :
   ```bash
   npm install @capacitor-firebase/analytics
   npx cap sync ios
   ```

2. Firebase est initialisé dans `AppDelegate` (comme montré ci-dessus)

3. Le plugin est configuré dans `capacitor.config.ts` si nécessaire

### Configuration pour les Push Notifications

Si vous utilisez Firebase Cloud Messaging (FCM) :

1. Ajoutez **FirebaseMessaging** via Swift Package Manager
2. Configurez les capacités dans Xcode :
   - **Signing & Capabilities** → **+ Capability** → **Push Notifications**
   - **Signing & Capabilities** → **+ Capability** → **Background Modes** → Cochez **Remote notifications**

3. Ajoutez le code d'initialisation dans `AppDelegate` :

**Swift** :
```swift
import FirebaseMessaging

func application(_ application: UIApplication, 
                 didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    FirebaseApp.configure()
    
    // FCM
    UNUserNotificationCenter.current().delegate = self
    application.registerForRemoteNotifications()
    
    return true
}
```

**Objective-C** :
```objc
@import FirebaseMessaging;
@import UserNotifications;

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  [FIRApp configure];
  
  // FCM
  [UNUserNotificationCenter currentNotificationCenter].delegate = self;
  [application registerForRemoteNotifications];
  
  return YES;
}
```

---

## 🐛 Dépannage

### Erreur : "Could not find module 'FirebaseCore'"

**Solution** :
1. Vérifiez que le package a été ajouté via Swift Package Manager
2. Nettoyez le build : **Product > Clean Build Folder** (⇧⌘K)
3. Recompilez : **Product > Build** (⌘B)

### Erreur : "GoogleService-Info.plist not found"

**Solution** :
1. Vérifiez que le fichier est dans `ios/App/App/GoogleService-Info.plist`
2. Vérifiez que le fichier est ajouté au target **App** dans Xcode
3. Vérifiez que le fichier est dans le bundle (Build Phases > Copy Bundle Resources)

### Firebase ne s'initialise pas

**Solution** :
1. Vérifiez que `FirebaseApp.configure()` est appelé dans `didFinishLaunchingWithOptions`
2. Vérifiez que le fichier `GoogleService-Info.plist` est correct
3. Vérifiez les logs de la console Xcode pour les erreurs

### Les dépendances ne se téléchargent pas

**Solution** :
1. Vérifiez votre connexion internet
2. Dans Xcode : **File > Packages > Reset Package Caches**
3. Dans Xcode : **File > Packages > Update to Latest Package Versions**

---

## 📝 Checklist de configuration

### Installation
- [ ] Xcode installé (14+)
- [ ] Projet iOS Capacitor configuré (`npx cap add ios`)
- [ ] Package Firebase ajouté via Swift Package Manager
- [ ] Bibliothèques Firebase sélectionnées (au minimum FirebaseCore et FirebaseAnalytics)

### Configuration
- [ ] Fichier `GoogleService-Info.plist` téléchargé depuis Firebase Console
- [ ] Fichier `GoogleService-Info.plist` ajouté au projet Xcode
- [ ] Fichier `GoogleService-Info.plist` ajouté au target **App**
- [ ] Firebase initialisé dans `AppDelegate.swift` ou `AppDelegate.m`

### Vérification
- [ ] Application compile sans erreurs
- [ ] Firebase s'initialise correctement (vérifier les logs)
- [ ] Analytics fonctionne (si configuré)
- [ ] Push Notifications fonctionnent (si configuré)

---

## 📚 Ressources supplémentaires

- [Documentation Firebase iOS](https://firebase.google.com/docs/ios/setup)
- [Firebase iOS SDK sur GitHub](https://github.com/firebase/firebase-ios-sdk)
- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Guide Swift Package Manager](https://swift.org/package-manager/)

---

## 🔄 Mise à jour des dépendances Firebase

Pour mettre à jour les packages Firebase vers la dernière version :

1. Dans Xcode : **File > Packages > Update to Latest Package Versions**
2. Ou supprimez et réajoutez le package avec la nouvelle version

---

## ⚠️ Notes importantes

1. **Version du SDK** : Utilisez toujours la version la plus récente recommandée par Firebase, sauf si vous avez une raison spécifique d'utiliser une version antérieure.

2. **GoogleService-Info.plist** : Ne commitez JAMAIS ce fichier dans un dépôt public. Il contient des informations sensibles. Ajoutez-le à `.gitignore` si nécessaire.

3. **Bundle ID** : Assurez-vous que le Bundle ID dans Xcode correspond exactement à celui dans Firebase Console et dans `GoogleService-Info.plist`.

4. **Analytics sans IDFA** : Si votre application ne collecte pas d'IDFA (Identifiant publicitaire), utilisez `FirebaseAnalyticsWithoutAdId` au lieu de `FirebaseAnalytics` pour respecter les politiques d'Apple.

---

**Configuration terminée !** 🎉

Votre application iOS est maintenant configurée pour utiliser Firebase. Vous pouvez commencer à utiliser les fonctionnalités Firebase dans votre code.

