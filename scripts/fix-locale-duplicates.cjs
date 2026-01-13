/**
 * Script to fix duplicate keys in locale files
 * Run with: node scripts/fix-locale-duplicates.cjs
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const localeFiles = ['ar.ts', 'de.ts', 'en.ts', 'es.ts', 'fr.ts', 'it.ts', 'ja.ts', 'pt.ts', 'ru.ts', 'zh.ts'];

localeFiles.forEach(file => {
  const filePath = path.join(localesDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const seenKeys = new Map(); // key -> first line number
  const duplicateLines = new Set(); // line numbers to remove
  
  lines.forEach((line, index) => {
    // Match key: value pattern
    const match = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
    if (match) {
      const key = match[1];
      if (seenKeys.has(key)) {
        // This is a duplicate - mark for removal
        duplicateLines.add(index);
        console.log(`${file}: Duplicate key "${key}" at line ${index + 1} (first at line ${seenKeys.get(key) + 1})`);
      } else {
        seenKeys.set(key, index);
      }
    }
  });
  
  if (duplicateLines.size > 0) {
    // Remove duplicate lines
    const newLines = lines.filter((_, index) => !duplicateLines.has(index));
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log(`${file}: Removed ${duplicateLines.size} duplicate lines`);
  }
});

console.log('Done!');
