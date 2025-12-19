# 🐳 Guide de Déploiement Docker
## Système de Prédiction Master avec Docker Swarm

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Déploiement](#déploiement)
6. [Gestion du Cluster](#gestion-du-cluster)
7. [Monitoring](#monitoring)
8. [Dépannage](#dépannage)
9. [Maintenance](#maintenance)

---

## 🎯 Prérequis

### Système d'Exploitation
- **Linux** : Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **Windows** : Windows Server 2019+ avec WSL2
- **macOS** : macOS 11+ (développement uniquement)

### Logiciels Requis
```bash
# Docker Engine 24.0+
docker --version

# Docker Compose 2.20+
docker compose version

# Git
git --version
```

### Ressources Minimales

#### Pour Développement (1 serveur)
- **CPU** : 4 cores
- **RAM** : 8 GB
- **Disque** : 50 GB SSD
- **Réseau** : 100 Mbps

#### Pour Production (Cluster)
- **Manager Nodes** (2) : 2 CPU, 4 GB RAM, 50 GB SSD chacun
- **Worker Nodes** (3) : 4 CPU, 8 GB RAM, 100 GB SSD chacun
- **Database Node** : 4 CPU, 16 GB RAM, 200 GB SSD
- **Réseau** : 1 Gbps

---

## 🏗️ Architecture

### Vue d'Ensemble

```
Internet
   ↓
Nginx Load Balancer (2 réplicas)
   ↓
├─→ Laravel Backend (3 réplicas)
│   ├─→ MySQL Cluster (1 master + 2 replicas)
│   ├─→ Redis Cache (1 master + 1 replica)
│   └─→ Python ML Service (3 réplicas)
│
└─→ React Frontend (2 réplicas)
```

### Composants

| Service | Image | Réplicas | Port | Rôle |
|---------|-------|----------|------|------|
| Nginx | nginx:alpine | 2 | 80, 443 | Load Balancer |
| Laravel | esudelib/laravel | 3 | 9000 | Backend API |
| ML Service | esudelib/ml-service | 3 | 5000 | Prédictions ML |
| Frontend | esudelib/frontend | 2 | 3000 | Interface React |
| MySQL | mysql:8.0 | 3 | 3306 | Base de données |
| Redis | redis:7-alpine | 2 | 6379 | Cache & Queue |
| Prometheus | prom/prometheus | 1 | 9090 | Métriques |
| Grafana | grafana/grafana | 1 | 3001 | Dashboards |
| Portainer | portainer/portainer-ce | 1 | 9443 | Management |

---

## 📥 Installation

### 1. Installer Docker

#### Ubuntu/Debian
```bash
# Désinstaller les anciennes versions
sudo apt-get remove docker docker-engine docker.io containerd runc

# Installer les dépendances
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Ajouter la clé GPG Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Ajouter le repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Vérifier l'installation
sudo docker run hello-world
```

#### CentOS/RHEL
```bash
# Installer les dépendances
sudo yum install -y yum-utils

# Ajouter le repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Installer Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Démarrer Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Cloner le Projet

```bash
# Cloner le repository
git clone https://github.com/votre-org/esudelib-react.git
cd esudelib-react

# Vérifier les fichiers Docker
ls -la Dockerfile.* docker-compose.yml
```

---

## ⚙️ Configuration

### 1. Variables d'Environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer les variables
nano .env
```

**Variables importantes** :
```bash
# Application
APP_NAME="esudelib"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://votre-domaine.com

# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=esudelib_db
DB_USERNAME=esudelib_user
DB_PASSWORD=VotreMotDePasseSecurise123!

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=VotreMotDePasseRedis123!
REDIS_PORT=6379

# Python ML
PYTHON_PATH=/usr/bin/python3
```

### 2. Créer les Secrets Docker

```bash
# Créer les secrets pour Docker Swarm
echo "VotreMotDePasseSecurise123!" | docker secret create db_password -
echo "VotreMotDePasseRootMySQL123!" | docker secret create db_root_password -
echo "VotreMotDePasseRedis123!" | docker secret create redis_password -
php artisan key:generate --show | docker secret create app_key -

# Vérifier les secrets
docker secret ls
```

### 3. Préparer les Volumes

```bash
# Créer les répertoires pour les volumes
sudo mkdir -p /docker/volumes/{mysql,redis,ml_models,app_storage,logs}

# Définir les permissions
sudo chown -R 1000:1000 /docker/volumes
```

---

## 🚀 Déploiement

### Mode Développement (Single Node)

```bash
# Build des images
docker compose build

# Démarrer les services
docker compose up -d

# Vérifier les services
docker compose ps

# Voir les logs
docker compose logs -f laravel
```

### Mode Production (Docker Swarm)

#### 1. Initialiser le Swarm

```bash
# Sur le premier manager node
docker swarm init --advertise-addr <IP_MANAGER>

# Récupérer le token pour les workers
docker swarm join-token worker

# Récupérer le token pour les managers
docker swarm join-token manager
```

#### 2. Ajouter les Nodes

```bash
# Sur chaque worker node
docker swarm join --token <WORKER_TOKEN> <IP_MANAGER>:2377

# Sur le second manager node
docker swarm join --token <MANAGER_TOKEN> <IP_MANAGER>:2377

# Vérifier les nodes
docker node ls
```

#### 3. Labelliser les Nodes

```bash
# Labelliser pour la base de données
docker node update --label-add database=primary <NODE_ID_DB_PRIMARY>
docker node update --label-add database=replica <NODE_ID_DB_REPLICA_1>
docker node update --label-add database=replica <NODE_ID_DB_REPLICA_2>

# Labelliser pour le cache
docker node update --label-add cache=primary <NODE_ID_CACHE_PRIMARY>
docker node update --label-add cache=replica <NODE_ID_CACHE_REPLICA>
```

#### 4. Déployer la Stack

```bash
# Build et push des images vers un registry
docker compose build
docker compose push

# Déployer la stack
docker stack deploy -c docker-compose.yml esudelib

# Vérifier le déploiement
docker stack services esudelib
docker stack ps esudelib
```

### 5. Initialiser l'Application

```bash
# Exécuter les migrations
docker exec -it $(docker ps -q -f name=esudelib_laravel) php artisan migrate --force

# Générer le dataset ML
docker exec -it $(docker ps -q -f name=esudelib_laravel) php artisan master:generate-dataset --count=20000

# Optimiser Laravel
docker exec -it $(docker ps -q -f name=esudelib_laravel) php artisan config:cache
docker exec -it $(docker ps -q -f name=esudelib_laravel) php artisan route:cache
docker exec -it $(docker ps -q -f name=esudelib_laravel) php artisan view:cache
```

---

## 🎛️ Gestion du Cluster

### Scaler les Services

```bash
# Scaler Laravel
docker service scale esudelib_laravel=5

# Scaler ML Service
docker service scale esudelib_ml_service=5

# Scaler Frontend
docker service scale esudelib_frontend=3
```

### Mettre à Jour un Service

```bash
# Update avec rolling update
docker service update --image esudelib/laravel:v2.0 esudelib_laravel

# Rollback si problème
docker service rollback esudelib_laravel
```

### Voir les Logs

```bash
# Logs d'un service
docker service logs -f esudelib_laravel

# Logs d'un conteneur spécifique
docker logs -f <CONTAINER_ID>

# Logs avec timestamp
docker service logs --timestamps esudelib_laravel
```

---

## 📊 Monitoring

### Accéder aux Dashboards

- **Portainer** : https://votre-domaine.com:9443
- **Grafana** : https://votre-domaine.com:3001
- **Prometheus** : https://votre-domaine.com:9090

### Métriques Importantes

#### Santé des Services
```bash
# Vérifier la santé
docker service ps esudelib_laravel --filter "desired-state=running"

# Voir les réplicas
docker service ls
```

#### Utilisation des Ressources
```bash
# Stats en temps réel
docker stats

# Stats d'un service
docker service ps esudelib_laravel
```

---

## 🔧 Dépannage

### Problèmes Courants

#### 1. Service ne démarre pas

```bash
# Voir les logs détaillés
docker service logs esudelib_laravel

# Inspecter le service
docker service inspect esudelib_laravel

# Vérifier les contraintes
docker service ps esudelib_laravel --no-trunc
```

#### 2. Problème de connexion à la base de données

```bash
# Tester la connexion
docker exec -it $(docker ps -q -f name=esudelib_laravel) php artisan tinker
>>> DB::connection()->getPdo();

# Vérifier MySQL
docker exec -it $(docker ps -q -f name=esudelib_mysql) mysql -u root -p
```

#### 3. Modèle ML non trouvé

```bash
# Vérifier le volume
docker volume inspect esudelib_ml_models

# Lister les fichiers
docker exec -it $(docker ps -q -f name=esudelib_ml_service) ls -la /app/models

# Réentraîner le modèle
# Via l'interface web ou :
docker exec -it $(docker ps -q -f name=esudelib_laravel) php artisan master:train-model
```

#### 4. Erreur de permissions

```bash
# Corriger les permissions Laravel
docker exec -it $(docker ps -q -f name=esudelib_laravel) chown -R www-data:www-data /var/www/html/storage
docker exec -it $(docker ps -q -f name=esudelib_laravel) chmod -R 755 /var/www/html/storage
```

---

## 🔄 Maintenance

### Backup

#### Base de Données
```bash
# Backup MySQL
docker exec $(docker ps -q -f name=esudelib_mysql) \
  mysqldump -u root -p${DB_ROOT_PASSWORD} esudelib_db > backup_$(date +%Y%m%d).sql

# Restaurer
docker exec -i $(docker ps -q -f name=esudelib_mysql) \
  mysql -u root -p${DB_ROOT_PASSWORD} esudelib_db < backup_20251216.sql
```

#### Volumes
```bash
# Backup d'un volume
docker run --rm -v esudelib_ml_models:/data -v $(pwd):/backup \
  alpine tar czf /backup/ml_models_backup.tar.gz -C /data .

# Restaurer
docker run --rm -v esudelib_ml_models:/data -v $(pwd):/backup \
  alpine tar xzf /backup/ml_models_backup.tar.gz -C /data
```

### Nettoyage

```bash
# Nettoyer les images inutilisées
docker image prune -a

# Nettoyer les volumes inutilisés
docker volume prune

# Nettoyer tout
docker system prune -a --volumes
```

### Mise à Jour

```bash
# Pull des nouvelles images
docker compose pull

# Redéployer
docker stack deploy -c docker-compose.yml esudelib

# Vérifier
docker stack ps esudelib
```

---

## 📚 Commandes Utiles

### Docker Swarm

```bash
# Lister les nodes
docker node ls

# Promouvoir un worker en manager
docker node promote <NODE_ID>

# Rétrograder un manager
docker node demote <NODE_ID>

# Drainer un node (maintenance)
docker node update --availability drain <NODE_ID>

# Réactiver un node
docker node update --availability active <NODE_ID>
```

### Services

```bash
# Lister tous les services
docker service ls

# Inspecter un service
docker service inspect esudelib_laravel

# Voir les tâches d'un service
docker service ps esudelib_laravel

# Supprimer un service
docker service rm esudelib_laravel
```

### Stack

```bash
# Lister les stacks
docker stack ls

# Voir les services d'une stack
docker stack services esudelib

# Voir les tâches d'une stack
docker stack ps esudelib

# Supprimer une stack
docker stack rm esudelib
```

---

## 🔒 Sécurité

### Best Practices

1. **Utiliser des secrets** pour les mots de passe
2. **Activer TLS** pour toutes les communications
3. **Limiter les ports exposés** (seulement 80/443)
4. **Utiliser des images officielles** ou vérifiées
5. **Scanner les images** pour les vulnérabilités
6. **Mettre à jour régulièrement** les images
7. **Utiliser des utilisateurs non-root** dans les conteneurs
8. **Activer les logs** et le monitoring

### Scanner les Vulnérabilités

```bash
# Avec Trivy
trivy image esudelib/laravel:latest

# Avec Docker Scout
docker scout cves esudelib/laravel:latest
```

---

## 📞 Support

### Logs Centralisés

Tous les logs sont disponibles dans :
- **Application** : `/docker/volumes/logs/`
- **Docker** : `docker service logs <service>`
- **Grafana** : https://votre-domaine.com:3001

### Contacts

- **Documentation** : `/docs`
- **Issues** : GitHub Issues
- **Email** : support@esudelib.com

---

**Version** : 1.0.0  
**Date** : 16 décembre 2025  
**Auteur** : Équipe esudelib  
**License** : MIT
