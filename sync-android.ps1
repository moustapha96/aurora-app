# Script pour synchroniser Android avec toutes les corrections
# Usage: .\sync-android.ps1

Write-Host "Synchronisation Android avec corrections automatiques..." -ForegroundColor Cyan
Write-Host ""

# 1. Build du projet web
Write-Host "1. Build du projet web..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR Build echoue" -ForegroundColor Red
    exit 1
}
Write-Host "   OK Build reussi" -ForegroundColor Green

# 2. Synchroniser avec Android
Write-Host ""
Write-Host "2. Synchronisation avec Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR Synchronisation echouee" -ForegroundColor Red
    exit 1
}
Write-Host "   OK Synchronisation reussie" -ForegroundColor Green

# 3. Corriger capacitor.build.gradle (Java 17)
Write-Host ""
Write-Host "3. Correction de capacitor.build.gradle (Java 17)..." -ForegroundColor Yellow
.\fix-capacitor-java.ps1

Write-Host ""
Write-Host "Synchronisation terminee avec succes !" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "  - Ouvrir dans Android Studio: npx cap open android" -ForegroundColor White
Write-Host "  - Ou lancer directement: npx cap run android" -ForegroundColor White

