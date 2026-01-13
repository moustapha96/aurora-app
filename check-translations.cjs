const fs = require('fs');
const path = require('path');

// Lire tous les fichiers de traduction
const localesDir = path.join(__dirname, 'src', 'locales');
const files = ['fr.ts', 'en.ts', 'es.ts', 'de.ts', 'it.ts', 'pt.ts', 'ar.ts', 'zh.ts', 'ja.ts', 'ru.ts'];

// Fonction pour extraire les clés d'un fichier
function extractKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const keys = [];
  const regex = /^\s+(\w+):\s*["']/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1] !== 'locale') {
      keys.push(match[1]);
    }
  }
  return keys;
}

// Fonction pour extraire une valeur d'une clé
function extractValue(filePath, key) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp(`^\\s+${key}:\\s*["']([^"']+)["']`, 'm');
  const match = content.match(regex);
  if (match) {
    return match[1];
  }
  // Essayer avec des valeurs multilignes
  const multilineRegex = new RegExp(`^\\s+${key}:\\s*["']([^"']*(?:\\\\.[^"']*)*)["']`, 'm');
  const multilineMatch = content.match(multilineRegex);
  if (multilineMatch) {
    return multilineMatch[1];
  }
  return null;
}

// Lire les clés de référence (français)
const frPath = path.join(localesDir, 'fr.ts');
const frKeys = extractKeys(frPath);
console.log(`Total keys in fr.ts: ${frKeys.length}`);

// Vérifier chaque fichier
files.forEach(file => {
  if (file === 'fr.ts') return;
  
  const filePath = path.join(localesDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`\n${file}: FILE NOT FOUND`);
    return;
  }
  
  const keys = extractKeys(filePath);
  const missingKeys = frKeys.filter(k => !keys.includes(k));
  
  console.log(`\n${file}:`);
  console.log(`  Total keys: ${keys.length}`);
  console.log(`  Missing keys: ${missingKeys.length}`);
  if (missingKeys.length > 0 && missingKeys.length <= 20) {
    console.log(`  Missing: ${missingKeys.join(', ')}`);
  } else if (missingKeys.length > 20) {
    console.log(`  Missing (first 20): ${missingKeys.slice(0, 20).join(', ')}...`);
  }
});
