/**
 * Script pour ajouter automatiquement les permissions iOS dans Info.plist
 * Exécuter après: npx cap add ios
 * 
 * Usage: node scripts/setup-ios-permissions.cjs
 */

const fs = require('fs');
const path = require('path');

const PLIST_PATH = path.join(__dirname, '..', 'ios', 'App', 'App', 'Info.plist');

const PERMISSIONS_TO_ADD = `
	<!-- ============================================ -->
	<!-- AURORA SOCIETY PERMISSIONS                   -->
	<!-- ============================================ -->
	
	<!-- Face ID / Touch ID - Biometric Authentication -->
	<key>NSFaceIDUsageDescription</key>
	<string>Aurora Society utilise Face ID pour sécuriser votre compte</string>
	
	<!-- Camera - For document scanning and profile photos -->
	<key>NSCameraUsageDescription</key>
	<string>Aurora Society a besoin de la caméra pour scanner vos documents et photos de profil</string>
	
	<!-- Photo Library (read) - For uploading images -->
	<key>NSPhotoLibraryUsageDescription</key>
	<string>Aurora Society a besoin d'accéder à vos photos pour télécharger des images</string>
	
	<!-- Photo Library (write) - For saving images -->
	<key>NSPhotoLibraryAddUsageDescription</key>
	<string>Aurora Society a besoin d'enregistrer des photos dans votre bibliothèque</string>
`;

function setupIOSPermissions() {
  console.log('🍎 Configuration des permissions iOS...\n');

  // Check if iOS folder exists
  if (!fs.existsSync(PLIST_PATH)) {
    console.error('❌ Erreur: Info.plist non trouvé.');
    console.log('   Assurez-vous d\'avoir exécuté: npx cap add ios');
    console.log(`   Chemin attendu: ${PLIST_PATH}`);
    process.exit(1);
  }

  // Read current Info.plist
  let plistContent = fs.readFileSync(PLIST_PATH, 'utf8');

  // Check if permissions already added
  if (plistContent.includes('NSFaceIDUsageDescription')) {
    console.log('✅ Les permissions sont déjà configurées dans Info.plist');
    return;
  }

  // Find the last </dict> and insert permissions before it
  const lastDictIndex = plistContent.lastIndexOf('</dict>');
  
  if (lastDictIndex === -1) {
    console.error('❌ Erreur: Structure Info.plist invalide');
    process.exit(1);
  }

  // Insert permissions before the last </dict>
  plistContent = 
    plistContent.slice(0, lastDictIndex) + 
    PERMISSIONS_TO_ADD + 
    '\n' +
    plistContent.slice(lastDictIndex);

  // Write updated Info.plist
  fs.writeFileSync(PLIST_PATH, plistContent, 'utf8');

  console.log('✅ Permissions ajoutées avec succès dans Info.plist:\n');
  console.log('   • NSFaceIDUsageDescription (Face ID/Touch ID)');
  console.log('   • NSCameraUsageDescription (Caméra)');
  console.log('   • NSPhotoLibraryUsageDescription (Photos - lecture)');
  console.log('   • NSPhotoLibraryAddUsageDescription (Photos - écriture)');
  console.log('\n📋 Prochaines étapes:');
  console.log('   1. npx cap open ios');
  console.log('   2. Dans Xcode → Signing & Capabilities:');
  console.log('      - Sélectionner votre Team');
  console.log('      - Ajouter "Keychain Sharing" capability');
  console.log('      - Ajouter "Face ID" capability (si disponible)');
}

setupIOSPermissions();
