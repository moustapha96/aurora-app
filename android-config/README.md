# Configuration Android pour Aurora Society

## 🎯 Objectif

Ces fichiers de configuration permettent de compiler l'application Android avec **Java 17** ou **Java 21**.

## 📋 Instructions d'Installation

### Étape 1: Ajouter la plateforme Android

Depuis la **racine du projet** (pas le dossier android):

```bash
# Build le projet web d'abord
npm run build

# Ajouter Android
npx cap add android

# Synchroniser
npx cap sync android
```

### Étape 2: Copier la configuration Gradle

Copiez le fichier `gradle.properties` vers `android/gradle.properties`:

```bash
cp android-config/gradle.properties android/gradle.properties
```

### Étape 3: Configurer Java dans gradle.properties

Ouvrez `android/gradle.properties` et décommentez la ligne correspondant à votre système et version Java:

**macOS avec Java 17 (Homebrew):**
```properties
org.gradle.java.home=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

**macOS avec Java 17 (Adoptium/Temurin):**
```properties
org.gradle.java.home=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
```

**macOS avec Java 21 (Homebrew):**
```properties
org.gradle.java.home=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
```

**Windows avec Java 17:**
```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.11-hotspot
```

**Linux avec Java 17:**
```properties
org.gradle.java.home=/usr/lib/jvm/java-17-openjdk-amd64
```

### Étape 4: Modifier android/app/build.gradle (si nécessaire)

Si vous utilisez Java 21, vous devez modifier `android/app/build.gradle`:

Trouvez la section `android { compileOptions }` et assurez-vous d'avoir:

```gradle
android {
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17  // ou VERSION_21
        targetCompatibility JavaVersion.VERSION_17  // ou VERSION_21
    }
}
```

### Étape 5: Lancer l'application

```bash
# Ouvrir dans Android Studio
npx cap open android

# Ou lancer directement (si AVD configuré)
npx cap run android
```

## 🔧 Vérifier votre version Java

```bash
java -version
```

Sortie attendue pour Java 17:
```
openjdk version "17.0.11" 2024-04-16
OpenJDK Runtime Environment Temurin-17.0.11+9 (build 17.0.11+9)
```

Sortie attendue pour Java 21:
```
openjdk version "21.0.3" 2024-04-16
OpenJDK Runtime Environment Temurin-21.0.3+9 (build 21.0.3+9)
```

## ⚠️ Troubleshooting

### Erreur "Unsupported class file major version 69"

Cette erreur survient avec Java 25+. Installez Java 17 ou 21:

```bash
# macOS
brew install openjdk@17
# ou
brew install openjdk@21

# Configurer JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### Gradle ne trouve pas Java

Vérifiez que le chemin dans `gradle.properties` est correct:

```bash
# macOS - Trouver le chemin Java
/usr/libexec/java_home -v 17
/usr/libexec/java_home -v 21

# Linux
update-alternatives --list java
```

### Nettoyer et reconstruire

```bash
cd android
./gradlew clean
./gradlew --stop
cd ..
npx cap sync android
```

## 📱 Workflow Complet

```bash
# 1. S'assurer que Java 17 ou 21 est configuré
java -version

# 2. Build web
npm run build

# 3. Sync Android
npx cap sync android

# 4. Lancer
npx cap run android
# ou
npx cap open android  # puis Run dans Android Studio
```
