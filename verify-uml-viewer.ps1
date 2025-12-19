# Script de Vérification du Module UML Viewer
# PowerShell Script pour Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MODULE UML VIEWER - VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0

# Fonction pour afficher les résultats
function Show-Result {
    param(
        [string]$Test,
        [bool]$Success,
        [string]$Message = ""
    )
    
    if ($Success) {
        Write-Host "[OK]" -ForegroundColor Green -NoNewline
        Write-Host " $Test" -ForegroundColor White
        if ($Message) {
            Write-Host "     $Message" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "[ERREUR]" -ForegroundColor Red -NoNewline
        Write-Host " $Test" -ForegroundColor White
        if ($Message) {
            Write-Host "     $Message" -ForegroundColor Yellow
        }
        $script:ErrorCount++
    }
}

function Show-Warning {
    param(
        [string]$Test,
        [string]$Message = ""
    )
    
    Write-Host "[ATTENTION]" -ForegroundColor Yellow -NoNewline
    Write-Host " $Test" -ForegroundColor White
    if ($Message) {
        Write-Host "     $Message" -ForegroundColor Gray
    }
    $script:WarningCount++
}

# 1. Vérifier les fichiers Backend
Write-Host "`n1. VERIFICATION DES FICHIERS BACKEND" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

$backendFiles = @(
    "Modules\UmlViewer\Http\Controllers\UmlViewerController.php",
    "Modules\UmlViewer\Services\DatabaseAnalyzer.php",
    "Modules\UmlViewer\Services\DiagramGenerators\ClassDiagramGenerator.php",
    "Modules\UmlViewer\Services\DiagramGenerators\DeploymentDiagramGenerator.php",
    "Modules\UmlViewer\Services\DiagramGenerators\PackagingDiagramGenerator.php",
    "Modules\UmlViewer\Services\DiagramGenerators\ComponentDiagramGenerator.php",
    "Modules\UmlViewer\Providers\UmlViewerServiceProvider.php",
    "Modules\UmlViewer\Providers\RouteServiceProvider.php",
    "Modules\UmlViewer\Routes\web.php",
    "Modules\UmlViewer\Config\config.php",
    "Modules\UmlViewer\module.json"
)

foreach ($file in $backendFiles) {
    $exists = Test-Path $file
    Show-Result "Fichier: $file" $exists
}

# 2. Vérifier les fichiers Frontend
Write-Host "`n2. VERIFICATION DES FICHIERS FRONTEND" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

$frontendFiles = @(
    "resources\js\pages\uml-viewer\index.tsx",
    "resources\js\pages\uml-viewer\components\DiagramViewer.tsx",
    "resources\js\pages\uml-viewer\components\ZoomControls.tsx",
    "resources\js\pages\uml-viewer\components\DiagramToolbar.tsx",
    "resources\js\pages\uml-viewer\components\CodeViewer.tsx",
    "resources\js\pages\uml-viewer\components\TableExplorer.tsx",
    "resources\js\pages\uml-viewer\components\StatisticsCard.tsx",
    "resources\js\pages\uml-viewer\hooks\useDiagram.ts",
    "resources\js\pages\uml-viewer\hooks\useZoom.ts",
    "resources\js\pages\uml-viewer\hooks\usePan.ts",
    "resources\js\pages\uml-viewer\types\diagram.ts",
    "resources\js\pages\uml-viewer\types\database.ts",
    "resources\js\pages\uml-viewer\utils\plantUMLEncoder.ts"
)

foreach ($file in $frontendFiles) {
    $exists = Test-Path $file
    Show-Result "Fichier: $file" $exists
}

# 3. Vérifier les routes Laravel
Write-Host "`n3. VERIFICATION DES ROUTES LARAVEL" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

try {
    $routes = php artisan route:list --json 2>$null | ConvertFrom-Json
    $umlRoutes = $routes | Where-Object { $_.uri -like "*uml-viewer*" }
    
    if ($umlRoutes.Count -ge 4) {
        Show-Result "Routes UML Viewer" $true "$($umlRoutes.Count) routes trouvées"
        foreach ($route in $umlRoutes) {
            Write-Host "     - $($route.method) $($route.uri)" -ForegroundColor Gray
        }
    }
    else {
        Show-Result "Routes UML Viewer" $false "Seulement $($umlRoutes.Count) routes trouvées (4 attendues)"
    }
}
catch {
    Show-Result "Routes Laravel" $false "Impossible de lister les routes"
}

# 4. Vérifier le module Laravel
Write-Host "`n4. VERIFICATION DU MODULE LARAVEL" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

try {
    $moduleList = php artisan module:list 2>$null
    if ($moduleList -match "UmlViewer") {
        Show-Result "Module UmlViewer" $true "Module détecté"
    }
    else {
        Show-Result "Module UmlViewer" $false "Module non détecté"
    }
}
catch {
    Show-Warning "Module Laravel" "Impossible de vérifier (commande module:list non disponible)"
}

# 5. Tester l'API Backend
Write-Host "`n5. TEST DE L'API BACKEND" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/test-uml" -Method GET -ErrorAction Stop
    
    if ($response.success) {
        Show-Result "API /test-uml" $true "Backend fonctionnel"
        Write-Host "     Tables: $($response.tables_count)" -ForegroundColor Gray
        Write-Host "     Relations: $($response.relations_count)" -ForegroundColor Gray
        Write-Host "     Modules: $($response.modules_count)" -ForegroundColor Gray
        Write-Host "     PlantUML: $($response.plantuml_length) caractères" -ForegroundColor Gray
    }
    else {
        Show-Result "API /test-uml" $false "API retourne success=false"
    }
}
catch {
    Show-Result "API /test-uml" $false "Impossible de contacter l'API (serveur Laravel lancé ?)"
}

# 6. Tester l'API de génération
Write-Host "`n6. TEST DE L'API DE GENERATION" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

try {
    $body = @{
        type    = "class"
        options = @{}
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
        "Accept"       = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:8000/uml-viewer/generate" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    if ($response.success -and $response.plantUML) {
        Show-Result "API /uml-viewer/generate" $true "Génération fonctionnelle"
        Write-Host "     Type: $($response.type)" -ForegroundColor Gray
        Write-Host "     PlantUML: $($response.plantUML.Length) caractères" -ForegroundColor Gray
    }
    else {
        Show-Result "API /uml-viewer/generate" $false "Réponse invalide"
    }
}
catch {
    Show-Result "API /uml-viewer/generate" $false "Erreur: $($_.Exception.Message)"
}

# 7. Vérifier TypeScript
Write-Host "`n7. VERIFICATION TYPESCRIPT" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

try {
    $tscOutput = npx tsc --noEmit 2>&1
    $umlErrors = $tscOutput | Select-String "uml-viewer"
    
    if ($umlErrors.Count -eq 0) {
        Show-Result "TypeScript (module UML)" $true "Aucune erreur TypeScript"
    }
    else {
        Show-Result "TypeScript (module UML)" $false "$($umlErrors.Count) erreurs trouvées"
        $umlErrors | ForEach-Object {
            Write-Host "     $_" -ForegroundColor Yellow
        }
    }
}
catch {
    Show-Warning "TypeScript" "Impossible de vérifier (npx tsc non disponible)"
}

# 8. Vérifier les processus
Write-Host "`n8. VERIFICATION DES PROCESSUS" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

$nodeProcess = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcess) {
    Show-Result "Processus Node (Vite)" $true "npm run dev en cours"
}
else {
    Show-Result "Processus Node (Vite)" $false "npm run dev n'est pas lancé"
}

$phpProcess = Get-Process php -ErrorAction SilentlyContinue
if ($phpProcess) {
    Show-Result "Processus PHP" $true "php artisan serve en cours"
}
else {
    Show-Result "Processus PHP" $false "php artisan serve n'est pas lancé"
}

# 9. Vérifier les permissions
Write-Host "`n9. VERIFICATION DES PERMISSIONS" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

$storageWritable = Test-Path "storage" -PathType Container
if ($storageWritable) {
    try {
        $testFile = "storage\test_write.tmp"
        "test" | Out-File $testFile -ErrorAction Stop
        Remove-Item $testFile -ErrorAction SilentlyContinue
        Show-Result "Permissions storage/" $true "Écriture possible"
    }
    catch {
        Show-Result "Permissions storage/" $false "Impossible d'écrire"
    }
}
else {
    Show-Result "Dossier storage/" $false "Dossier non trouvé"
}

# 10. Résumé
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESUME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "`n✅ TOUT EST OK !" -ForegroundColor Green
    Write-Host "Le module UML Viewer est correctement installé et fonctionnel." -ForegroundColor Green
}
elseif ($ErrorCount -eq 0) {
    Write-Host "`n⚠️  QUELQUES AVERTISSEMENTS" -ForegroundColor Yellow
    Write-Host "$WarningCount avertissement(s) détecté(s)" -ForegroundColor Yellow
    Write-Host "Le module devrait fonctionner mais vérifiez les avertissements." -ForegroundColor Yellow
}
else {
    Write-Host "`n❌ ERREURS DETECTEES" -ForegroundColor Red
    Write-Host "$ErrorCount erreur(s) et $WarningCount avertissement(s) détecté(s)" -ForegroundColor Red
    Write-Host "Corrigez les erreurs avant d'utiliser le module." -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host ""

# Proposer des actions
if ($ErrorCount -gt 0) {
    Write-Host "ACTIONS RECOMMANDEES:" -ForegroundColor Yellow
    Write-Host "1. Exécuter: php artisan optimize:clear" -ForegroundColor White
    Write-Host "2. Exécuter: composer dump-autoload" -ForegroundColor White
    Write-Host "3. Redémarrer les serveurs (npm run dev et php artisan serve)" -ForegroundColor White
    Write-Host ""
}

# Retourner le code d'erreur
exit $ErrorCount
