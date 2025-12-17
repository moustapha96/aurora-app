# Configuration JDK 17/21 pour Aurora Society Android

## Prérequis Obligatoires

✅ **JDK 17 ou JDK 21** sont supportés pour compiler l'application Android avec Capacitor 7+.

⚠️ Les versions Java 25 ou supérieures causent l'erreur :
```
Unsupported class file major version 69
```

---

## Installation JDK 17 ou 21

### macOS (Homebrew)

```bash
# Installer OpenJDK 17 (recommandé)
brew install openjdk@17

# OU OpenJDK 21
brew install openjdk@21

# Configurer l'environnement (ajouter à ~/.zshrc ou ~/.bash_profile)
# Pour Java 17:
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
# OU pour Java 21:
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

export PATH="$JAVA_HOME/bin:$PATH"

# Recharger le shell
source ~/.zshrc  # ou source ~/.bash_profile

# Vérifier
java -version  # Doit afficher: openjdk version "17.x.x" ou "21.x.x"
```

### macOS (téléchargement direct)

1. Télécharger depuis [Adoptium OpenJDK](https://adoptium.net/temurin/releases/)
   - Choisir version **17** ou **21**
2. Installer le .pkg
3. Configurer JAVA_HOME :
```bash
# Pour Java 17:
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
# OU pour Java 21:
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
```

### Windows

1. Télécharger depuis [Adoptium OpenJDK](https://adoptium.net/temurin/releases/)
   - Choisir version **17** ou **21** selon votre préférence
2. Installer (cocher "Set JAVA_HOME variable")
3. Ou configurer manuellement :
```powershell
# PowerShell en administrateur - Pour Java 17:
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.11-hotspot", "Machine")

# OU pour Java 21:
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-21.0.3-hotspot", "Machine")
```
4. Redémarrer le terminal

### Linux (Ubuntu/Debian)

```bash
# Installer OpenJDK 17
sudo apt update
sudo apt install openjdk-17-jdk

# OU OpenJDK 21
sudo apt install openjdk-21-jdk

# Configurer comme version par défaut
sudo update-alternatives --config java
# Sélectionner la version 17 ou 21

# Configurer JAVA_HOME (ajouter à ~/.bashrc)
# Pour Java 17:
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
# OU pour Java 21:
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64

export PATH="$JAVA_HOME/bin:$PATH"

# Recharger
source ~/.bashrc
```

---

## Configuration Android Studio

### Méthode 1 : Gradle JDK (Recommandée)

1. Ouvrir Android Studio
2. **File → Settings** (Windows/Linux) ou **Android Studio → Preferences** (macOS)
3. **Build, Execution, Deployment → Build Tools → Gradle**
4. Dans **Gradle JDK**, sélectionner :
   - `17` ou `21`
   - `Eclipse Temurin 17` ou `Eclipse Temurin 21`
   - Chemin vers votre JDK

### Méthode 2 : Project Structure

1. **File → Project Structure**
2. **SDK Location** (dans le panneau gauche)
3. **JDK Location** : Parcourir et sélectionner JDK 17 ou 21

### Méthode 3 : gradle.properties (Recommandée pour ce projet)

Copiez la configuration préparée:
```bash
cp android-config/gradle.properties android/gradle.properties
```

Puis éditez `android/gradle.properties` et décommentez la ligne correspondant à votre système.

Exemples de chemins Java 17:
- macOS Homebrew : `/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
- macOS Adoptium : `/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home`
- Windows : `C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.11-hotspot`
- Linux : `/usr/lib/jvm/java-17-openjdk-amd64`

Exemples de chemins Java 21:
- macOS Homebrew : `/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home`
- macOS Adoptium : `/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home`
- Windows : `C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.3-hotspot`
- Linux : `/usr/lib/jvm/java-21-openjdk-amd64`

---

## Vérification

```bash
# Depuis la racine du projet
java -version
# Output attendu: openjdk version "17.x.x" ou "21.x.x"

# Vérifier que Gradle utilise la bonne version
cd android
./gradlew --version
# Doit afficher JVM: 17.x.x ou 21.x.x
```

---

## Workflow Complet

```bash
# 1. S'assurer que JDK 17 ou 21 est actif
export JAVA_HOME=$(/usr/libexec/java_home -v 17)  # macOS Java 17
# OU
export JAVA_HOME=$(/usr/libexec/java_home -v 21)  # macOS Java 21
java -version  # Vérifier

# 2. Depuis la RACINE du projet (pas /android)
npm run build
npx cap sync android

# 3. Copier la configuration Gradle (première fois)
cp android-config/gradle.properties android/gradle.properties
# Éditer et décommenter la ligne JAVA_HOME appropriée

# 4. Build ou run
npx cap run android
# OU
npx cap open android  # Puis Run dans Android Studio
```

---

## Erreurs Courantes

### "Unsupported class file major version 69"
→ Vous utilisez Java 25+. Installer JDK 17 ou JDK 21.

### "The Capacitor CLI needs to run at the root of an npm package"
→ Exécutez `npx cap` depuis la racine du projet, pas depuis `/android`.

### Build échoue après changement de JDK
```bash
cd android
./gradlew clean
./gradlew --stop
cd ..
npx cap sync android
```

### Android Studio utilise le mauvais JDK
→ File → Invalidate Caches → Restart

### Gradle ne trouve pas Java
→ Vérifiez que le chemin dans `android/gradle.properties` est correct:
```bash
# Trouver le chemin Java sur macOS
/usr/libexec/java_home -v 17
/usr/libexec/java_home -v 21
```
