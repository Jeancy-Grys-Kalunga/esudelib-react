# ========================================
# Script de Déploiement PowerShell
# Système de Prédiction Master - Docker
# ========================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev','prod')]
    [string]$Mode = 'dev'
)

# Fonctions d'affichage
function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

# ========================================
# CONFIGURATION
# ========================================

Write-Header "Configuration du Déploiement"
Write-Info "Mode: $Mode"

# ========================================
# VÉRIFICATIONS PRÉALABLES
# ========================================

Write-Header "Vérifications Préalables"

# Vérifier Docker
try {
    $dockerVersion = docker --version
    Write-Success "Docker installé: $dockerVersion"
} catch {
    Write-Error-Custom "Docker n'est pas installé"
    exit 1
}

# Vérifier Docker Compose
try {
    $composeVersion = docker compose version
    Write-Success "Docker Compose installé: $composeVersion"
} catch {
    Write-Error-Custom "Docker Compose n'est pas installé"
    exit 1
}

# Vérifier .env
if (-not (Test-Path .env)) {
    Write-Warning-Custom "Fichier .env non trouvé"
    if (Test-Path .env.example) {
        Write-Info "Copie de .env.example vers .env"
        Copy-Item .env.example .env
        Write-Warning-Custom "Veuillez éditer le fichier .env avant de continuer"
        Read-Host "Appuyez sur Entrée après avoir édité .env"
    } else {
        Write-Error-Custom "Fichier .env.example non trouvé"
        exit 1
    }
}
Write-Success "Fichier .env trouvé"

# ========================================
# MODE DÉVELOPPEMENT
# ========================================

if ($Mode -eq 'dev') {
    Write-Header "Déploiement en Mode Développement"
    
    # Build images
    Write-Info "Build des images Docker..."
    docker compose build
    Write-Success "Images buildées"
    
    # Start services
    Write-Info "Démarrage des services..."
    docker compose up -d
    Write-Success "Services démarrés"
    
    # Wait for services
    Write-Info "Attente du démarrage des services (30s)..."
    Start-Sleep -Seconds 30
    
    # Check services
    Write-Info "Vérification des services..."
    docker compose ps
    
    # Run migrations
    Write-Info "Exécution des migrations..."
    docker compose exec -T laravel php artisan migrate --force
    Write-Success "Migrations exécutées"
    
    # Generate dataset
    $generateDataset = Read-Host "Générer le dataset ML? (y/n)"
    if ($generateDataset -eq 'y') {
        Write-Info "Génération du dataset (cela peut prendre quelques minutes)..."
        docker compose exec -T laravel php artisan master:generate-dataset --count=1000
        Write-Success "Dataset généré"
    }
    
    # Optimize Laravel
    Write-Info "Optimisation de Laravel..."
    docker compose exec -T laravel php artisan config:cache
    docker compose exec -T laravel php artisan route:cache
    docker compose exec -T laravel php artisan view:cache
    Write-Success "Laravel optimisé"
    
    Write-Header "Déploiement Terminé!"
    Write-Success "Application accessible sur http://localhost"
    Write-Info "Logs: docker compose logs -f"
    Write-Info "Arrêt: docker compose down"
}

# ========================================
# MODE PRODUCTION
# ========================================

if ($Mode -eq 'prod') {
    Write-Header "Déploiement en Mode Production"
    
    # Check Swarm
    $swarmInfo = docker info | Select-String "Swarm: active"
    if (-not $swarmInfo) {
        Write-Warning-Custom "Docker Swarm n'est pas initialisé"
        $initSwarm = Read-Host "Initialiser Swarm maintenant? (y/n)"
        if ($initSwarm -eq 'y') {
            Write-Info "Initialisation de Docker Swarm..."
            docker swarm init
            Write-Success "Swarm initialisé"
        } else {
            Write-Error-Custom "Swarm requis pour le déploiement en production"
            exit 1
        }
    }
    Write-Success "Docker Swarm actif"
    
    # Create secrets
    Write-Info "Création des secrets Docker..."
    
    # DB Password
    $secretExists = docker secret ls | Select-String "db_password"
    if (-not $secretExists) {
        $dbPassword = Read-Host "Mot de passe MySQL" -AsSecureString
        $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
        $dbPasswordPlain | docker secret create db_password -
        Write-Success "Secret db_password créé"
    } else {
        Write-Info "Secret db_password existe déjà"
    }
    
    # Build and deploy
    Write-Info "Build des images..."
    docker compose build
    Write-Success "Images buildées"
    
    Write-Info "Déploiement de la stack..."
    docker stack deploy -c docker-compose.yml esudelib
    Write-Success "Stack déployée"
    
    # Wait for services
    Write-Info "Attente du démarrage des services (60s)..."
    Start-Sleep -Seconds 60
    
    # Check services
    Write-Info "Vérification des services..."
    docker stack services esudelib
    
    Write-Header "Déploiement Terminé!"
    Write-Success "Stack déployée avec succès"
    Write-Info "Services: docker stack services esudelib"
    Write-Info "Logs: docker service logs esudelib_laravel"
}

# ========================================
# INFORMATIONS FINALES
# ========================================

Write-Header "Informations Utiles"
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  - Guide de déploiement: DOCKER_DEPLOYMENT_GUIDE.md"
Write-Host "  - Correction ML: FIX_ML_TRAINING_ISSUES.md"
Write-Host ""
Write-Host "🔧 Commandes utiles:" -ForegroundColor Cyan
if ($Mode -eq 'dev') {
    Write-Host "  - Voir les logs: docker compose logs -f"
    Write-Host "  - Arrêter: docker compose down"
} else {
    Write-Host "  - Voir les services: docker stack services esudelib"
    Write-Host "  - Voir les logs: docker service logs -f esudelib_laravel"
}
Write-Host ""
Write-Success "Déploiement terminé avec succès!"
