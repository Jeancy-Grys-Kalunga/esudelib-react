<?php

namespace Modules\UmlViewer\Services\DiagramGenerators;

use Modules\UmlViewer\Services\DatabaseAnalyzer;

/**
 * Générateur de code SQL pour MySQL et PostgreSQL
 * 
 * Ce service génère les scripts SQL de création de tables
 * basés sur l'analyse des migrations Laravel.
 */
class SqlGenerator
{
    public function __construct(
        private DatabaseAnalyzer $analyzer
    ) {}

    /**
     * Générer le script SQL pour MySQL
     */
    public function generateMySQL(array $options = []): string
    {
        return $this->generate('mysql', $options);
    }

    /**
     * Générer le script SQL pour PostgreSQL
     */
    public function generatePostgreSQL(array $options = []): string
    {
        return $this->generate('postgresql', $options);
    }

    /**
     * Générer le script SQL pour le type spécifié
     */
    public function generate(string $type = 'mysql', array $options = []): string
    {
        $schema = $this->analyzer->analyze();

        $sql = $this->generateHeader($type);

        // Tables essentielles à inclure (même liste que pour les diagrammes)
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

        // Trier les tables pour respecter les dépendances (tables référencées en premier)
        $sortedTables = $this->sortTablesByDependency($filteredTables);

        // Générer les tables
        foreach ($sortedTables as $table) {
            $sql .= $this->generateTable($table, $type);
        }

        // Générer les contraintes de clés étrangères séparément (après toutes les tables)
        $sql .= $this->generateForeignKeyConstraints($sortedTables, $type);

        $sql .= $this->generateFooter($type);

        return $sql;
    }

    /**
     * Générer l'en-tête du script SQL
     */
    private function generateHeader(string $type): string
    {
        $now = now()->format('Y-m-d H:i:s');

        if ($type === 'mysql') {
            return <<<SQL
-- ============================================
-- Script de création de base de données MySQL
-- Système esudelib - Généré automatiquement
-- Date: {$now}
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

-- Utiliser UTF8MB4 pour le support complet Unicode
SET NAMES utf8mb4;


SQL;
        }

        // PostgreSQL
        return <<<SQL
-- ============================================
-- Script de création de base de données PostgreSQL
-- Système esudelib - Généré automatiquement
-- Date: {$now}
-- ============================================

-- Désactiver les vérifications de FK temporairement
SET session_replication_role = 'replica';


SQL;
    }

    /**
     * Générer le pied de page du script SQL
     */
    private function generateFooter(string $type): string
    {
        if ($type === 'mysql') {
            return <<<SQL

-- ============================================
-- Fin du script
-- ============================================

SET FOREIGN_KEY_CHECKS = 1;

SQL;
        }

        // PostgreSQL
        return <<<SQL

-- ============================================
-- Fin du script
-- ============================================

-- Réactiver les vérifications de FK
SET session_replication_role = 'origin';

SQL;
    }

    /**
     * Générer le SQL pour une table
     */
    private function generateTable(array $table, string $type): string
    {
        $tableName = $table['name'];
        $columns = [];

        // Générer les colonnes
        foreach ($table['columns'] as $column) {
            $columns[] = $this->generateColumn($column, $table, $type);
        }

        // Ajouter la contrainte de clé primaire
        $pkColumn = $table['primaryKey'] ?? 'id';
        $columns[] = $this->generatePrimaryKey($pkColumn, $type);

        // Ajouter les contraintes UNIQUE
        foreach ($table['columns'] as $column) {
            if ($column['unique'] ?? false) {
                $columns[] = $this->generateUniqueConstraint($column['name'], $tableName, $type);
            }
        }

        $columnsStr = implode(",\n    ", $columns);

        if ($type === 'mysql') {
            return <<<SQL

-- Table: {$tableName}
DROP TABLE IF EXISTS `{$tableName}`;
CREATE TABLE `{$tableName}` (
    {$columnsStr}
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


SQL;
        }

        // PostgreSQL
        return <<<SQL

-- Table: {$tableName}
DROP TABLE IF EXISTS "{$tableName}" CASCADE;
CREATE TABLE "{$tableName}" (
    {$columnsStr}
);


SQL;
    }

    /**
     * Générer le SQL pour une colonne
     */
    private function generateColumn(array $column, array $table, string $type): string
    {
        $name = $column['name'];
        $sqlType = $this->mapType($column['type'], $type);
        $nullable = ($column['nullable'] ?? false) ? '' : ' NOT NULL';
        $default = '';

        // Valeur par défaut
        if (isset($column['default'])) {
            $defaultValue = $column['default'];
            if ($defaultValue === 'true' || $defaultValue === 'false') {
                $default = $type === 'mysql'
                    ? ' DEFAULT ' . ($defaultValue === 'true' ? '1' : '0')
                    : ' DEFAULT ' . $defaultValue;
            } elseif (is_numeric($defaultValue)) {
                $default = " DEFAULT {$defaultValue}";
            } else {
                $default = " DEFAULT '{$defaultValue}'";
            }
        }

        // Auto-increment pour les clés primaires
        $autoIncrement = '';
        if ($name === 'id' || $name === $table['primaryKey']) {
            if ($type === 'mysql') {
                $sqlType = 'BIGINT UNSIGNED';
                $autoIncrement = ' AUTO_INCREMENT';
            } else {
                $sqlType = 'BIGSERIAL';
            }
        }

        // Unsigned pour MySQL (clés étrangères)
        $unsigned = '';
        if ($type === 'mysql') {
            foreach ($table['foreignKeys'] as $fk) {
                if ($fk['column'] === $name) {
                    $unsigned = ' UNSIGNED';
                    break;
                }
            }
        }

        if ($type === 'mysql') {
            return "`{$name}` {$sqlType}{$unsigned}{$nullable}{$default}{$autoIncrement}";
        }

        // PostgreSQL
        return "\"{$name}\" {$sqlType}{$nullable}{$default}";
    }

    /**
     * Générer la contrainte de clé primaire
     */
    private function generatePrimaryKey(string $column, string $type): string
    {
        if ($type === 'mysql') {
            return "PRIMARY KEY (`{$column}`)";
        }

        return "PRIMARY KEY (\"{$column}\")";
    }

    /**
     * Générer une contrainte UNIQUE
     */
    private function generateUniqueConstraint(string $column, string $tableName, string $type): string
    {
        $constraintName = "{$tableName}_{$column}_unique";

        if ($type === 'mysql') {
            return "UNIQUE KEY `{$constraintName}` (`{$column}`)";
        }

        return "CONSTRAINT \"{$constraintName}\" UNIQUE (\"{$column}\")";
    }

    /**
     * Générer les contraintes de clés étrangères
     */
    private function generateForeignKeyConstraints(array $tables, string $type): string
    {
        $sql = "\n-- ============================================\n";
        $sql .= "-- Contraintes de clés étrangères\n";
        $sql .= "-- ============================================\n\n";

        foreach ($tables as $table) {
            foreach ($table['foreignKeys'] as $fk) {
                $constraintName = "{$table['name']}_{$fk['column']}_foreign";

                if ($type === 'mysql') {
                    $sql .= "ALTER TABLE `{$table['name']}` ";
                    $sql .= "ADD CONSTRAINT `{$constraintName}` ";
                    $sql .= "FOREIGN KEY (`{$fk['column']}`) ";
                    $sql .= "REFERENCES `{$fk['referencedTable']}` (`{$fk['referencedColumn']}`) ";
                    $sql .= "ON DELETE CASCADE ON UPDATE CASCADE;\n";
                } else {
                    // PostgreSQL
                    $sql .= "ALTER TABLE \"{$table['name']}\" ";
                    $sql .= "ADD CONSTRAINT \"{$constraintName}\" ";
                    $sql .= "FOREIGN KEY (\"{$fk['column']}\") ";
                    $sql .= "REFERENCES \"{$fk['referencedTable']}\" (\"{$fk['referencedColumn']}\") ";
                    $sql .= "ON DELETE CASCADE ON UPDATE CASCADE;\n";
                }
            }
        }

        return $sql;
    }

    /**
     * Mapper les types Laravel vers les types SQL
     */
    private function mapType(string $laravelType, string $dbType): string
    {
        $mysqlTypes = [
            'bigInteger' => 'BIGINT',
            'integer' => 'INT',
            'smallInteger' => 'SMALLINT',
            'tinyInteger' => 'TINYINT',
            'string' => 'VARCHAR(255)',
            'char' => 'CHAR(255)',
            'text' => 'TEXT',
            'longText' => 'LONGTEXT',
            'mediumText' => 'MEDIUMTEXT',
            'float' => 'FLOAT(8, 2)',
            'double' => 'DOUBLE(15, 8)',
            'decimal' => 'DECIMAL(10, 2)',
            'boolean' => 'TINYINT(1)',
            'date' => 'DATE',
            'datetime' => 'DATETIME',
            'timestamp' => 'TIMESTAMP',
            'json' => 'JSON',
            'enum' => 'ENUM',
            'foreignId' => 'BIGINT',
            'foreignIdFor' => 'BIGINT',
        ];

        $postgresTypes = [
            'bigInteger' => 'BIGINT',
            'integer' => 'INTEGER',
            'smallInteger' => 'SMALLINT',
            'tinyInteger' => 'SMALLINT',
            'string' => 'VARCHAR(255)',
            'char' => 'CHAR(255)',
            'text' => 'TEXT',
            'longText' => 'TEXT',
            'mediumText' => 'TEXT',
            'float' => 'REAL',
            'double' => 'DOUBLE PRECISION',
            'decimal' => 'DECIMAL(10, 2)',
            'boolean' => 'BOOLEAN',
            'date' => 'DATE',
            'datetime' => 'TIMESTAMP',
            'timestamp' => 'TIMESTAMP',
            'json' => 'JSONB',
            'enum' => 'VARCHAR(50)',
            'foreignId' => 'BIGINT',
            'foreignIdFor' => 'BIGINT',
        ];

        $types = $dbType === 'mysql' ? $mysqlTypes : $postgresTypes;

        return $types[$laravelType] ?? ($dbType === 'mysql' ? 'VARCHAR(255)' : 'VARCHAR(255)');
    }

    /**
     * Trier les tables par dépendance (tables référencées en premier)
     */
    private function sortTablesByDependency(array $tables): array
    {
        $sorted = [];
        $remaining = $tables;
        $maxIterations = count($tables) * 2;
        $iteration = 0;

        while (!empty($remaining) && $iteration < $maxIterations) {
            $iteration++;

            foreach ($remaining as $key => $table) {
                $canInsert = true;

                foreach ($table['foreignKeys'] as $fk) {
                    $referencedTable = $fk['referencedTable'];

                    // Vérifier si la table référencée est déjà triée
                    $found = false;
                    foreach ($sorted as $sortedTable) {
                        if ($sortedTable['name'] === $referencedTable) {
                            $found = true;
                            break;
                        }
                    }

                    // Ignorer les auto-références
                    if ($referencedTable === $table['name']) {
                        continue;
                    }

                    // Si la table référencée n'est pas encore triée et existe dans remaining
                    $existsInRemaining = false;
                    foreach ($remaining as $rem) {
                        if ($rem['name'] === $referencedTable) {
                            $existsInRemaining = true;
                            break;
                        }
                    }

                    if (!$found && $existsInRemaining) {
                        $canInsert = false;
                        break;
                    }
                }

                if ($canInsert) {
                    $sorted[] = $table;
                    unset($remaining[$key]);
                }
            }
        }

        // Ajouter les tables restantes (potentiellement avec des références circulaires)
        foreach ($remaining as $table) {
            $sorted[] = $table;
        }

        return $sorted;
    }
}
