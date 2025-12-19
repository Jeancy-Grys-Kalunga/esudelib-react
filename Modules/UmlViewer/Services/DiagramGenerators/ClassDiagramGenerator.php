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
        $plantUML .= "skinparam classAttributeIconSize 0\n";
        $plantUML .= "skinparam packageStyle rectangle\n";
        $plantUML .= "skinparam defaultFontSize 14\n";
        $plantUML .= "skinparam classFontSize 16\n";
        $plantUML .= "skinparam roundcorner 10\n";
        $plantUML .= "skinparam linetype ortho\n";
        $plantUML .= "hide empty methods\n\n";

        // Tables essentielles à afficher
        $essentialTables = [
            'students',
            'courses',
            'notes',
            'teachers',
            'institutions',
            'master_predictions',
            'users',
            'programs',
            'academic_years',
            'inscriptions',
            'juries',
            'promotions'
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
        $plantUML .= "note right of MasterPredictions\n";
        $plantUML .= "  **Prédiction IA**\n";
        $plantUML .= "  Machine Learning\n";
        $plantUML .= "  Gradient Boosting\n";
        $plantUML .= "end note\n\n";

        // Légende simplifiée
        $plantUML .= "legend right\n";
        $plantUML .= "  **Tables essentielles** (" . count($filteredTables) . "/" . count($schema['tables']) . ")\n";
        $plantUML .= "  PK = Clé Primaire | FK = Clé Étrangère\n";
        $plantUML .= "endlegend\n\n";

        $plantUML .= "@enduml";

        return $plantUML;
    }

    /**
     * Générer une classe UML pour une table
     */
    private function generateClass(array $table): string
    {
        $className = $this->toCamelCase($table['name']);
        $uml = "  class {$className} {\n";

        // Afficher toutes les colonnes (pas de limitation)
        foreach ($table['columns'] as $column) {
            $uml .= $this->generateAttribute($column, $table);
        }

        // Ajouter des méthodes si c'est une table importante
        if (in_array($table['name'], ['students', 'teachers', 'courses', 'master_predictions'])) {
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
        $type = $this->mapType($column['type']);

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

        return "    + {$name} : {$type}{$symbolStr}{$default}\n";
    }

    /**
     * Générer des méthodes pour les tables importantes
     */
    private function generateMethods(string $tableName): string
    {
        $methods = match ($tableName) {
            'students' => [
                'getAverageGrade() : Float',
                'getEnrolledCourses() : Collection',
                'getPrediction() : ?MasterPrediction',
            ],
            'teachers' => [
                'getAssignedCourses() : Collection',
                'getInstitutions() : Collection',
            ],
            'courses' => [
                'getEnrolledStudents() : Collection',
                'getAverageGrade() : Float',
            ],
            'master_predictions' => [
                'getTopPrograms(n: Integer) : Array',
                'getExplanation() : Object',
                'getConfidenceLevel() : String',
            ],
            default => [],
        };

        $uml = '';
        foreach ($methods as $method) {
            $uml .= "    + {$method}\n";
        }

        return $uml;
    }

    /**
     * Générer une relation UML
     */
    private function generateRelation(array $relation): string
    {
        $from = $this->toCamelCase($relation['from']);
        $to = $this->toCamelCase($relation['to']);

        return match ($relation['type']) {
            'many-to-one' => "{$from} \"*\" --> \"1\" {$to}\n",
            'one-to-many' => "{$from} \"1\" --> \"*\" {$to}\n",
            'many-to-many' => "{$from} \"*\" <--> \"*\" {$to}\n",
            'one-to-one' => "{$from} \"1\" --> \"1\" {$to}\n",
            default => "{$from} --> {$to}\n",
        };
    }

    /**
     * Mapper les types SQL vers les types UML
     */
    private function mapType(string $sqlType): string
    {
        return match ($sqlType) {
            'bigInteger', 'integer', 'smallInteger', 'tinyInteger' => 'Integer',
            'string', 'char', 'varchar' => 'String',
            'text', 'longText', 'mediumText' => 'Text',
            'float', 'double', 'decimal' => 'Float',
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
}
