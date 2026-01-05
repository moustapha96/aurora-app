# Script pour corriger les problemes de deploiement Android
# Usage: .\scripts\fix-android-deploy.ps1

Write-Host "Correction du deploiement Android..." -ForegroundColor Cyan

# 1. Verifier que ADB est disponible
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
    Write-Host "ERREUR: ADB introuvable a $adbPath" -ForegroundColor Red
    Write-Host "Veuillez installer Android SDK Platform Tools" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK: ADB trouve" -ForegroundColor Green

# 2. Redemarrer le serveur ADB
Write-Host "Redemarrage du serveur ADB..." -ForegroundColor Yellow
& $adbPath kill-server
Start-Sleep -Seconds 2
& $adbPath start-server
Start-Sleep -Seconds 2

# 3. Verifier les appareils connectes
Write-Host "Verification des appareils connectes..." -ForegroundColor Yellow
$devices = & $adbPath devices | Select-String "device$" | ForEach-Object { ($_ -split "\s+")[0] }

if ($devices.Count -eq 0) {
    Write-Host "ERREUR: Aucun appareil connecte" -ForegroundColor Red
    Write-Host "Veuillez demarrer un emulateur ou connecter un appareil physique" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK: Appareils trouves: $($devices -join ', ')" -ForegroundColor Green

# 4. Pour chaque appareil, verifier l'etat
foreach ($device in $devices) {
    Write-Host "Verification de l'appareil $device..." -ForegroundColor Yellow
    
    # Verifier que l'appareil repond
    $deviceInfo = & $adbPath -s $device shell getprop ro.product.model 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: $device est en ligne (Modele: $deviceInfo)" -ForegroundColor Green
    } else {
        Write-Host "ATTENTION: $device ne repond pas correctement" -ForegroundColor Yellow
        Write-Host "Tentative de reinitialisation..." -ForegroundColor Yellow
        & $adbPath -s $device reconnect
        Start-Sleep -Seconds 2
    }
}

# 5. Desinstaller l'ancienne version si necessaire (optionnel)
$packageName = "app.lovable.e6cb71785bb7428786ce0e9ee3ec0082"
Write-Host "Verification de l'installation existante..." -ForegroundColor Yellow

foreach ($device in $devices) {
    $installed = & $adbPath -s $device shell pm list packages $packageName 2>&1
    if ($installed -match $packageName) {
        Write-Host "Application trouvee sur $device" -ForegroundColor Cyan
        Write-Host "Pour forcer la reinstallation, utilisez: npx cap run android" -ForegroundColor Yellow
    }
}

# 6. Instructions pour redeployer
Write-Host ""
Write-Host "Preparation terminee!" -ForegroundColor Green
Write-Host ""
Write-Host "Commandes pour redeployer:" -ForegroundColor Cyan
Write-Host "   npx cap sync android" -ForegroundColor White
Write-Host "   npx cap run android" -ForegroundColor White
Write-Host ""
Write-Host "Ou avec Gradle directement:" -ForegroundColor Cyan
Write-Host "   cd android" -ForegroundColor White
Write-Host "   .\gradlew installDebug" -ForegroundColor White
