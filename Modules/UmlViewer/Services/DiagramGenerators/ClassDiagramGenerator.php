<?php

namespace Modules\UmlViewer\Services\DiagramGenerators;

use Modules\UmlViewer\Services\DatabaseAnalyzer;

class ClassDiagramGenerator
{
    public function __construct(
        private DatabaseAnalyzer $analyzer
    ) {}

    /**
     * Générer le diagramme de classes PlantUML
     */
    public function generate(array $options = []): string
    {
        $schema = $this->analyzer->analyze();

        $plantUML = "@startuml Diagramme de Classes - Système esudelib\n\n";
        $plantUML .= "!theme cerulean-outline\n";

        // Paramètres pour optimiser l'affichage horizontal
        $plantUML .= "skinparam classAttributeIconSize 0\n";
        $plantUML .= "skinparam packageStyle rectangle\n";
        $plantUML .= "skinparam defaultFontSize 12\n";
        $plantUML .= "skinparam classFontSize 14\n";
        $plantUML .= "skinparam roundcorner 8\n";
        $plantUML .= "skinparam linetype ortho\n";

        // Réduire les espaces pour optimiser l'affichage
        $plantUML .= "skinparam padding 2\n";
        $plantUML .= "skinparam nodesep 40\n";
        $plantUML .= "skinparam ranksep 40\n";
        $plantUML .= "skinparam packagePadding 10\n";

        // Augmenter la largeur maximale du diagramme
        $plantUML .= "skinparam maxMessageSize 300\n";
        $plantUML .= "skinparam wrapWidth 300\n";

        // Direction horizontale pour mieux utiliser l'espace
        $plantUML .= "left to right direction\n";

        $plantUML .= "hide empty methods\n\n";

        // Tables essentielles à afficher
        $essentialTables = [
            'students',
            'courses',
            'course_student',
            'notes',
            'teachers',
            'institutions',
            'master_predictions',
            'users',
            'programs',
            'academic_years',
            'inscriptions',
            'juries',
            'promotions',
            'units_teaching',
            'departments',
            'faculties',
            'course_program_details',
            'appeals',
            'appeal_documents',
            'assignments',
            'exam_sessions',
            'payments'
        ];

        // Filtrer les tables
        $filteredTables = array_filter($schema['tables'], function ($table) use ($essentialTables) {
            return in_array($table['name'], $essentialTables);
        });

        // Organiser par modules
        $tablesByModule = [];
        foreach ($filteredTables as $table) {
            $module = $table['module'];
            if (!isset($tablesByModule[$module])) {
                $tablesByModule[$module] = [];
            }
            $tablesByModule[$module][] = $table;
        }

        // Couleurs par module
        $moduleColors = [
            'Student' => '#E3F2FD',
            'Institution' => '#FFF3E0',
            'Teacher' => '#F3E5F5',
            'Jury' => '#E1F5FE',
            'RegistrationDesk' => '#FCE4EC',
            'Core' => '#FAFAFA',
        ];

        // Générer les packages par module
        foreach ($tablesByModule as $moduleName => $tables) {
            $color = $moduleColors[$moduleName] ?? '#F5F5F5';
            $emoji = $this->getModuleEmoji($moduleName);

            $plantUML .= "package \"{$emoji} {$moduleName}\" {$color} {\n";

            foreach ($tables as $table) {
                $plantUML .= $this->generateClass($table);
            }

            $plantUML .= "}\n\n";
        }

        // Générer uniquement les relations entre tables essentielles
        $plantUML .= "' ============ RELATIONS ============\n\n";

        foreach ($schema['relations'] as $relation) {
            if (in_array($relation['from'], $essentialTables) && in_array($relation['to'], $essentialTables)) {
                $plantUML .= $this->generateRelation($relation);
            }
        }

        // Note pour les prédictions
        $plantUML .= "\n' ============ NOTES ============\n\n";
        $plantUML .= "note right of PredictionMaster\n";
        $plantUML .= "  **Prédiction IA**\n";
        $plantUML .= "  Machine Learning\n";
        $plantUML .= "  Gradient Boosting\n";
        $plantUML .= "end note\n\n";

        // Légende simplifiée
        $plantUML .= "legend right\n";
        $plantUML .= "  **Tables essentielles** (" . count($filteredTables) . "/" . count($schema['tables']) . ")\n";
        $plantUML .= "  PK = Primary Key | FK = Foreign Key | U = Unique | N = Nullable\n";
        $plantUML .= "endlegend\n\n";

        $plantUML .= "@enduml";

        return $plantUML;
    }

    /**
     * Générer une classe UML pour une table
     */
    private function generateClass(array $table): string
    {
        $className = $this->getFrenchClassName($table['name']);
        $stereotype = $this->getClassStereotype($table['name']);
        $englishName = $this->getEnglishClassName($table['name']);

        $uml = "  class {$className} {$stereotype} {\n";
        $uml .= "    ' Anglais: {$englishName}\n";

        // Afficher toutes les colonnes (pas de limitation)
        foreach ($table['columns'] as $column) {
            $uml .= $this->generateAttribute($column, $table);
        }

        // Ajouter des méthodes si c'est une table importante
        if (in_array($table['name'], ['students', 'teachers', 'courses', 'master_predictions', 'notes', 'appeals', 'payments', 'programs', 'institutions', 'inscriptions', 'juries', 'promotions', 'academic_years'])) {
            $uml .= "    --\n";
            $uml .= $this->generateMethods($table['name']);
        }

        $uml .= "  }\n\n";

        return $uml;
    }

    /**
     * Générer un attribut UML
     */
    private function generateAttribute(array $column, array $table): string
    {
        $name = $column['name'];
        $frenchName = $this->getFrenchAttributeName($name);
        $englishType = $this->mapTypeToEnglish($column['type']);
        $englishName = $this->getEnglishAttributeName($name);

        // Symboles
        $symbols = [];

        // Clé primaire
        if ($name === $table['primaryKey'] || $name === 'id') {
            $symbols[] = 'PK';
        }

        // Clé étrangère
        foreach ($table['foreignKeys'] as $fk) {
            if ($fk['column'] === $name) {
                $symbols[] = 'FK';
                break;
            }
        }

        // Unique
        if ($column['unique'] ?? false) {
            $symbols[] = 'U';
        }

        // Nullable
        if ($column['nullable'] ?? false) {
            $symbols[] = 'N';
        }

        $symbolStr = !empty($symbols) ? ' <<' . implode(',', $symbols) . '>>' : '';

        // Valeur par défaut
        $default = '';
        if (isset($column['default'])) {
            $default = " = {$column['default']}";
        }

        // Ajouter la traduction française si différente du nom anglais
        $translation = ($englishName !== $frenchName) ? " ' Français: {$frenchName}" : '';

        return "    + {$englishName} : {$englishType}{$symbolStr}{$default}{$translation}\n";
    }

    /**
     * Générer des méthodes pour les tables importantes
     */
    private function generateMethods(string $tableName): string
    {
        $methods = match ($tableName) {
            'students' => [
                '+ obtenirMoyenneGenerale() : Decimal',
                '+ obtenirCoursInscrits() : Collection',
                '+ obtenirPrediction() : ?PredictionMaster',
                '+ obtenirInscriptions() : Collection',
                '+ obtenirRecours() : Collection',
                '+ telechargerBulletin() : PDF',
                '+ obtenirInscriptionActuelle() : ?Inscription',
            ],
            'teachers' => [
                '+ obtenirCoursAssignes() : Collection',
                '+ obtenirInstitutions() : Collection',
                '+ exporterEtudiants(cours: Cours) : Excel',
                '+ soumettreCotes(cours: Cours, cotes: Tableau) : void',
                '+ obtenirRecours(cours: Cours) : Collection',
                '+ calculerTauxReussite(cours: Cours) : Decimal',
            ],
            'courses' => [
                '+ obtenirEtudiantsInscrits() : Collection',
                '+ obtenirMoyenne() : Decimal',
                '+ obtenirEnseignant() : ?Enseignant',
                '+ obtenirProgramme() : ?Programme',
                '+ calculerTauxReussite() : Decimal',
                '+ obtenirDetails() : DetailProgrammeCours',
            ],
            'master_predictions' => [
                '+ predirePourEtudiant(etudiant: Etudiant) : Tableau',
                '+ obtenirMeilleursProgrammes(n: Entier) : Tableau',
                '+ obtenirExplication() : Objet',
                '+ obtenirNiveauConfiance() : Chaine',
                '+ entrainerModele() : void',
                '+ preparerDonneesEtudiant(etudiant: Etudiant) : Tableau',
            ],
            'notes' => [
                '+ calculerTauxReussite() : Decimal',
                '+ obtenirParEtudiant(idEtudiant: Entier) : Collection',
                '+ obtenirParCours(idCours: Entier) : Collection',
                '+ peutFaireRecours() : Booleen',
                '+ obtenirObservation() : Chaine',
            ],
            'appeals' => [
                '+ creer(donnees: Tableau) : Recours',
                '+ mettreAJourStatut(statut: Chaine) : void',
                '+ obtenirDocuments() : Collection',
                '+ estEnAttente() : Booleen',
                '+ obtenirPaiement() : ?Paiement',
            ],
            'payments' => [
                '+ initier(montant: Decimal) : Chaine',
                '+ verifier(idTransaction: Chaine) : Booleen',
                '+ obtenirStatut() : Chaine',
                '+ obtenirMetadonnees() : Objet',
                '+ estPaye() : Booleen',
            ],
            'programs' => [
                '+ obtenirCours() : Collection',
                '+ obtenirPromotions() : Collection',
                '+ obtenirDetails() : Collection',
                '+ obtenirTotalCredits() : Entier',
                '+ obtenirInstitution() : Institution',
            ],
            'institutions' => [
                '+ obtenirProgrammes() : Collection',
                '+ obtenirEnseignants() : Collection',
                '+ obtenirEtudiants() : Collection',
                '+ obtenirFacultes() : Collection',
                '+ obtenirDepartements() : Collection',
            ],
            'inscriptions' => [
                '+ obtenirEtudiant() : Etudiant',
                '+ obtenirProgramme() : Programme',
                '+ obtenirPromotion() : Promotion',
                '+ estActive() : Booleen',
                '+ obtenirAnneeAcademique() : AnneeAcademique',
            ],
            'juries' => [
                '+ obtenirMembres() : Collection',
                '+ obtenirDeliberations() : Collection',
                '+ publierResultats() : void',
                '+ obtenirSession() : SessionExamen',
            ],
            'promotions' => [
                '+ obtenirEtudiants() : Collection',
                '+ obtenirProgramme() : Programme',
                '+ obtenirAnneeAcademique() : AnneeAcademique',
                '+ obtenirTotalInscrits() : Entier',
            ],
            'academic_years' => [
                '+ obtenirActuelle() : ?AnneeAcademique',
                '+ obtenirProgrammes() : Collection',
                '+ estActive() : Booleen',
                '+ obtenirDateDebut() : Date',
                '+ obtenirDateFin() : Date',
            ],
            default => [],
        };

        $uml = '';
        foreach ($methods as $method) {
            $uml .= "    {$method}\n";
        }

        return $uml;
    }

    /**
     * Générer une relation UML
     */
    private function generateRelation(array $relation): string
    {
        $from = $this->getFrenchClassName($relation['from']);
        $to = $this->getFrenchClassName($relation['to']);
        $relationName = $this->getRelationName($relation['from'], $relation['to'], $relation['type']);

        return match ($relation['type']) {
            'many-to-one' => "{$from} \"*\" --> \"1\" {$to} : {$relationName}\n",
            'one-to-many' => "{$from} \"1\" --> \"*\" {$to} : {$relationName}\n",
            'many-to-many' => "{$from} \"*\" <--> \"*\" {$to} : {$relationName}\n",
            'one-to-one' => "{$from} \"1\" --> \"1\" {$to} : {$relationName}\n",
            default => "{$from} --> {$to} : {$relationName}\n",
        };
    }

    /**
     * Mapper les types SQL vers les types UML en anglais
     */
    private function mapTypeToEnglish(string $sqlType): string
    {
        return match ($sqlType) {
            'bigInteger', 'integer', 'smallInteger', 'tinyInteger' => 'Integer',
            'string', 'char', 'varchar' => 'String',
            'text', 'longText', 'mediumText' => 'Text',
            'float', 'double', 'decimal' => 'Decimal',
            'boolean' => 'Boolean',
            'date' => 'Date',
            'datetime', 'timestamp' => 'DateTime',
            'json', 'jsonb' => 'JSON',
            'enum' => 'Enum',
            'foreignId', 'foreignIdFor' => 'Integer',
            default => 'String',
        };
    }

    /**
     * Mapper les types SQL vers les types UML (conservé pour compatibilité)
     */
    private function mapType(string $sqlType): string
    {
        return match ($sqlType) {
            'bigInteger', 'integer', 'smallInteger', 'tinyInteger' => 'Entier',
            'string', 'char', 'varchar' => 'Chaine',
            'text', 'longText', 'mediumText' => 'Texte',
            'float', 'double', 'decimal' => 'Decimal',
            'boolean' => 'Booleen',
            'date' => 'Date',
            'datetime', 'timestamp' => 'DateHeure',
            'json', 'jsonb' => 'JSON',
            'enum' => 'Enumeration',
            'foreignId', 'foreignIdFor' => 'Entier',
            default => 'Chaine',
        };
    }

    /**
     * Convertir snake_case en CamelCase
     */
    private function toCamelCase(string $string): string
    {
        return str_replace('_', '', ucwords($string, '_'));
    }

    /**
     * Obtenir l'emoji pour un module
     */
    private function getModuleEmoji(string $moduleName): string
    {
        return match ($moduleName) {
            'Student' => '🎓',
            'Institution' => '🏛️',
            'Teacher' => '👨‍🏫',
            'Jury' => '⚖️',
            'RegistrationDesk' => '📝',
            'Upload' => '📁',
            'Setting' => '⚙️',
            'Currency' => '💰',
            'Calendar' => '📅',
            'Core' => '🔧',
            default => '📦',
        };
    }

    /**
     * Obtenir le stéréotype UML pour une table
     */
    private function getClassStereotype(string $tableName): string
    {
        return match ($tableName) {
            'course_student', 'course_program_details' => '<<Association>>',
            'master_predictions' => '<<ModeleIA>>',
            'payments', 'notes', 'appeal_documents' => '<<ObjetValeur>>',
            default => '<<Entite>>',
        };
    }

    /**
     * Obtenir le nom de classe en anglais
     */
    private function getEnglishClassName(string $tableName): string
    {
        return match ($tableName) {
            'students' => 'Student',
            'courses' => 'Course',
            'course_student' => 'CourseStudent',
            'notes' => 'Grade',
            'teachers' => 'Teacher',
            'institutions' => 'Institution',
            'master_predictions' => 'MasterPrediction',
            'users' => 'User',
            'programs' => 'Program',
            'academic_years' => 'AcademicYear',
            'inscriptions' => 'Enrollment',
            'juries' => 'Jury',
            'promotions' => 'Promotion',
            'units_teaching' => 'TeachingUnit',
            'departments' => 'Department',
            'faculties' => 'Faculty',
            'course_program_details' => 'CourseProgramDetail',
            'appeals' => 'Appeal',
            'appeal_documents' => 'AppealDocument',
            'assignments' => 'Assignment',
            'exam_sessions' => 'ExamSession',
            'payments' => 'Payment',
            default => $this->toCamelCase($tableName),
        };
    }

    /**
     * Obtenir le nom d'attribut en anglais
     */
    private function getEnglishAttributeName(string $attributeName): string
    {
        return match ($attributeName) {
            'nom' => 'lastname',
            'prenom' => 'firstname',
            'matricule' => 'registration_number',
            'date_naissance' => 'birth_date',
            'lieu_naissance' => 'birth_place',
            'sexe' => 'gender',
            'adresse' => 'address',
            'telephone' => 'phone',
            'email' => 'email',
            'titre' => 'title',
            'code' => 'code',
            'credits' => 'credits',
            'cote' => 'grade',
            'session' => 'session',
            'observation' => 'observation',
            'situation' => 'status',
            'objet' => 'subject',
            'justification' => 'justification',
            'statut' => 'status',
            'montant' => 'amount',
            'date_paiement' => 'payment_date',
            'annee_academique' => 'academic_year',
            'date_debut' => 'start_date',
            'date_fin' => 'end_date',
            'libelle' => 'label',
            'description' => 'description',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
            default => $attributeName,
        };
    }

    /**
     * Obtenir le nom de classe en français
     */
    private function getFrenchClassName(string $tableName): string
    {
        return match ($tableName) {
            'students' => 'Etudiant',
            'courses' => 'Cours',
            'course_student' => 'CoursEtudiant',
            'notes' => 'Cote',
            'teachers' => 'Enseignant',
            'institutions' => 'Institution',
            'master_predictions' => 'PredictionMaster',
            'users' => 'Utilisateur',
            'programs' => 'Programme',
            'academic_years' => 'AnneeAcademique',
            'inscriptions' => 'Inscription',
            'juries' => 'Jury',
            'promotions' => 'Promotion',
            'units_teaching' => 'UniteEnseignement',
            'departments' => 'Departement',
            'faculties' => 'Faculte',
            'course_program_details' => 'DetailProgrammeCours',
            'appeals' => 'Recours',
            'appeal_documents' => 'DocumentRecours',
            'assignments' => 'Affectation',
            'exam_sessions' => 'SessionExamen',
            'payments' => 'Paiement',
            default => $this->toCamelCase($tableName),
        };
    }

    /**
     * Obtenir le nom d'attribut en français
     */
    private function getFrenchAttributeName(string $attributeName): string
    {
        return match ($attributeName) {
            // Champs communs
            'id' => 'identifiant',
            'created_at' => 'créé le',
            'updated_at' => 'modifié le',
            'deleted_at' => 'supprimé le',

            // Students (étudiants)
            'name' => 'nom',
            'matricule' => 'matricule',
            'gendre' => 'genre',
            'date_of_birth' => 'date de naissance',
            'email' => 'courriel',
            'phone' => 'téléphone',

            // Courses (cours)
            'title' => 'titre',
            'content' => 'contenu',
            'credits' => 'crédits',
            'code' => 'code',

            // Master Predictions (prédictions)
            'age' => 'âge',
            'provenance' => 'provenance',
            'intention_expressed' => 'intention exprimée',
            'optional_courses' => 'cours optionnels',
            'internships' => 'stages',
            'predicted_master' => 'master prédit',
            'confidence_score' => 'score de confiance',
            'prediction_details' => 'détails de prédiction',
            'predicted_at' => 'prédit le',
            'average_grade' => 'moyenne générale',
            'grades_by_subject' => 'notes par matière',
            'actual_master' => 'master réel',
            'is_synthetic' => 'est synthétique',

            // Notes/Grades
            'grade' => 'note',
            'score' => 'score',
            'observation' => 'observation',
            'session' => 'session',
            'status' => 'statut',

            // Appeals (recours)
            'subject' => 'objet',
            'justification' => 'justification',
            'appeal_status' => 'statut du recours',

            // Payments (paiements)
            'amount' => 'montant',
            'payment_date' => 'date de paiement',
            'payment_method' => 'méthode de paiement',
            'transaction_id' => 'identifiant de transaction',

            // Programs (programmes)
            'program_name' => 'nom du programme',
            'duration' => 'durée',
            'level' => 'niveau',

            // Academic Years (années académiques)
            'academic_year' => 'année académique',
            'start_date' => 'date de début',
            'end_date' => 'date de fin',
            'is_active' => 'est active',

            // Institutions
            'institution_name' => 'nom de l\'institution',
            'address' => 'adresse',
            'city' => 'ville',
            'country' => 'pays',

            // Teachers (enseignants)
            'firstname' => 'prénom',
            'lastname' => 'nom de famille',
            'specialization' => 'spécialisation',

            // Inscriptions
            'enrollment_date' => 'date d\'inscription',
            'enrollment_status' => 'statut d\'inscription',

            // Divers
            'description' => 'description',
            'label' => 'libellé',
            'type' => 'type',
            'value' => 'valeur',
            'is_required' => 'est requis',
            'is_enabled' => 'est activé',

            // Foreign keys
            'student_id' => 'identifiant étudiant',
            'course_id' => 'identifiant cours',
            'teacher_id' => 'identifiant enseignant',
            'institution_id' => 'identifiant institution',
            'program_id' => 'identifiant programme',
            'academic_year_id' => 'identifiant année académique',
            'jury_id' => 'identifiant jury',
            'promotion_id' => 'identifiant promotion',

            default => ucfirst(str_replace('_', ' ', $attributeName)),
        };
    }

    /**
     * Obtenir le nom de la relation en français
     */
    private function getRelationName(string $from, string $to, string $type): string
    {
        // Générer un nom de relation basé sur les tables
        $relationMap = [
            'students_courses' => 'est inscrit à',
            'courses_students' => 'a comme étudiant',
            'students_notes' => 'obtient',
            'notes_students' => 'appartient à',
            'courses_notes' => 'évalue',
            'notes_courses' => 'concerne',
            'teachers_courses' => 'enseigne',
            'courses_teachers' => 'est enseigné par',
            'students_master_predictions' => 'a une prédiction',
            'master_predictions_students' => 'prédit pour',
            'students_inscriptions' => 's\'inscrit',
            'inscriptions_students' => 'concerne',
            'programs_courses' => 'contient',
            'courses_programs' => 'fait partie de',
            'institutions_programs' => 'offre',
            'programs_institutions' => 'est offert par',
            'students_appeals' => 'dépose',
            'appeals_students' => 'est déposé par',
            'appeals_payments' => 'nécessite',
            'payments_appeals' => 'concerne',
            'promotions_students' => 'regroupe',
            'students_promotions' => 'appartient à',
            'juries_exam_sessions' => 'délibère',
            'exam_sessions_juries' => 'est délibéré par',
        ];

        $key = $from . '_' . $to;
        return $relationMap[$key] ?? 'associé à';
    }
}
