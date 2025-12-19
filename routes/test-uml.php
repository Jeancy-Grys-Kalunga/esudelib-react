<?php

use Illuminate\Support\Facades\Route;
use Modules\UmlViewer\Services\DatabaseAnalyzer;
use Modules\UmlViewer\Services\DiagramGenerators\ClassDiagramGenerator;

// Route de test pour vérifier que tout fonctionne
Route::get('/test-uml', function () {
    try {
        $analyzer = app(DatabaseAnalyzer::class);
        $schema = $analyzer->analyze();

        $generator = app(ClassDiagramGenerator::class);
        $plantUML = $generator->generate();

        return response()->json([
            'success' => true,
            'tables_count' => count($schema['tables']),
            'relations_count' => count($schema['relations']),
            'modules_count' => count($schema['modules']),
            'plantuml_length' => strlen($plantUML),
            'first_100_chars' => substr($plantUML, 0, 100),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ], 500);
    }
});
