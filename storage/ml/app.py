import pandas as pd
import joblib
import streamlit as st

# Charger le modèle entraîné
model = joblib.load("modele_xgboost_duree.pkl")

# Dictionnaires d'encodage simplifiés (à adapter selon ton dataset réel)
categories = {
    "ParkingDepart": ['ArretKasapa', 'MarcheMoise'],
    "ParkingArrivee": ['MarcheMoise', 'ArretKasapa'],
    "Deviation": ['Oui', 'Non'],
    "Cause": ['Route barree', 'Accident', 'Conditions meteorologiques', 'Congestion', 'Inconnu'],
    "Itineraire": ['Route 1', 'Route 2', 'Route 3'],
    "Type": ['Retardee', 'Inachevee', 'Normal'],
    "ConditionsCirculation": ['Congestion legere', 'Congestion moderee', 'Congestion elevee', 'Normal'],
    "ConditionsMeteo": ['Ensoleille', 'Pluvieux', 'Nuageux', 'Brouillard'],
    "EtatDeRoute": ['Bon', 'Mauvais']
}

def encoder(col, val):
    return categories[col].index(val) if val in categories[col] else 0

# Interface utilisateur
st.title("🚍 Estimation de la Durée d’un Trajet à Lubumbashi")

# Champs du formulaire
jour = st.date_input("📅 Date du trajet")
heure_dep = st.time_input("🕒 Heure de départ")
heure_arr = st.time_input("🕓 Heure estimée d'arrivée")
heure_clim = st.time_input("🕖 Heure des données météo")

# Choix utilisateur
inputs = {}
for col in categories:
    inputs[col] = st.selectbox(col.replace("_", " "), categories[col])

# Prédiction
if st.button("🎯 Prédire la durée"):
    ligne = pd.DataFrame([{
        'Jour_semaine': jour.weekday(),
        'Mois': jour.month,
        'HeureDepart_hour': heure_dep.hour,
        'HeureDepart_minute': heure_dep.minute,
        'HeureArrivee_hour': heure_arr.hour,
        'HeureArrivee_minute': heure_arr.minute,
        'HeureClimat_hour': heure_clim.hour,
        'HeureClimat_minute': heure_clim.minute,
        'ParkingDepart_enc': encoder("ParkingDepart", inputs["ParkingDepart"]),
        'ParkingArrivee_enc': encoder("ParkingArrivee", inputs["ParkingArrivee"]),
        'Deviation_enc': encoder("Deviation", inputs["Deviation"]),
        'Cause_enc': encoder("Cause", inputs["Cause"]),
        'Itineraire_enc': encoder("Itineraire", inputs["Itineraire"]),
        'Type_enc': encoder("Type", inputs["Type"]),
        'ConditionsCirculation_enc': encoder("ConditionsCirculation", inputs["ConditionsCirculation"]),
        'ConditionsMeteo_enc': encoder("ConditionsMeteo", inputs["ConditionsMeteo"]),
        'EtatDeRoute_enc': encoder("EtatDeRoute", inputs["EtatDeRoute"])
    }])
    pred = model.predict(ligne)[0]
    st.success(f"⏱️ Durée estimée : {pred:.2f} minutes")
