# Jury Module - Database

## Migrations

### 2025_12_09_000001_create_master_predictions_table.php

Crée les tables pour le système d'analyse prédictive des filières de Master :

#### Table `master_predictions`

Stocke les prédictions générées pour chaque étudiant.

**Colonnes** :
- `id` - Identifiant unique
- `student_id` - Référence à l'étudiant
- `age` - Âge de l'étudiant
- `provenance` - Ville/Province d'origine
- `intention_expressed` - Filière souhaitée
- `optional_courses` - Cours non obligatoires suivis (JSON)
- `internships` - Stages effectués (JSON)
- `predicted_master` - Filière prédite
- `confidence_score` - Score de confiance (0-100)
- `prediction_details` - Détails de la prédiction (JSON)
- `predicted_at` - Date de la prédiction
- `created_at` / `updated_at` - Timestamps

#### Table `master_training_dataset`

Stocke le dataset d'entraînement pour le modèle d'IA.

**Colonnes** :
- `id` - Identifiant unique
- `age` - Âge
- `provenance` - Provenance
- `intention_expressed` - Intention
- `optional_courses` - Cours optionnels (JSON)
- `internships` - Stages (JSON)
- `average_grade` - Moyenne générale
- `grades_by_subject` - Notes par matière (JSON)
- `actual_master` - Filière réellement suivie
- `is_synthetic` - Données synthétiques ou réelles
- `created_at` / `updated_at` - Timestamps

## Seeders

Aucun seeder pour le moment. Le dataset est généré via la commande Artisan :

```bash
php artisan master:generate-dataset --count=20000
```

## Factories

Aucune factory pour le moment.

## Utilisation

### Exécuter les migrations

```bash
php artisan migrate
```

### Générer le dataset

```bash
php artisan master:generate-dataset --count=20000
```

### Vérifier les données

```bash
php artisan tinker
```

```php
// Nombre de prédictions
Modules\Jury\Entities\MasterPrediction::count();

// Nombre d'enregistrements dans le dataset
Modules\Jury\Entities\MasterTrainingDataset::count();

// Dernière prédiction
Modules\Jury\Entities\MasterPrediction::latest()->first();
```

## Documentation

Pour plus d'informations, consultez :
- `INSTALLATION_PREDICTION.md` - Guide d'installation
- `storage/ml/README.md` - Documentation technique
- `GUIDE_JURY_PREDICTION.md` - Guide utilisateur
