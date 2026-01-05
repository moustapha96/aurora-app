/**
 * Script pour configurer automatiquement JAVA_HOME pour Android
 * Détecte l'OS et configure gradle.properties
 * 
 * Usage: node scripts/setup-android-java.cjs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const GRADLE_PROPS_PATH = path.join(__dirname, '..', 'android', 'gradle.properties');

// Common Java 17 paths by OS
const JAVA_PATHS = {
  win32: [
    'C:\\Program Files\\Java\\jdk-17',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.11.9-hotspot',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.12.7-hotspot',
    'C:\\Program Files\\Microsoft\\jdk-17.0.11.9-hotspot',
    'C:\\Program Files\\Amazon Corretto\\jdk17.0.11_9',
    'C:\\Program Files\\Zulu\\zulu-17',
  ],
  darwin: [
    '/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home',
    '/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home',
    '/Library/Java/JavaVirtualMachines/adoptopenjdk-17.jdk/Contents/Home',
    '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home',
    '/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home',
  ],
  linux: [
    '/usr/lib/jvm/java-17-openjdk-amd64',
    '/usr/lib/jvm/java-17-openjdk',
    '/usr/lib/jvm/temurin-17-jdk-amd64',
    '/usr/lib/jvm/zulu-17',
  ],
};

function findJavaHome() {
  const platform = os.platform();
  
  // First check JAVA_HOME env variable
  if (process.env.JAVA_HOME) {
    const javaVersion = getJavaVersion(process.env.JAVA_HOME);
    if (javaVersion && javaVersion.startsWith('17')) {
      return process.env.JAVA_HOME;
    }
  }

  // Check common paths
  const paths = JAVA_PATHS[platform] || [];
  for (const javaPath of paths) {
    if (fs.existsSync(javaPath)) {
      const version = getJavaVersion(javaPath);
      if (version && version.startsWith('17')) {
        return javaPath;
      }
    }
  }

  return null;
}

function getJavaVersion(javaHome) {
  try {
    const javaExe = os.platform() === 'win32' 
      ? path.join(javaHome, 'bin', 'java.exe')
      : path.join(javaHome, 'bin', 'java');
    
    if (!fs.existsSync(javaExe)) return null;
    
    const output = execSync(`"${javaExe}" -version 2>&1`, { encoding: 'utf8' });
    const match = output.match(/version "(\d+)/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

function escapePathForGradle(javaPath) {
  // On Windows, escape backslashes for properties file
  if (os.platform() === 'win32') {
    return javaPath.replace(/\\/g, '\\\\');
  }
  return javaPath;
}

function setupAndroidJava() {
  console.log('🤖 Configuration de Java 17 pour Android...\n');

  // Check if android folder exists
  if (!fs.existsSync(GRADLE_PROPS_PATH)) {
    console.error('❌ Erreur: gradle.properties non trouvé.');
    console.log('   Assurez-vous d\'avoir exécuté: npx cap add android');
    process.exit(1);
  }

  // Find Java 17
  const javaHome = findJavaHome();
  
  if (!javaHome) {
    console.error('❌ Java 17 non trouvé sur votre système.\n');
    console.log('📥 Installez Java 17:');
    console.log('   • Windows: https://adoptium.net/temurin/releases/?version=17');
    console.log('   • macOS: brew install openjdk@17');
    console.log('   • Linux: sudo apt install openjdk-17-jdk');
    console.log('\n   Puis relancez ce script.');
    process.exit(1);
  }

  console.log(`✅ Java 17 trouvé: ${javaHome}\n`);

  // Read gradle.properties
  let gradleProps = fs.readFileSync(GRADLE_PROPS_PATH, 'utf8');

  // Check if already configured
  const escapedPath = escapePathForGradle(javaHome);
  const javaHomeLine = `org.gradle.java.home=${escapedPath}`;

  if (gradleProps.includes(javaHomeLine) && !gradleProps.includes(`#${javaHomeLine}`)) {
    console.log('✅ JAVA_HOME déjà configuré dans gradle.properties');
    return;
  }

  // Remove any existing org.gradle.java.home lines (commented or not)
  gradleProps = gradleProps.replace(/^#?\s*org\.gradle\.java\.home=.*$/gm, '');
  
  // Clean up extra empty lines
  gradleProps = gradleProps.replace(/\n{3,}/g, '\n\n');

  // Add the new JAVA_HOME at the end
  gradleProps = gradleProps.trim() + '\n\n# Java 17 - Auto-configured\norg.gradle.java.home=' + escapedPath + '\n';

  // Write updated gradle.properties
  fs.writeFileSync(GRADLE_PROPS_PATH, gradleProps, 'utf8');

  console.log('✅ gradle.properties mis à jour avec JAVA_HOME\n');
  console.log('📋 Prochaines étapes:');
  console.log('   1. npm run build');
  console.log('   2. npx cap sync android');
  console.log('   3. npx cap run android');
}

setupAndroidJava();
