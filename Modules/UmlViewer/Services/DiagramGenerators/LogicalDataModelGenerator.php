<?php

namespace Modules\UmlViewer\Services\DiagramGenerators;

use Modules\UmlViewer\Services\DatabaseAnalyzer;

/**
 * Générateur de Modèle Logique de Données (MLD)
 * 
 * Génère un diagramme PlantUML représentant la structure logique
 * de la base de données avec les noms techniques des tables et colonnes.
 */
class LogicalDataModelGenerator
{
    public function __construct(
        private DatabaseAnalyzer $analyzer
    ) {}

    /**
     * Générer le Modèle Logique de Données PlantUML
     */
    public function generate(array $options = []): string
    {
        $schema = $this->analyzer->analyze();

        $plantUML = "@startuml Modèle Logique de Données - Système esudelib\n\n";
        $plantUML .= "!theme cerulean-outline\n";

        // Paramètres de style pour le MLD
        $plantUML .= "skinparam classAttributeIconSize 0\n";
        $plantUML .= "skinparam packageStyle rectangle\n";
        $plantUML .= "skinparam defaultFontSize 11\n";
        $plantUML .= "skinparam classFontSize 13\n";
        $plantUML .= "skinparam roundcorner 5\n";
        $plantUML .= "skinparam linetype ortho\n";
        $plantUML .= "skinparam padding 2\n";
        $plantUML .= "skinparam nodesep 30\n";
        $plantUML .= "skinparam ranksep 30\n";
        $plantUML .= "skinparam packagePadding 8\n";

        // Direction horizontale
        $plantUML .= "left to right direction\n\n";

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
            'Student' => '#E8F5E9',
            'Institution' => '#FFF8E1',
            'Teacher' => '#F3E5F5',
            'Jury' => '#E3F2FD',
            'RegistrationDesk' => '#FCE4EC',
            'Core' => '#ECEFF1',
        ];

        // Générer les packages par module
        foreach ($tablesByModule as $moduleName => $tables) {
            $color = $moduleColors[$moduleName] ?? '#F5F5F5';

            $plantUML .= "package \"{$moduleName}\" {$color} {\n";

            foreach ($tables as $table) {
                $plantUML .= $this->generateTable($table);
            }

            $plantUML .= "}\n\n";
        }

        // Générer les relations
        $plantUML .= "' ============ RELATIONS ============\n\n";

        foreach ($schema['relations'] as $relation) {
            if (in_array($relation['from'], $essentialTables) && in_array($relation['to'], $essentialTables)) {
                $plantUML .= $this->generateRelation($relation);
            }
        }

        // Légende
        $plantUML .= "\nlegend right\n";
        $plantUML .= "  **Modèle Logique de Données**\n";
        $plantUML .= "  ---\n";
        $plantUML .= "  PK = Clé Primaire\n";
        $plantUML .= "  FK = Clé Étrangère\n";
        $plantUML .= "  NN = Non Null\n";
        $plantUML .= "  UQ = Unique\n";
        $plantUML .= "  ---\n";
        $plantUML .= "  Tables: " . count($filteredTables) . "/" . count($schema['tables']) . "\n";
        $plantUML .= "endlegend\n\n";

        $plantUML .= "@enduml";

        return $plantUML;
    }

    /**
     * Générer une table pour le MLD
     */
    private function generateTable(array $table): string
    {
        $tableName = $table['name'];

        $uml = "  class \"{$tableName}\" as {$this->toClassName($tableName)} <<table>> {\n";

        // Séparer les colonnes PK des autres
        $pkColumns = [];
        $otherColumns = [];

        foreach ($table['columns'] as $column) {
            if ($column['name'] === 'id' || $column['name'] === $table['primaryKey']) {
                $pkColumns[] = $column;
            } else {
                $otherColumns[] = $column;
            }
        }

        // Afficher les PK en premier
        foreach ($pkColumns as $column) {
            $uml .= $this->generateColumn($column, $table, true);
        }

        // Séparateur
        if (!empty($pkColumns) && !empty($otherColumns)) {
            $uml .= "    --\n";
        }

        // Afficher les autres colonnes
        foreach ($otherColumns as $column) {
            $uml .= $this->generateColumn($column, $table, false);
        }

        $uml .= "  }\n\n";

        return $uml;
    }

    /**
     * Générer une colonne pour le MLD
     */
    private function generateColumn(array $column, array $table, bool $isPK): string
    {
        $name = $column['name'];
        $type = $this->mapSqlType($column['type']);

        // Contraintes
        $constraints = [];

        if ($isPK) {
            $constraints[] = 'PK';
        }

        // Vérifier si c'est une FK
        foreach ($table['foreignKeys'] as $fk) {
            if ($fk['column'] === $name) {
                $constraints[] = 'FK';
                break;
            }
        }

        // Non nullable
        if (!($column['nullable'] ?? false) && !$isPK) {
            $constraints[] = 'NN';
        }

        // Unique
        if ($column['unique'] ?? false) {
            $constraints[] = 'UQ';
        }

        $constraintStr = !empty($constraints) ? ' <<' . implode(',', $constraints) . '>>' : '';

        // Valeur par défaut
        $default = '';
        if (isset($column['default'])) {
            $default = " = {$column['default']}";
        }

        // Symbole de visibilité
        $visibility = $isPK ? '*' : '+';

        return "    {$visibility} {$name} : {$type}{$constraintStr}{$default}\n";
    }

    /**
     * Générer une relation pour le MLD
     */
    private function generateRelation(array $relation): string
    {
        $from = $this->toClassName($relation['from']);
        $to = $this->toClassName($relation['to']);

        return match ($relation['type']) {
            'many-to-one' => "{$from} }o--|| {$to}\n",
            'one-to-many' => "{$from} ||--o{ {$to}\n",
            'many-to-many' => "{$from} }o--o{ {$to}\n",
            'one-to-one' => "{$from} ||--|| {$to}\n",
            default => "{$from} -- {$to}\n",
        };
    }

    /**
     * Mapper les types Laravel vers les types SQL standards
     */
    private function mapSqlType(string $laravelType): string
    {
        return match ($laravelType) {
            'bigInteger' => 'BIGINT',
            'integer' => 'INT',
            'smallInteger' => 'SMALLINT',
            'tinyInteger' => 'TINYINT',
            'string' => 'VARCHAR',
            'char' => 'CHAR',
            'text' => 'TEXT',
            'longText' => 'LONGTEXT',
            'mediumText' => 'MEDIUMTEXT',
            'float' => 'FLOAT',
            'double' => 'DOUBLE',
            'decimal' => 'DECIMAL',
            'boolean' => 'BOOLEAN',
            'date' => 'DATE',
            'datetime' => 'DATETIME',
            'timestamp' => 'TIMESTAMP',
            'json' => 'JSON',
            'enum' => 'ENUM',
            'foreignId', 'foreignIdFor' => 'BIGINT',
            default => strtoupper($laravelType),
        };
    }

    /**
     * Convertir le nom de table en nom de classe pour PlantUML
     */
    private function toClassName(string $tableName): string
    {
        return str_replace('_', '', ucwords($tableName, '_'));
    }
}
