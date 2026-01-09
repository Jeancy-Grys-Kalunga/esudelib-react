<?php

namespace Modules\UmlViewer\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DatabaseAnalyzer
{
    private array $tables = [];
    private array $relations = [];
    private array $modules = [];

    /**
     * Analyser toute la base de données
     */
    public function analyze(): array
    {
        $this->scanMigrations();
        $this->detectRelations();
        $this->organizeByModules();

        return [
            'tables' => $this->tables,
            'relations' => $this->relations,
            'modules' => $this->modules,
        ];
    }

    /**
     * Scanner tous les fichiers de migration
     */
    private function scanMigrations(): void
    {
        $modulesPath = base_path('Modules');
        $modules = File::directories($modulesPath);

        foreach ($modules as $modulePath) {
            $moduleName = basename($modulePath);
            $migrationsPath = $modulePath . '/database/migrations';

            if (!File::exists($migrationsPath)) {
                continue;
            }

            $migrationFiles = File::files($migrationsPath);

            foreach ($migrationFiles as $file) {
                if (Str::contains($file->getFilename(), 'create_') && Str::endsWith($file->getFilename(), '_table.php')) {
                    $this->parseMigrationFile($file->getPathname(), $moduleName);
                }
            }
        }

        // Scanner aussi les migrations Laravel par défaut
        $laravelMigrationsPath = database_path('migrations');
        if (File::exists($laravelMigrationsPath)) {
            $migrationFiles = File::files($laravelMigrationsPath);
            foreach ($migrationFiles as $file) {
                if (Str::contains($file->getFilename(), 'create_') && Str::endsWith($file->getFilename(), '_table.php')) {
                    $this->parseMigrationFile($file->getPathname(), 'Core');
                }
            }
        }
    }

    /**
     * Parser un fichier de migration
     */
    private function parseMigrationFile(string $filePath, string $moduleName): void
    {
        $content = File::get($filePath);

        // Extraire le nom de la table
        preg_match("/Schema::create\('([^']+)'/", $content, $matches);
        if (!isset($matches[1])) {
            return;
        }

        $tableName = $matches[1];

        // Extraire uniquement le contenu de la PREMIÈRE table Schema::create()
        $tableContent = $this->extractFirstSchemaCreate($content, $tableName);

        // Extraire les colonnes uniquement de cette table
        $columns = $this->extractColumns($tableContent);

        // Extraire les indexes
        $indexes = $this->extractIndexes($tableContent);

        // Extraire les clés étrangères
        $foreignKeys = $this->extractForeignKeys($tableContent);

        $this->tables[] = [
            'name' => $tableName,
            'module' => $moduleName,
            'columns' => $columns,
            'indexes' => $indexes,
            'foreignKeys' => $foreignKeys,
            'primaryKey' => 'id', // Par défaut
        ];
    }

    /**
     * Extraire le contenu du premier Schema::create() pour une table donnée
     */
    private function extractFirstSchemaCreate(string $content, string $tableName): string
    {
        // Trouver la position de Schema::create('table_name'
        $startPattern = "Schema::create('$tableName'";
        $startPos = strpos($content, $startPattern);

        if ($startPos === false) {
            return $content;
        }

        // Trouver l'accolade ouvrante après Schema::create
        $openBracePos = strpos($content, '{', $startPos);
        if ($openBracePos === false) {
            return $content;
        }

        // Compter les accolades pour trouver la fermeture correspondante
        $braceCount = 0;
        $len = strlen($content);
        $closeBracePos = $openBracePos;

        for ($i = $openBracePos; $i < $len; $i++) {
            if ($content[$i] === '{') {
                $braceCount++;
            } elseif ($content[$i] === '}') {
                $braceCount--;
                if ($braceCount === 0) {
                    $closeBracePos = $i;
                    break;
                }
            }
        }

        // Extraire le contenu entre les accolades
        return substr($content, $startPos, $closeBracePos - $startPos + 1);
    }

    /**
     * Extraire les colonnes d'une migration
     */
    private function extractColumns(string $content): array
    {
        $columns = [];

        // Patterns pour différents types de colonnes
        $patterns = [
            // $table->id()
            '/\$table->id\(\)/' => ['name' => 'id', 'type' => 'bigInteger', 'unsigned' => true, 'autoIncrement' => true],

            // $table->string('name', 100)
            '/\$table->string\(\'([^\']+)\'(?:,\s*(\d+))?\)/' => ['type' => 'string'],

            // $table->integer('count')
            '/\$table->integer\(\'([^\']+)\'\)/' => ['type' => 'integer'],

            // $table->bigInteger('user_id')
            '/\$table->bigInteger\(\'([^\']+)\'\)/' => ['type' => 'bigInteger'],

            // $table->float('amount')
            '/\$table->float\(\'([^\']+)\'(?:,\s*(\d+),\s*(\d+))?\)/' => ['type' => 'float'],

            // $table->decimal('price', 8, 2)
            '/\$table->decimal\(\'([^\']+)\'(?:,\s*(\d+),\s*(\d+))?\)/' => ['type' => 'decimal'],

            // $table->boolean('is_active')
            '/\$table->boolean\(\'([^\']+)\'\)/' => ['type' => 'boolean'],

            // $table->text('description')
            '/\$table->text\(\'([^\']+)\'\)/' => ['type' => 'text'],

            // $table->longText('content')
            '/\$table->longText\(\'([^\']+)\'\)/' => ['type' => 'longText'],

            // $table->date('birth_date')
            '/\$table->date\(\'([^\']+)\'\)/' => ['type' => 'date'],

            // $table->datetime('created_at')
            '/\$table->datetime\(\'([^\']+)\'\)/' => ['type' => 'datetime'],

            // $table->timestamp('updated_at')
            '/\$table->timestamp\(\'([^\']+)\'\)/' => ['type' => 'timestamp'],

            // $table->timestamps()
            '/\$table->timestamps\(\)/' => ['special' => 'timestamps'],

            // $table->softDeletes()
            '/\$table->softDeletes\(\)/' => ['special' => 'softDeletes'],

            // $table->enum('status', ['active', 'inactive'])
            '/\$table->enum\(\'([^\']+)\',\s*\[([^\]]+)\]\)/' => ['type' => 'enum'],

            // $table->json('metadata')
            '/\$table->json\(\'([^\']+)\'\)/' => ['type' => 'json'],

            // $table->foreignId('user_id')
            '/\$table->foreignId\(\'([^\']+)\'\)/' => ['type' => 'foreignId'],

            // $table->foreignIdFor(Model::class)
            '/\$table->foreignIdFor\(([^:]+)::class\)/' => ['type' => 'foreignIdFor'],
        ];

        foreach ($patterns as $pattern => $defaultData) {
            preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

            foreach ($matches as $match) {
                if (isset($defaultData['special'])) {
                    // Gérer les cas spéciaux comme timestamps()
                    if ($defaultData['special'] === 'timestamps') {
                        $columns[] = ['name' => 'created_at', 'type' => 'timestamp', 'nullable' => false];
                        $columns[] = ['name' => 'updated_at', 'type' => 'timestamp', 'nullable' => false];
                    } elseif ($defaultData['special'] === 'softDeletes') {
                        $columns[] = ['name' => 'deleted_at', 'type' => 'timestamp', 'nullable' => true];
                    }
                } else {
                    $columnName = $match[1] ?? null;
                    if (!$columnName && isset($defaultData['name'])) {
                        $columnName = $defaultData['name'];
                    }

                    if ($columnName) {
                        $column = array_merge(['name' => $columnName], $defaultData);

                        // Ajouter la longueur si présente
                        if (isset($match[2])) {
                            $column['length'] = (int)$match[2];
                        }

                        // Détecter les modificateurs
                        $lineContent = $this->getLineContent($content, $columnName);
                        $column['nullable'] = str_contains($lineContent, '->nullable()');
                        $column['unique'] = str_contains($lineContent, '->unique()');
                        $column['unsigned'] = str_contains($lineContent, '->unsigned()');

                        // Extraire la valeur par défaut
                        if (preg_match('/->default\(([^\)]+)\)/', $lineContent, $defaultMatch)) {
                            $column['default'] = trim($defaultMatch[1], '\'"');
                        }

                        $columns[] = $column;
                    }
                }
            }
        }

        return $columns;
    }

    /**
     * Extraire les indexes
     */
    private function extractIndexes(string $content): array
    {
        $indexes = [];

        // $table->index('column_name')
        preg_match_all('/\$table->index\(\'([^\']+)\'\)/', $content, $matches);
        foreach ($matches[1] as $columnName) {
            $indexes[] = [
                'type' => 'index',
                'columns' => [$columnName],
            ];
        }

        // $table->unique('email')
        preg_match_all('/\$table->unique\(\'([^\']+)\'\)/', $content, $matches);
        foreach ($matches[1] as $columnName) {
            $indexes[] = [
                'type' => 'unique',
                'columns' => [$columnName],
            ];
        }

        return $indexes;
    }

    /**
     * Extraire les clés étrangères
     */
    private function extractForeignKeys(string $content): array
    {
        $foreignKeys = [];

        // $table->foreignId('user_id')->constrained()
        preg_match_all('/\$table->foreignId\(\'([^\']+)\'\)->constrained\(\)/', $content, $matches);
        foreach ($matches[1] as $columnName) {
            $referencedTable = Str::plural(str_replace('_id', '', $columnName));
            $foreignKeys[] = [
                'column' => $columnName,
                'referencedTable' => $referencedTable,
                'referencedColumn' => 'id',
            ];
        }

        // $table->foreignIdFor(Model::class)->constrained()
        preg_match_all('/\$table->foreignIdFor\(([^:]+)::class\)->constrained\(\)/', $content, $matches);
        foreach ($matches[1] as $modelClass) {
            $modelName = class_basename($modelClass);
            $columnName = Str::snake($modelName) . '_id';
            $referencedTable = Str::snake(Str::plural($modelName));

            $foreignKeys[] = [
                'column' => $columnName,
                'referencedTable' => $referencedTable,
                'referencedColumn' => 'id',
            ];
        }

        return $foreignKeys;
    }

    /**
     * Détecter les relations entre tables
     */
    private function detectRelations(): void
    {
        foreach ($this->tables as $table) {
            foreach ($table['foreignKeys'] as $fk) {
                $this->relations[] = [
                    'from' => $table['name'],
                    'to' => $fk['referencedTable'],
                    'type' => 'many-to-one',
                    'fromColumn' => $fk['column'],
                    'toColumn' => $fk['referencedColumn'],
                ];
            }
        }

        // Détecter les relations many-to-many (tables pivot)
        foreach ($this->tables as $table) {
            if (count($table['foreignKeys']) === 2 && count($table['columns']) <= 5) {
                // C'est probablement une table pivot
                $fk1 = $table['foreignKeys'][0];
                $fk2 = $table['foreignKeys'][1];

                $this->relations[] = [
                    'from' => $fk1['referencedTable'],
                    'to' => $fk2['referencedTable'],
                    'type' => 'many-to-many',
                    'pivotTable' => $table['name'],
                ];
            }
        }
    }

    /**
     * Organiser les tables par modules
     */
    private function organizeByModules(): void
    {
        $moduleGroups = [];

        foreach ($this->tables as $table) {
            $moduleName = $table['module'];
            if (!isset($moduleGroups[$moduleName])) {
                $moduleGroups[$moduleName] = [];
            }
            $moduleGroups[$moduleName][] = $table['name'];
        }

        foreach ($moduleGroups as $moduleName => $tables) {
            $this->modules[] = [
                'name' => $moduleName,
                'tables' => $tables,
                'tableCount' => count($tables),
            ];
        }
    }

    /**
     * Obtenir le contenu de la ligne contenant un nom de colonne
     */
    private function getLineContent(string $content, string $columnName): string
    {
        $lines = explode("\n", $content);
        foreach ($lines as $line) {
            if (str_contains($line, "'{$columnName}'")) {
                return $line;
            }
        }
        return '';
    }
}
