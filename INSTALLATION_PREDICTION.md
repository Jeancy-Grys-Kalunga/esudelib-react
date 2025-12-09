# Guide d'Installation - Système d'Analyse Prédictive des Filières de Master

## Prérequis

- PHP >= 8.1
- Python >= 3.8
- Composer
- Node.js & NPM

## Installation Rapide

### 1. Installer les dépendances Python

```bash
# Naviguer vers le dossier ML
cd storage/ml

# Installer les packages Python requis
pip install -r requirements.txt

# Vérifier l'installation
python master_prediction.py
```

### 2. Configurer l'environnement

Ajouter dans votre fichier `.env` :

```env
# Chemin vers Python (ajuster selon votre système)
PYTHON_PATH=python
# Ou pour Linux/Mac
# PYTHON_PATH=/usr/bin/python3
```

### 3. Exécuter les migrations

```bash
php artisan migrate
```

Cela créera les tables :
- `master_predictions` - Stocke les prédictions
- `master_training_dataset` - Dataset d'entraînement

### 4. Générer le dataset

```bash
php artisan master:generate-dataset --count=20000
```

Cette commande va :
- ✅ Extraire les données réelles des étudiants existants
- ✅ Générer des données synthétiques cohérentes
- ✅ Créer un dataset de 20 000 enregistrements

**Temps estimé** : 2-5 minutes

### 5. Entraîner le modèle

**Option A : Via l'interface web (Recommandé)**

1. Accéder à : `http://votre-domaine/jury/orientation-predictions`
2. Cliquer sur le bouton "Entraîner le modèle"
3. Attendre la confirmation (2-5 minutes)

**Option B : Via la ligne de commande**

```bash
php artisan tinker
```

Puis dans Tinker :

```php
app(Modules\Jury\Services\MasterPredictionService::class)->trainModel();
```

### 6. Tester le système

1. Accéder à l'interface : `/jury/orientation-predictions`
2. Cliquer sur "Analyser" pour un étudiant
3. Vérifier que la prédiction s'affiche correctement

## Vérification de l'Installation

### Test 1 : Python fonctionne

```bash
cd storage/ml
python --version
```

Devrait afficher : `Python 3.x.x`

### Test 2 : Packages Python installés

```bash
python -c "import numpy, sklearn, joblib; print('OK')"
```

Devrait afficher : `OK`

### Test 3 : Dataset généré

```bash
php artisan tinker
```

```php
Modules\Jury\Entities\MasterTrainingDataset::count();
```

Devrait afficher : `20000` (ou le nombre spécifié)

### Test 4 : Modèle entraîné

Vérifier que le fichier existe :
```bash
ls -la storage/ml/master_prediction_model.pkl
```

## Dépannage

### Erreur : "Python not found"

**Solution** :

1. Vérifier l'installation Python :
   ```bash
   python --version
   # ou
   python3 --version
   ```

2. Mettre à jour `.env` avec le bon chemin :
   ```env
   PYTHON_PATH=/usr/bin/python3
   ```

### Erreur : "Module 'numpy' not found"

**Solution** :

```bash
cd storage/ml
pip install -r requirements.txt
# ou
pip3 install -r requirements.txt
```

### Erreur : "Permission denied" sur Windows

**Solution** :

Exécuter le terminal en tant qu'administrateur

### Erreur : "Model file not found"

**Solution** :

Le modèle n'a pas été entraîné. Suivre l'étape 5.

### Erreur : "Dataset is empty"

**Solution** :

```bash
php artisan master:generate-dataset --count=20000
```

## Configuration Avancée

### Modifier le nombre d'enregistrements du dataset

```bash
php artisan master:generate-dataset --count=50000
```

### Utiliser un environnement virtuel Python (Recommandé)

```bash
cd storage/ml

# Créer l'environnement virtuel
python -m venv venv

# Activer (Windows)
venv\Scripts\activate

# Activer (Linux/Mac)
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Mettre à jour .env
PYTHON_PATH=storage/ml/venv/Scripts/python
```

### Ajuster les paramètres du modèle

Modifier dans `storage/ml/master_prediction.py` :

```python
self.model = GradientBoostingClassifier(
    n_estimators=200,      # Nombre d'arbres (augmenter pour plus de précision)
    learning_rate=0.1,     # Taux d'apprentissage
    max_depth=5,           # Profondeur maximale des arbres
    random_state=42
)
```

## Maintenance

### Réentraîner le modèle

Recommandé :
- Chaque début d'année académique
- Après ajout de nouvelles données réelles
- Si la précision diminue

```bash
# Via l'interface web
http://votre-domaine/jury/orientation-predictions
# Cliquer sur "Entraîner le modèle"
```

### Sauvegarder le modèle

```bash
# Le modèle est automatiquement sauvegardé dans :
storage/ml/master_prediction_model.pkl

# Faire une copie de sauvegarde
cp storage/ml/master_prediction_model.pkl storage/ml/master_prediction_model_backup.pkl
```

## Prochaines Étapes

1. ✅ Tester avec quelques étudiants
2. ✅ Analyser les résultats
3. ✅ Ajuster les paramètres si nécessaire
4. ✅ Former le jury à l'utilisation
5. ✅ Créer l'interface pour les étudiants (optionnel)

## Support

Pour toute question :
- Consulter `storage/ml/README.md`
- Vérifier les logs : `storage/logs/laravel.log`
- Contacter l'équipe de développement

## Checklist d'Installation

- [ ] Python installé et configuré
- [ ] Packages Python installés
- [ ] Variable PYTHON_PATH dans .env
- [ ] Migrations exécutées
- [ ] Dataset généré (20 000+ enregistrements)
- [ ] Modèle entraîné
- [ ] Test de prédiction réussi
- [ ] Interface accessible

Félicitations ! Le système est prêt à l'emploi. 🎉
