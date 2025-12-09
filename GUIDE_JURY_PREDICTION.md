# Guide d'Utilisation - Analyse Prédictive des Filières de Master

## Pour le Jury

### 📖 Introduction

Ce système d'intelligence artificielle vous aide à orienter les étudiants vers les filières de Master les plus adaptées à leur profil académique et leurs aspirations.

---

## 🚀 Accès au Système

### Depuis le Dashboard Jury

1. Connectez-vous à votre compte
2. Accédez au **Dashboard Jury**
3. Cliquez sur **"Grille des résultats"**
4. En haut à droite, cliquez sur **"Analyse Prédictive Master"**

### Ou directement

Accédez à : `http://votre-domaine/jury/orientation-predictions`

---

## 📊 Interface Principale

### Vue d'ensemble

L'interface affiche :

1. **En-tête**
   - Année académique
   - Promotion
   - Boutons d'action

2. **Statistiques** (si des prédictions existent)
   - Total de prédictions
   - Répartition par niveau de confiance
   - Confiance moyenne

3. **Liste des étudiants**
   - Nom et matricule
   - Moyenne générale
   - Prédiction actuelle (si disponible)
   - Score de confiance
   - Bouton "Analyser"

---

## 🎯 Analyser un Étudiant

### Étape 1 : Sélectionner un étudiant

Dans la liste, repérez l'étudiant que vous souhaitez analyser.

### Étape 2 : Lancer l'analyse

Cliquez sur le bouton **"Analyser"** à droite de la ligne de l'étudiant.

⏱️ L'analyse prend environ **1 seconde**.

### Étape 3 : Consulter les résultats

Une fois l'analyse terminée, vous verrez :

#### 🎓 Filière Recommandée

- **Nom de la filière** en grand
- **Score de confiance** (0-100%)
  - ≥ 75% : Haute confiance (vert)
  - 60-74% : Confiance moyenne (jaune)
  - < 60% : Confiance faible (orange)

#### 🏆 Top 3 des Filières Compatibles

Classement des 3 meilleures options avec leurs probabilités.

#### 🧠 Explication de l'IA

**Analyse Principale**
- Pourquoi cette filière est recommandée

**Facteurs Déterminants**
- Performances académiques dans les matières clés
- Cohérence avec l'intention exprimée
- Expérience pratique (stages)
- Intérêt démontré (cours optionnels)

**Notre Recommandation**
- Conseil personnalisé pour l'étudiant

**Options Alternatives**
- Autres filières compatibles avec probabilités

---

## 👥 Analyser Tous les Étudiants

### Quand utiliser ?

- Au début de l'année académique
- Après mise à jour des notes
- Pour avoir une vue d'ensemble

### Comment faire ?

1. Cliquez sur **"Analyser tous les étudiants"** en haut à droite
2. Attendez la fin du traitement (2-5 minutes pour 100 étudiants)
3. Consultez le résumé :
   - Nombre total d'étudiants
   - Prédictions réussies
   - Prédictions échouées (s'il y en a)

---

## 🔧 Entraîner le Modèle

### Quand entraîner ?

- **Première utilisation** (obligatoire)
- **Chaque année académique** (recommandé)
- **Après ajout de nouvelles données réelles**
- **Si la précision diminue**

### Comment entraîner ?

1. Cliquez sur **"Entraîner le modèle"** en haut à droite
2. Attendez la fin de l'entraînement (2-5 minutes)
3. Vérifiez la précision affichée (devrait être > 85%)

⚠️ **Important** : L'entraînement nécessite un dataset. Si vous n'en avez pas, contactez l'administrateur système.

---

## 📈 Comprendre les Statistiques

### Total Prédictions

Nombre d'étudiants pour lesquels une prédiction a été générée.

### Confiance Élevée (≥ 75%)

Étudiants avec un profil très adapté à la filière prédite.
➡️ **Action** : Recommander fortement cette filière

### Confiance Moyenne (60-74%)

Étudiants avec un bon profil, mais plusieurs options possibles.
➡️ **Action** : Recommander en explorant les alternatives

### Confiance Faible (< 60%)

Étudiants avec un profil polyvalent.
➡️ **Action** : Discuter avec l'étudiant de ses préférences

### Confiance Moyenne Globale

Indicateur de la qualité générale des prédictions.
- > 75% : Excellent
- 60-75% : Bon
- < 60% : À améliorer (réentraîner le modèle)

---

## 🎨 Codes Couleur

### Par Filière

- **Informatique** : Bleu
- **Génie Civil** : Jaune
- **Électromécanique** : Orange
- **Médecine** : Rouge
- **Droit** : Violet
- **Économie** : Vert
- **Gestion** : Teal
- **Sciences Politiques** : Indigo

### Par Niveau de Confiance

- **Vert** : Haute confiance (≥ 75%)
- **Jaune** : Confiance moyenne (60-74%)
- **Orange** : Confiance faible (< 60%)

---

## 💡 Conseils d'Utilisation

### 1. Utilisez les prédictions comme un outil d'aide

Les prédictions sont des **recommandations**, pas des décisions finales.
Prenez toujours en compte :
- Les aspirations de l'étudiant
- Son contexte personnel
- Les places disponibles

### 2. Explorez les alternatives

Même avec une haute confiance, consultez le Top 3 pour voir les autres options.

### 3. Lisez les explications

Les explications de l'IA vous aident à comprendre **pourquoi** une filière est recommandée.

### 4. Discutez avec les étudiants

Utilisez les résultats comme base de discussion avec les étudiants.

### 5. Mettez à jour régulièrement

Réentraînez le modèle chaque année pour améliorer la précision.

---

## ❓ Questions Fréquentes

### Q1 : Quelle est la précision du système ?

**R** : Le modèle a une précision de **> 85%** sur le dataset de test.

### Q2 : Sur quoi se base la prédiction ?

**R** : Le système analyse 16 variables :
- Âge, provenance, intention exprimée
- Cours optionnels, stages
- Moyenne générale
- Notes par domaine (8 domaines)
- Variance des notes
- Score de cohérence

### Q3 : Puis-je modifier une prédiction ?

**R** : Non, mais vous pouvez :
- Relancer l'analyse si les données ont changé
- Utiliser les alternatives proposées
- Prendre une décision différente en délibération

### Q4 : Que faire si la confiance est faible ?

**R** : 
- Consultez les alternatives
- Discutez avec l'étudiant
- Vérifiez les données (notes, stages, etc.)
- Considérez plusieurs options

### Q5 : Comment améliorer la précision ?

**R** :
- Réentraîner le modèle régulièrement
- Ajouter plus de données réelles
- Mettre à jour les informations des étudiants

### Q6 : Le système remplace-t-il le jury ?

**R** : **Non**. C'est un **outil d'aide à la décision**. La décision finale revient toujours au jury.

---

## 🔒 Confidentialité

- Les prédictions sont **confidentielles**
- Accessibles uniquement au jury
- Stockées de manière sécurisée
- Non visibles par les étudiants (sauf si configuré)

---

## 📞 Support

### En cas de problème

1. **Vérifiez les logs** : `storage/logs/laravel.log`
2. **Consultez la documentation** : `storage/ml/README.md`
3. **Contactez l'administrateur système**

### Erreurs courantes

**"Modèle non trouvé"**
➡️ Entraînez le modèle via le bouton "Entraîner le modèle"

**"Erreur lors de la prédiction"**
➡️ Vérifiez que Python est installé et configuré

**"Dataset vide"**
➡️ Contactez l'administrateur pour générer le dataset

---

## 🎓 Bonnes Pratiques

### ✅ À FAIRE

- Analyser tous les étudiants au début de l'année
- Consulter les explications détaillées
- Discuter des résultats avec les étudiants
- Réentraîner le modèle chaque année
- Utiliser les prédictions comme base de discussion

### ❌ À NE PAS FAIRE

- Prendre les prédictions comme décisions finales
- Ignorer les aspirations des étudiants
- Négliger les alternatives proposées
- Oublier de réentraîner le modèle
- Partager les prédictions sans autorisation

---

## 📊 Exemple d'Utilisation

### Cas : Jean Dupont

**Profil**
- Moyenne : 15.5/20
- Meilleure note : Informatique (17.5/20)
- Intention : Informatique
- Stages : 1 stage chez Vodacom (3 mois)
- Cours optionnels : IA, Big Data

**Prédiction**
- **Filière** : Informatique
- **Confiance** : 92%

**Top 3**
1. Informatique (92%)
2. Mathématiques (65%)
3. Gestion (45%)

**Recommandation**
✅ Profil excellent pour Informatique
✅ Cohérence totale (intention + performances + expérience)
✅ Recommandation forte

**Action du Jury**
➡️ Orienter vers le Master en Informatique

---

## 🎉 Conclusion

Le système d'analyse prédictive est un **outil puissant** pour :
- Aider les étudiants dans leur orientation
- Faciliter le travail du jury
- Optimiser l'affectation aux filières
- Améliorer la réussite des étudiants

**Utilisez-le judicieusement et en complément de votre expertise !**

---

**Version** : 1.0.0  
**Date** : Décembre 2025  
**Contact** : Équipe de développement esudelib
