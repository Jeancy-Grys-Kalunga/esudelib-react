"""
Service de prédiction des filières de Master avec XGBoost pré-entraîné
Modèle: xgboost_filiere_model.pkl
Variables: genre, intention, cours_optionnels, provenance_region, etablissement, age, moyenne_licence
"""

import json
import sys
import os
import numpy as np
import pandas as pd
import xgboost as xgb
import joblib
from sklearn.preprocessing import LabelEncoder
from datetime import datetime
import traceback

class XGBoostPredictionService:
    def __init__(self, model_path='storage/ml/xgboost_filiere_model.pkl'):
        self.model_path = model_path
        self.model = None
        self.label_encoders = {}
        self.label_encoder_master = None
        self.master_programs = []
        
        # Charger le modèle s'il existe
        if os.path.exists(model_path):
            self.load_model()
        else:
            print(f"⚠️  Avertissement: Modèle non trouvé à {model_path}", file=sys.stderr)
            print("⚠️  Le modèle doit être entraîné avant utilisation.", file=sys.stderr)
    
    def load_model(self):
        """Charge le modèle pré-entraîné et les encodeurs"""
        try:
            print(f"📥 Chargement du modèle depuis: {self.model_path}", file=sys.stderr)
            model_data = joblib.load(self.model_path)
            
            self.model = model_data.get('model')
            self.label_encoders = model_data.get('label_encoders', {})
            self.label_encoder_master = model_data.get('label_encoder_master')
            self.master_programs = model_data.get('master_programs', [])
            
            if self.model is None:
                raise ValueError("Modèle non trouvé dans le fichier")
                
            print(f"✅ Modèle chargé avec succès", file=sys.stderr)
            print(f"📊 Nombre de classes: {len(self.master_programs)}", file=sys.stderr)
            print(f"📋 Classes disponibles: {self.master_programs}", file=sys.stderr)
            
            return True
        except Exception as e:
            print(f"❌ Erreur lors du chargement du modèle: {str(e)}", file=sys.stderr)
            print(f"🔍 Traceback: {traceback.format_exc()}", file=sys.stderr)
            self.model = None
            return False
    
    def preprocess_student_data(self, student_data):
        """
        Prétraite les données de l'étudiant pour la prédiction
        """
        try:
            # Créer un DataFrame avec les données
            df = pd.DataFrame([{
                'genre': str(student_data.get('genre', 'Masculin')).strip(),
                'intention': str(student_data.get('intention', 'Informatique')).strip(),
                'optional_courses': student_data.get('optional_courses', []),
                'provenance_region': str(student_data.get('provenance_region', 'Kinshasa')).strip(),
                'etablissement': str(student_data.get('etablissement', 'ESU-DELIB')).strip(),
                'age': int(student_data.get('age', 20)),
                'moyenne_licence': float(student_data.get('moyenne_licence', 10.0))
            }])
            
            print(f"📊 Données brutes: {df.to_dict('records')[0]}", file=sys.stderr)
            
            # Encoder les variables catégorielles
            categorical_cols = ['genre', 'intention', 'provenance_region', 'etablissement']
            
            for col in categorical_cols:
                if col in df.columns and col in self.label_encoders:
                    try:
                        # Nettoyer la valeur
                        value = str(df[col].iloc[0]).strip()
                        if value not in self.label_encoders[col].classes_:
                            print(f"⚠️  Valeur '{value}' non trouvée dans l'encodeur {col}. Utilisation de la valeur par défaut.", file=sys.stderr)
                            value = self.label_encoders[col].classes_[0]
                        df[col] = self.label_encoders[col].transform([value])[0]
                    except Exception as e:
                        print(f"⚠️  Erreur d'encodage pour {col}: {e}. Utilisation de la valeur par défaut.", file=sys.stderr)
                        df[col] = 0
            
            # Transformer les cours optionnels en nombre de cours
            if 'optional_courses' in df.columns:
                df['nb_cours_optionnels'] = df['optional_courses'].apply(
                    lambda x: len(x) if isinstance(x, list) else 0
                )
                df = df.drop('optional_courses', axis=1)
            
            # S'assurer que toutes les colonnes nécessaires existent
            expected_columns = ['genre', 'intention', 'nb_cours_optionnels', 
                              'provenance_region', 'etablissement', 'age', 'moyenne_licence']
            
            for col in expected_columns:
                if col not in df.columns:
                    print(f"⚠️  Colonne manquante: {col}. Ajout avec valeur par défaut.", file=sys.stderr)
                    df[col] = 0
            
            # Réorganiser les colonnes dans l'ordre attendu
            df = df[expected_columns]
            
            # Convertir en types numériques
            for col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            
            print(f"📈 Données prétraitées: {df.values.tolist()[0]}", file=sys.stderr)
            
            return df.values
            
        except Exception as e:
            print(f"❌ Erreur lors du prétraitement: {str(e)}", file=sys.stderr)
            print(f"🔍 Traceback: {traceback.format_exc()}", file=sys.stderr)
            raise
    
    def predict(self, student_data):
        """
        Prédit la filière de Master pour un étudiant
        """
        try:
            # Vérifier si le modèle est chargé
            if self.model is None:
                if not self.load_model():
                    raise Exception("Impossible de charger le modèle")
            
            # Préparer les features
            features = self.preprocess_student_data(student_data)
            
            # Vérifier la forme des features
            print(f"🔢 Features shape: {features.shape}", file=sys.stderr)
            print(f"🔢 Features: {features}", file=sys.stderr)
            
            # Prédiction des probabilités
            try:
                probabilities = self.model.predict_proba(features)[0]
                print(f"📊 Probabilités brutes: {probabilities}", file=sys.stderr)
            except Exception as e:
                print(f"⚠️  Erreur predict_proba: {e}", file=sys.stderr)
                # Essayer avec predict
                pred = self.model.predict(features)[0]
                probabilities = np.zeros(len(self.master_programs))
                probabilities[pred] = 1.0
            
            # Décoder la prédiction
            prediction_encoded = np.argmax(probabilities)
            prediction = self.label_encoder_master.inverse_transform([prediction_encoded])[0]
            
            # Créer un dictionnaire de probabilités par filière
            program_probabilities = {}
            for idx, prob in enumerate(probabilities):
                program = self.label_encoder_master.inverse_transform([idx])[0]
                program_probabilities[program] = float(prob * 100)
            
            # Trier par probabilité décroissante
            sorted_programs = sorted(
                program_probabilities.items(), 
                key=lambda x: x[1], 
                reverse=True
            )
            
            # Score de confiance
            confidence = float(probabilities[prediction_encoded] * 100)
            
            # Générer l'explication
            explanation = self.generate_explanation(
                student_data, 
                prediction, 
                confidence,
                sorted_programs
            )
            
            result = {
                'predicted_master': prediction,
                'confidence_score': confidence,
                'all_probabilities': program_probabilities,
                'top_3_programs': sorted_programs[:3],
                'explanation': explanation,
                'predicted_at': datetime.now().isoformat()
            }
            
            print(f"🎯 Prédiction: {prediction} ({confidence:.1f}%)", file=sys.stderr)
            print(f"🏆 Top 3: {sorted_programs[:3]}", file=sys.stderr)
            
            return result
            
        except Exception as e:
            print(f"❌ Erreur lors de la prédiction: {str(e)}", file=sys.stderr)
            print(f"🔍 Traceback: {traceback.format_exc()}", file=sys.stderr)
            raise
    
    def generate_explanation(self, student_data, prediction, confidence, sorted_programs):
        """Génère une explication détaillée de la prédiction"""
        explanation = {
            'main_reason': '',
            'supporting_factors': [],
            'recommendation': '',
            'alternative_options': []
        }
        
        intention = student_data.get('intention', '')
        moyenne_licence = student_data.get('moyenne_licence', 10.0)
        optional_courses = student_data.get('optional_courses', [])
        genre = student_data.get('genre', '')
        
        # Raison principale
        if confidence >= 80:
            explanation['main_reason'] = f"Excellent profil pour {prediction} (confiance: {confidence:.1f}%)"
        elif confidence >= 60:
            explanation['main_reason'] = f"Bon profil pour {prediction} (confiance: {confidence:.1f}%)"
        else:
            explanation['main_reason'] = f"Profil polyvalent, {prediction} recommandé (confiance: {confidence:.1f}%)"
        
        # Facteurs de support
        if intention and intention == prediction:
            explanation['supporting_factors'].append("Intention correspond à la prédiction")
        
        if moyenne_licence >= 14:
            explanation['supporting_factors'].append(f"Excellente moyenne ({moyenne_licence:.1f}/20)")
        elif moyenne_licence >= 12:
            explanation['supporting_factors'].append(f"Bonne moyenne académique ({moyenne_licence:.1f}/20)")
        
        if optional_courses and len(optional_courses) > 0:
            explanation['supporting_factors'].append(f"{len(optional_courses)} cours optionnels pertinents")
        
        if genre == 'Féminin':
            explanation['supporting_factors'].append("Diversité de genre appréciée")
        
        # Recommandation
        if confidence >= 75:
            explanation['recommendation'] = f"Nous recommandons fortement le Master {prediction}."
        elif confidence >= 60:
            explanation['recommendation'] = f"Le Master {prediction} est une excellente option."
        else:
            explanation['recommendation'] = f"Le Master {prediction} est une option valable, considérez aussi les alternatives."
        
        # Options alternatives
        for i, (program, prob) in enumerate(sorted_programs[1:4], 1):
            if prob >= 15:
                explanation['alternative_options'].append({
                    'program': program,
                    'probability': prob,
                    'reason': f"Alternative viable ({prob:.1f}% de probabilité)"
                })
        
        return explanation


def load_data(input_arg):
    """Charge les données depuis JSON"""
    try:
        if os.path.isfile(input_arg):
            with open(input_arg, 'r', encoding='utf-8') as f:
                return json.load(f)
        return json.loads(input_arg)
    except json.JSONDecodeError as e:
        print(f"❌ Erreur de décodage JSON: {str(e)}", file=sys.stderr)
        raise
    except Exception as e:
        print(f"❌ Erreur lors du chargement des données: {str(e)}", file=sys.stderr)
        raise


def main():
    """Point d'entrée principal"""
    # Configurer l'encodage
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: python script.py <action> <data> [model_path]'}))
        sys.exit(1)
    
    action = sys.argv[1]
    data_arg = sys.argv[2]
    model_path = sys.argv[3] if len(sys.argv) > 3 else 'storage/ml/xgboost_filiere_model.pkl'
    
    print(f"🚀 Action: {action}", file=sys.stderr)
    print(f"📁 Chemin modèle: {model_path}", file=sys.stderr)
    
    service = XGBoostPredictionService(model_path)
    
    try:
        if action == 'predict':
            # Prédiction pour un étudiant
            student_data = load_data(data_arg)
            print(f"👤 Données étudiant: {student_data}", file=sys.stderr)
            
            result = service.predict(student_data)
            print(json.dumps(result, ensure_ascii=False))
            
        else:
            print(json.dumps({'error': f'Action inconnue: {action}'}))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()