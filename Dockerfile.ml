# ========================================
# Dockerfile pour Python ML Service
# Python 3.11 avec scikit-learn et dépendances ML
# ========================================

FROM python:3.11-slim

LABEL maintainer="esudelib-team"
LABEL description="Python ML Service pour Prédiction Master"

# Variables d'environnement
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Installation des dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Créer le répertoire de travail
WORKDIR /app

# Copier les requirements
COPY storage/ml/requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code ML
COPY storage/ml/ .

# Créer les répertoires nécessaires
RUN mkdir -p /app/models \
    && mkdir -p /app/datasets \
    && mkdir -p /app/logs

# Créer un utilisateur non-root
RUN useradd -m -u 1000 mluser && \
    chown -R mluser:mluser /app

# Changer vers l'utilisateur non-root
USER mluser

# Exposer le port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import sys; sys.exit(0)" || exit 1

# Commande de démarrage (Flask API)
CMD ["python", "ml_api.py"]
