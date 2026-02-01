
import joblib
import sys
import os

model_path = 'storage/ml/xgboost_filiere_model.pkl'

if not os.path.exists(model_path):
    print(f"Model not found at {model_path}")
    sys.exit(1)

try:
    model_data = joblib.load(model_path)
    print("Keys in model_data:", model_data.keys())
    
    if 'master_programs' in model_data:
        print("\nMaster Programs in pickle:", model_data['master_programs'])
    else:
        print("\n'master_programs' key NOT found in pickle.")

    if 'label_encoder' in model_data:
        le = model_data['label_encoder']
        print("\nLabelEncoder classes:", le.classes_)
    else:
        print("\n'label_encoder' key NOT found in pickle.")

except Exception as e:
    print(f"Error loading model: {e}")
