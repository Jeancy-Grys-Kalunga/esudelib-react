#!/bin/bash

# ========================================
# Script de Déploiement Automatisé
# Système de Prédiction Master - Docker Swarm
# ========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Ne pas exécuter ce script en tant que root"
    exit 1
fi

# ========================================
# CONFIGURATION
# ========================================

print_header "Configuration du Déploiement"

# Mode de déploiement
read -p "Mode de déploiement (dev/prod): " DEPLOY_MODE
DEPLOY_MODE=${DEPLOY_MODE:-dev}

if [ "$DEPLOY_MODE" != "dev" ] && [ "$DEPLOY_MODE" != "prod" ]; then
    print_error "Mode invalide. Utilisez 'dev' ou 'prod'"
    exit 1
fi

print_info "Mode: $DEPLOY_MODE"

# ========================================
# VÉRIFICATIONS PRÉALABLES
# ========================================

print_header "Vérifications Préalables"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé"
    exit 1
fi
print_success "Docker installé: $(docker --version)"

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé"
    exit 1
fi
print_success "Docker Compose installé: $(docker compose version)"

# Check .env file
if [ ! -f .env ]; then
    print_warning "Fichier .env non trouvé"
    if [ -f .env.example ]; then
        print_info "Copie de .env.example vers .env"
        cp .env.example .env
        print_warning "Veuillez éditer le fichier .env avant de continuer"
        read -p "Appuyez sur Entrée après avoir édité .env..."
    else
        print_error "Fichier .env.example non trouvé"
        exit 1
    fi
fi
print_success "Fichier .env trouvé"

# ========================================
# MODE DÉVELOPPEMENT
# ========================================

if [ "$DEPLOY_MODE" == "dev" ]; then
    print_header "Déploiement en Mode Développement"
    
    # Build images
    print_info "Build des images Docker..."
    docker compose build
    print_success "Images buildées"
    
    # Start services
    print_info "Démarrage des services..."
    docker compose up -d
    print_success "Services démarrés"
    
    # Wait for services to be ready
    print_info "Attente du démarrage des services (30s)..."
    sleep 30
    
    # Check services
    print_info "Vérification des services..."
    docker compose ps
    
    # Run migrations
    print_info "Exécution des migrations..."
    docker compose exec -T laravel php artisan migrate --force
    print_success "Migrations exécutées"
    
    # Generate dataset
    read -p "Générer le dataset ML? (y/n): " GENERATE_DATASET
    if [ "$GENERATE_DATASET" == "y" ]; then
        print_info "Génération du dataset (cela peut prendre quelques minutes)..."
        docker compose exec -T laravel php artisan master:generate-dataset --count=1000
        print_success "Dataset généré"
    fi
    
    # Optimize Laravel
    print_info "Optimisation de Laravel..."
    docker compose exec -T laravel php artisan config:cache
    docker compose exec -T laravel php artisan route:cache
    docker compose exec -T laravel php artisan view:cache
    print_success "Laravel optimisé"
    
    print_header "Déploiement Terminé!"
    print_success "Application accessible sur http://localhost"
    print_info "Logs: docker compose logs -f"
    print_info "Arrêt: docker compose down"
fi

# ========================================
# MODE PRODUCTION
# ========================================

if [ "$DEPLOY_MODE" == "prod" ]; then
    print_header "Déploiement en Mode Production"
    
    # Check if Swarm is initialized
    if ! docker info | grep -q "Swarm: active"; then
        print_warning "Docker Swarm n'est pas initialisé"
        read -p "Initialiser Swarm maintenant? (y/n): " INIT_SWARM
        if [ "$INIT_SWARM" == "y" ]; then
            print_info "Initialisation de Docker Swarm..."
            docker swarm init
            print_success "Swarm initialisé"
        else
            print_error "Swarm requis pour le déploiement en production"
            exit 1
        fi
    fi
    print_success "Docker Swarm actif"
    
    # Create secrets
    print_info "Création des secrets Docker..."
    
    # DB Password
    if ! docker secret ls | grep -q "db_password"; then
        read -sp "Mot de passe MySQL: " DB_PASSWORD
        echo
        echo "$DB_PASSWORD" | docker secret create db_password -
        print_success "Secret db_password créé"
    else
        print_info "Secret db_password existe déjà"
    fi
    
    # DB Root Password
    if ! docker secret ls | grep -q "db_root_password"; then
        read -sp "Mot de passe root MySQL: " DB_ROOT_PASSWORD
        echo
        echo "$DB_ROOT_PASSWORD" | docker secret create db_root_password -
        print_success "Secret db_root_password créé"
    else
        print_info "Secret db_root_password existe déjà"
    fi
    
    # Redis Password
    if ! docker secret ls | grep -q "redis_password"; then
        read -sp "Mot de passe Redis: " REDIS_PASSWORD
        echo
        echo "$REDIS_PASSWORD" | docker secret create redis_password -
        print_success "Secret redis_password créé"
    else
        print_info "Secret redis_password existe déjà"
    fi
    
    # App Key
    if ! docker secret ls | grep -q "app_key"; then
        print_info "Génération de la clé d'application..."
        APP_KEY=$(docker run --rm esudelib/laravel php artisan key:generate --show)
        echo "$APP_KEY" | docker secret create app_key -
        print_success "Secret app_key créé"
    else
        print_info "Secret app_key existe déjà"
    fi
    
    # Label nodes
    print_info "Labellisation des nodes..."
    read -p "ID du node pour la base de données primaire: " DB_PRIMARY_NODE
    if [ -n "$DB_PRIMARY_NODE" ]; then
        docker node update --label-add database=primary "$DB_PRIMARY_NODE"
        print_success "Node $DB_PRIMARY_NODE labellisé pour database=primary"
    fi
    
    read -p "ID du node pour le cache primaire: " CACHE_PRIMARY_NODE
    if [ -n "$CACHE_PRIMARY_NODE" ]; then
        docker node update --label-add cache=primary "$CACHE_PRIMARY_NODE"
        print_success "Node $CACHE_PRIMARY_NODE labellisé pour cache=primary"
    fi
    
    # Build and push images
    print_info "Build des images..."
    docker compose build
    print_success "Images buildées"
    
    # Deploy stack
    print_info "Déploiement de la stack..."
    docker stack deploy -c docker-compose.yml esudelib
    print_success "Stack déployée"
    
    # Wait for services
    print_info "Attente du démarrage des services (60s)..."
    sleep 60
    
    # Check services
    print_info "Vérification des services..."
    docker stack services esudelib
    
    # Run migrations
    print_info "Exécution des migrations..."
    LARAVEL_CONTAINER=$(docker ps -q -f name=esudelib_laravel | head -n1)
    if [ -n "$LARAVEL_CONTAINER" ]; then
        docker exec -it "$LARAVEL_CONTAINER" php artisan migrate --force
        print_success "Migrations exécutées"
        
        # Generate dataset
        read -p "Générer le dataset ML? (y/n): " GENERATE_DATASET
        if [ "$GENERATE_DATASET" == "y" ]; then
            print_info "Génération du dataset (cela peut prendre plusieurs minutes)..."
            docker exec -it "$LARAVEL_CONTAINER" php artisan master:generate-dataset --count=20000
            print_success "Dataset généré"
        fi
        
        # Optimize Laravel
        print_info "Optimisation de Laravel..."
        docker exec -it "$LARAVEL_CONTAINER" php artisan config:cache
        docker exec -it "$LARAVEL_CONTAINER" php artisan route:cache
        docker exec -it "$LARAVEL_CONTAINER" php artisan view:cache
        print_success "Laravel optimisé"
    else
        print_warning "Conteneur Laravel non trouvé. Exécutez les migrations manuellement."
    fi
    
    print_header "Déploiement Terminé!"
    print_success "Stack déployée avec succès"
    print_info "Services: docker stack services esudelib"
    print_info "Logs: docker service logs esudelib_laravel"
    print_info "Scaling: docker service scale esudelib_laravel=5"
    print_info "Suppression: docker stack rm esudelib"
fi

# ========================================
# INFORMATIONS FINALES
# ========================================

print_header "Informations Utiles"

echo ""
echo "📚 Documentation:"
echo "  - Guide de déploiement: DOCKER_DEPLOYMENT_GUIDE.md"
echo "  - Correction ML: FIX_ML_TRAINING_ISSUES.md"
echo "  - Modèle UML: UML_CONCEPTUAL_MODEL.md"
echo "  - Architecture: UML_DEPLOYMENT_DIAGRAM.md"
echo ""
echo "🔧 Commandes utiles:"
if [ "$DEPLOY_MODE" == "dev" ]; then
    echo "  - Voir les logs: docker compose logs -f"
    echo "  - Arrêter: docker compose down"
    echo "  - Redémarrer: docker compose restart"
    echo "  - Shell Laravel: docker compose exec laravel bash"
else
    echo "  - Voir les services: docker stack services esudelib"
    echo "  - Voir les logs: docker service logs -f esudelib_laravel"
    echo "  - Scaler: docker service scale esudelib_laravel=5"
    echo "  - Supprimer: docker stack rm esudelib"
fi
echo ""
echo "🎯 Prochaines étapes:"
echo "  1. Vérifier que tous les services sont en cours d'exécution"
echo "  2. Accéder à l'application web"
echo "  3. Entraîner le modèle ML via l'interface"
echo "  4. Tester une prédiction"
echo ""

print_success "Déploiement terminé avec succès!"
