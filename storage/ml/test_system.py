#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de test pour le système d'analyse prédictive des filières de Master
"""

import json
import sys

def test_prediction():
    """Test de prédiction avec des données d'exemple"""
    
    # Données d'exemple pour un étudiant
    student_data = {
        'age': 22,
        'provenance': 'Kinshasa',
        'intention_expressed': 'Informatique',
        'optional_courses': ['Intelligence Artificielle', 'Big Data'],
        'internships': [
            {'company': 'Vodacom', 'duration_months': 3, 'year': 2024}
        ],
        'average_grade': 15.5,
        'grades_by_subject': {
            'Informatique': 17.5,
            'Mathématiques': 16.0,
            'Physique': 14.0,
            'Chimie': 12.0,
            'Sciences Humaines': 13.5,
            'Langues': 14.5,
            'Gestion': 13.0,
            'Droit': 12.5
        }
    }
    
    print("=" * 60)
    print("TEST DU SYSTÈME D'ANALYSE PRÉDICTIVE")
    print("=" * 60)
    print()
    print("Données de l'étudiant test:")
    print(json.dumps(student_data, indent=2, ensure_ascii=False))
    print()
    print("=" * 60)
    print()
    
    # Importer le service
    try:
        from master_prediction import MasterPredictionService
        print("✓ Module master_prediction importé avec succès")
    except ImportError as e:
        print(f"✗ Erreur d'import: {e}")
        print("\nVérifiez que vous êtes dans le bon répertoire:")
        print("  cd storage/ml")
        return False
    
    # Créer une instance du service
    try:
        service = MasterPredictionService()
        print("✓ Service MasterPredictionService créé")
    except Exception as e:
        print(f"✗ Erreur de création du service: {e}")
        return False
    
    # Tester la préparation des features
    try:
        features = service.prepare_features(student_data)
        print(f"✓ Features préparées: {features.shape}")
        print(f"  Nombre de features: {features.shape[1]}")
    except Exception as e:
        print(f"✗ Erreur de préparation des features: {e}")
        return False
    
    print()
    print("=" * 60)
    print("RÉSULTAT DU TEST")
    print("=" * 60)
    print()
    print("✓ Tous les tests sont passés avec succès!")
    print()
    print("Le système est prêt à être utilisé.")
    print()
    print("Prochaines étapes:")
    print("  1. Générer le dataset: php artisan master:generate-dataset")
    print("  2. Entraîner le modèle via l'interface web")
    print("  3. Tester les prédictions")
    print()
    
    return True

def test_dependencies():
    """Test des dépendances Python"""
    
    print("=" * 60)
    print("VÉRIFICATION DES DÉPENDANCES")
    print("=" * 60)
    print()
    
    dependencies = {
        'numpy': 'NumPy',
        'sklearn': 'scikit-learn',
        'joblib': 'joblib'
    }
    
    all_ok = True
    
    for module, name in dependencies.items():
        try:
            __import__(module)
            print(f"✓ {name} installé")
        except ImportError:
            print(f"✗ {name} NON installé")
            all_ok = False
    
    print()
    
    if not all_ok:
        print("Certaines dépendances sont manquantes.")
        print("Installez-les avec: pip install -r requirements.txt")
        print()
        return False
    
    print("✓ Toutes les dépendances sont installées")
    print()
    return True

def main():
    """Fonction principale"""
    
    print()
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 58 + "║")
    print("║" + "  SYSTÈME D'ANALYSE PRÉDICTIVE DES FILIÈRES DE MASTER  ".center(58) + "║")
    print("║" + "  Script de Test".center(58) + "║")
    print("║" + " " * 58 + "║")
    print("╚" + "=" * 58 + "╝")
    print()
    
    # Test des dépendances
    if not test_dependencies():
        sys.exit(1)
    
    # Test de prédiction
    if not test_prediction():
        sys.exit(1)
    
    print("=" * 60)
    print("✓ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!")
    print("=" * 60)
    print()
    
    sys.exit(0)

if __name__ == '__main__':
    main()
