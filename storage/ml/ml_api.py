"""
Flask API pour le service ML de prédiction Master
Expose les endpoints pour l'entraînement et la prédiction
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import logging
from master_prediction import MasterPredictionService, load_data

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialisation de Flask
app = Flask(__name__)
CORS(app)  # Activer CORS pour les requêtes cross-origin

# Initialisation du service ML
ml_service = MasterPredictionService()

# Configuration
MODEL_PATH = os.getenv('MODEL_PATH', '/app/models/master_prediction_model.pkl')
ml_service.model_path = MODEL_PATH


@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint de health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'ml-prediction',
        'version': '1.0.0'
    }), 200


@app.route('/api/train', methods=['POST'])
def train_model():
    """
    Endpoint pour entraîner le modèle
    
    Body: JSON array de données d'entraînement
    ou
    Body: {"file_path": "/path/to/dataset.json"}
    """
    try:
        data = request.get_json()
        
        # Vérifier si c'est un chemin de fichier ou des données directes
        if isinstance(data, dict) and 'file_path' in data:
            file_path = data['file_path']
            if not os.path.exists(file_path):
                return jsonify({'error': f'File not found: {file_path}'}), 404
            
            with open(file_path, 'r', encoding='utf-8') as f:
                training_data = json.load(f)
        else:
            training_data = data
        
        if not training_data or not isinstance(training_data, list):
            return jsonify({'error': 'Invalid training data format'}), 400
        
        logger.info(f'Starting model training with {len(training_data)} samples')
        
        # Entraîner le modèle
        result = ml_service.train_model(training_data)
        
        logger.info(f'Model trained successfully. Accuracy: {result["accuracy"]:.2%}')
        
        return jsonify({
            'success': True,
            'message': 'Model trained successfully',
            'accuracy': result['accuracy'],
            'n_samples': result['n_samples'],
            'model_type': result['model_type']
        }), 200
        
    except Exception as e:
        logger.error(f'Error training model: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Endpoint pour prédire la filière d'un étudiant
    
    Body: JSON object avec les données de l'étudiant
    {
        "age": 22,
        "provenance": "Kinshasa",
        "intention_expressed": "Informatique",
        "optional_courses": ["IA", "Big Data"],
        "internships": [...],
        "average_grade": 15.5,
        "grades_by_subject": {...}
    }
    """
    try:
        student_data = request.get_json()
        
        if not student_data:
            return jsonify({'error': 'No student data provided'}), 400
        
        logger.info(f'Predicting for student with average grade: {student_data.get("average_grade", "N/A")}')
        
        # Faire la prédiction
        result = ml_service.predict(student_data)
        
        logger.info(f'Prediction: {result["predicted_master"]} (confidence: {result["confidence_score"]:.1f}%)')
        
        return jsonify({
            'success': True,
            'prediction': result
        }), 200
        
    except FileNotFoundError as e:
        logger.error(f'Model not found: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Model not trained yet. Please train the model first.'
        }), 404
        
    except Exception as e:
        logger.error(f'Error making prediction: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/batch-predict', methods=['POST'])
def batch_predict():
    """
    Endpoint pour prédire pour plusieurs étudiants
    
    Body: JSON array de données d'étudiants
    """
    try:
        students_data = request.get_json()
        
        if not students_data or not isinstance(students_data, list):
            return jsonify({'error': 'Invalid data format. Expected array of students'}), 400
        
        logger.info(f'Batch prediction for {len(students_data)} students')
        
        results = []
        for idx, student_data in enumerate(students_data):
            try:
                prediction = ml_service.predict(student_data)
                results.append({
                    'index': idx,
                    'success': True,
                    'prediction': prediction
                })
            except Exception as e:
                logger.error(f'Error predicting for student {idx}: {str(e)}')
                results.append({
                    'index': idx,
                    'success': False,
                    'error': str(e)
                })
        
        successful = sum(1 for r in results if r['success'])
        logger.info(f'Batch prediction completed: {successful}/{len(students_data)} successful')
        
        return jsonify({
            'success': True,
            'total': len(students_data),
            'successful': successful,
            'results': results
        }), 200
        
    except Exception as e:
        logger.error(f'Error in batch prediction: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/model-info', methods=['GET'])
def model_info():
    """
    Endpoint pour obtenir les informations sur le modèle
    """
    try:
        if not os.path.exists(MODEL_PATH):
            return jsonify({
                'success': False,
                'error': 'Model not trained yet'
            }), 404
        
        # Charger le modèle pour obtenir les infos
        ml_service.load_model()
        
        return jsonify({
            'success': True,
            'model_path': MODEL_PATH,
            'master_programs': ml_service.master_programs,
            'model_exists': True
        }), 200
        
    except Exception as e:
        logger.error(f'Error getting model info: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f'Internal server error: {str(error)}')
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Démarrer le serveur Flask
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    
    logger.info(f'Starting ML API server on port {port}')
    logger.info(f'Model path: {MODEL_PATH}')
    logger.info(f'Debug mode: {debug}')
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
