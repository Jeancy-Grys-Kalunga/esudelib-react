"""
Service d'analyse prédictive des filières de Master
Utilise un modèle de Machine Learning moderne pour prédire la filière optimale
"""

import json
import sys
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
from datetime import datetime

class MasterPredictionService:
    def __init__(self, model_path='storage/ml/master_prediction_model.pkl'):
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_names = []
        
        # Filières de Master disponibles
        self.master_programs = [
            'Informatique',
            'Génie Civil',
            'Électromécanique',
            'Gestion',
            'Droit',
            'Économie',
            'Médecine',
            'Sciences Politiques'
        ]
        
    def prepare_features(self, data):
        """
        Prépare les features pour le modèle
        
        Args:
            data: dict contenant les données de l'étudiant
            
        Returns:
            numpy array des features normalisées
        """
        features = []
        
        # 1. Âge (normalisé)
        age = data.get('age', 20)
        features.append(age)
        
        # 2. Provenance (encodé)
        provenance_encoding = {
            'Kinshasa': 1, 'Lubumbashi': 2, 'Goma': 3, 
            'Bukavu': 4, 'Kisangani': 5, 'Autres': 0
        }
        provenance = data.get('provenance', 'Autres')
        features.append(provenance_encoding.get(provenance, 0))
        
        # 3. Intention exprimée (score de correspondance)
        intention = data.get('intention_expressed', '')
        intention_score = 1.0 if intention in self.master_programs else 0.5
        features.append(intention_score)
        
        # 4. Nombre de cours optionnels suivis
        optional_courses = data.get('optional_courses', [])
        features.append(len(optional_courses) if isinstance(optional_courses, list) else 0)
        
        # 5. Nombre de stages effectués
        internships = data.get('internships', [])
        features.append(len(internships) if isinstance(internships, list) else 0)
        
        # 6. Moyenne générale
        average_grade = data.get('average_grade', 10.0)
        features.append(average_grade)
        
        # 7-14. Notes par domaine (8 domaines)
        grades_by_subject = data.get('grades_by_subject', {})
        subject_areas = [
            'Informatique', 'Mathématiques', 'Physique', 'Chimie',
            'Sciences Humaines', 'Langues', 'Gestion', 'Droit'
        ]
        
        for subject in subject_areas:
            grade = grades_by_subject.get(subject, average_grade)
            features.append(grade)
        
        # 15. Variance des notes (indicateur de spécialisation)
        if grades_by_subject:
            grades_values = list(grades_by_subject.values())
            variance = np.var(grades_values)
        else:
            variance = 0
        features.append(variance)
        
        # 16. Score de cohérence (intention vs performances)
        coherence_score = 0.5
        if intention and intention in grades_by_subject:
            intention_grade = grades_by_subject[intention]
            if intention_grade >= average_grade:
                coherence_score = min(1.0, intention_grade / 20.0)
        features.append(coherence_score)
        
        return np.array(features).reshape(1, -1)
    
    def train_model(self, training_data):
        """
        Entraîne le modèle avec les données fournies
        
        Args:
            training_data: liste de dictionnaires contenant les données d'entraînement
        """
        X = []
        y = []
        
        for data in training_data:
            features = self.prepare_features(data)
            X.append(features[0])
            y.append(data['actual_master'])
        
        X = np.array(X)
        y = np.array(y)
        
        # Normalisation des features
        X_scaled = self.scaler.fit_transform(X)
        
        # Encodage des labels
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Entraînement avec Gradient Boosting (plus performant)
        self.model = GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=5,
            random_state=42,
            verbose=0
        )
        
        # Split pour validation
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_encoded, test_size=0.2, random_state=42
        )
        
        # Entraînement
        self.model.fit(X_train, y_train)
        
        # Évaluation
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Sauvegarde du modèle
        self.save_model()
        
        return {
            'accuracy': float(accuracy),
            'n_samples': len(training_data),
            'model_type': 'GradientBoostingClassifier'
        }
    
    def predict(self, student_data):
        """
        Prédit la filière de Master pour un étudiant
        
        Args:
            student_data: dict contenant les données de l'étudiant
            
        Returns:
            dict contenant la prédiction et les détails
        """
        if self.model is None:
            self.load_model()
        
        # Préparer les features
        features = self.prepare_features(student_data)
        features_scaled = self.scaler.transform(features)
        
        # Prédiction
        prediction_encoded = self.model.predict(features_scaled)[0]
        prediction = self.label_encoder.inverse_transform([prediction_encoded])[0]
        
        # Probabilités pour chaque filière
        probabilities = self.model.predict_proba(features_scaled)[0]
        
        # Créer un dictionnaire de probabilités par filière
        program_probabilities = {}
        for idx, prob in enumerate(probabilities):
            program = self.label_encoder.inverse_transform([idx])[0]
            program_probabilities[program] = float(prob * 100)
        
        # Trier par probabilité décroissante
        sorted_programs = sorted(
            program_probabilities.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        # Score de confiance (probabilité de la meilleure prédiction)
        confidence = float(probabilities[prediction_encoded] * 100)
        
        # Générer l'explication
        explanation = self.generate_explanation(
            student_data, 
            prediction, 
            confidence,
            sorted_programs
        )
        
        return {
            'predicted_master': prediction,
            'confidence_score': confidence,
            'all_probabilities': program_probabilities,
            'top_3_programs': sorted_programs[:3],
            'explanation': explanation,
            'predicted_at': datetime.now().isoformat()
        }
    
    def generate_explanation(self, student_data, prediction, confidence, sorted_programs):
        """
        Génère une explication détaillée de la prédiction
        """
        explanation = {
            'main_reason': '',
            'supporting_factors': [],
            'recommendation': '',
            'alternative_options': []
        }
        
        avg_grade = student_data.get('average_grade', 10)
        grades_by_subject = student_data.get('grades_by_subject', {})
        intention = student_data.get('intention_expressed', '')
        internships = student_data.get('internships', [])
        optional_courses = student_data.get('optional_courses', [])
        
        # Raison principale
        if confidence >= 80:
            explanation['main_reason'] = f"L'étudiant présente un profil très cohérent pour le Master en {prediction} avec un score de confiance de {confidence:.1f}%."
        elif confidence >= 60:
            explanation['main_reason'] = f"L'étudiant montre de bonnes aptitudes pour le Master en {prediction} avec un score de confiance de {confidence:.1f}%."
        else:
            explanation['main_reason'] = f"Le Master en {prediction} semble être une option appropriée, bien que le profil soit polyvalent (confiance: {confidence:.1f}%)."
        
        # Facteurs de support
        if prediction in grades_by_subject:
            grade = grades_by_subject[prediction]
            if grade >= avg_grade:
                explanation['supporting_factors'].append(
                    f"Excellentes performances en {prediction} ({grade:.1f}/20, supérieur à la moyenne générale de {avg_grade:.1f}/20)"
                )
        
        if intention == prediction:
            explanation['supporting_factors'].append(
                f"L'intention exprimée par l'étudiant correspond à la prédiction ({prediction})"
            )
        
        if len(internships) > 0:
            explanation['supporting_factors'].append(
                f"Expérience pratique acquise via {len(internships)} stage(s) effectué(s)"
            )
        
        if len(optional_courses) > 0:
            explanation['supporting_factors'].append(
                f"Intérêt démontré par le suivi de {len(optional_courses)} cours optionnel(s)"
            )
        
        if avg_grade >= 14:
            explanation['supporting_factors'].append(
                f"Excellente moyenne générale ({avg_grade:.1f}/20) démontrant de solides capacités académiques"
            )
        elif avg_grade >= 12:
            explanation['supporting_factors'].append(
                f"Bonne moyenne générale ({avg_grade:.1f}/20) permettant de suivre le programme"
            )
        
        # Recommandation
        if confidence >= 75:
            explanation['recommendation'] = f"Nous recommandons fortement la poursuite en Master {prediction}. Le profil de l'étudiant est très adapté à cette filière."
        elif confidence >= 60:
            explanation['recommendation'] = f"Le Master {prediction} est recommandé. L'étudiant devrait également considérer les alternatives proposées."
        else:
            explanation['recommendation'] = f"Le Master {prediction} est une option valable. Il est conseillé d'explorer également les autres filières suggérées."
        
        # Options alternatives
        for program, prob in sorted_programs[1:4]:  # Top 2-4
            if prob >= 20:
                explanation['alternative_options'].append({
                    'program': program,
                    'probability': prob,
                    'reason': f"Profil compatible avec une probabilité de {prob:.1f}%"
                })
        
        return explanation
    
    def save_model(self):
        """Sauvegarde le modèle entraîné"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'master_programs': self.master_programs
        }
        
        joblib.dump(model_data, self.model_path)
    
    def load_model(self):
        """Charge le modèle pré-entraîné"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Modèle non trouvé: {self.model_path}")
        
        model_data = joblib.load(self.model_path)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.label_encoder = model_data['label_encoder']
        self.master_programs = model_data['master_programs']


def main():
    """Point d'entrée pour l'utilisation en ligne de commande"""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: python master_prediction.py <action> <data>'}))
        sys.exit(1)
    
    action = sys.argv[1]
    service = MasterPredictionService()
    
    try:
        if action == 'train':
            # Entraînement du modèle
            training_data = json.loads(sys.argv[2])
            result = service.train_model(training_data)
            print(json.dumps(result))
            
        elif action == 'predict':
            # Prédiction pour un étudiant
            student_data = json.loads(sys.argv[2])
            result = service.predict(student_data)
            print(json.dumps(result))
            
        else:
            print(json.dumps({'error': f'Action inconnue: {action}'}))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
