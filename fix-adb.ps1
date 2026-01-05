# Script pour corriger les problemes ADB
# Usage: .\fix-adb.ps1

Write-Host "Correction des problemes ADB..." -ForegroundColor Cyan
Write-Host ""

# 1. Tuer tous les processus ADB
Write-Host "1. Arret des processus ADB..." -ForegroundColor Yellow
$processes = Get-Process -Name adb -ErrorAction SilentlyContinue
if ($processes) {
    taskkill /F /IM adb.exe 2>$null | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "   OK Processus ADB termines" -ForegroundColor Green
} else {
    Write-Host "   Aucun processus ADB en cours" -ForegroundColor Gray
}

# 2. Redemarrer le serveur ADB
Write-Host ""
Write-Host "2. Redemarrage du serveur ADB..." -ForegroundColor Yellow
$adbPath = "C:\Users\alhus\AppData\Local\Android\Sdk\platform-tools\adb.exe"

if (Test-Path $adbPath) {
    & $adbPath kill-server
    Start-Sleep -Seconds 2
    & $adbPath start-server
    Start-Sleep -Seconds 3
    Write-Host "   OK Serveur ADB redemarre" -ForegroundColor Green
} else {
    Write-Host "   ERREUR ADB non trouve a: $adbPath" -ForegroundColor Red
    exit 1
}

# 3. Lister les appareils
Write-Host ""
Write-Host "3. Verification des appareils connectes..." -ForegroundColor Yellow
$devices = & $adbPath devices
Write-Host ""
$devices

if ($devices -match "device$") {
    Write-Host ""
    Write-Host "OK Appareil(s) detecte(s) !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vous pouvez maintenant executer:" -ForegroundColor Cyan
    Write-Host "  npx cap run android" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "ATTENTION Aucun appareil detecte" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Solutions:" -ForegroundColor Cyan
    Write-Host "1. Ouvrir Android Studio" -ForegroundColor White
    Write-Host "2. Lancer un emulateur depuis Device Manager" -ForegroundColor White
    Write-Host "3. Ou connecter un appareil physique avec debogage USB active" -ForegroundColor White
    Write-Host ""
    Write-Host "Ensuite, vous pouvez:" -ForegroundColor Cyan
    Write-Host "  - Utiliser Android Studio directement (Recommandé): npx cap open android" -ForegroundColor White
    Write-Host "  - Ou reessayer: npx cap run android" -ForegroundColor White
}
