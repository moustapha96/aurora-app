# Script pour corriger automatiquement capacitor.build.gradle apres npx cap sync
# Usage: .\fix-capacitor-java.ps1

$filePath = "android\app\capacitor.build.gradle"

if (Test-Path $filePath) {
    Write-Host "Correction de capacitor.build.gradle..." -ForegroundColor Yellow
    
    $content = Get-Content $filePath -Raw
    
    # Remplacer Java 21 par Java 17
    $content = $content -replace 'JavaVersion\.VERSION_21', 'JavaVersion.VERSION_17'
    
    Set-Content -Path $filePath -Value $content -NoNewline
    
    Write-Host "OK capacitor.build.gradle corrige (Java 17)" -ForegroundColor Green
} else {
    Write-Host "ERREUR Fichier non trouve: $filePath" -ForegroundColor Red
}

