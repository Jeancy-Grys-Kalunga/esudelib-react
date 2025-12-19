<?php

use Illuminate\Support\Facades\Route;
use Modules\UmlViewer\Http\Controllers\UmlViewerController;

/*
|--------------------------------------------------------------------------
| Web Routes - UML Viewer Module
|--------------------------------------------------------------------------
*/

Route::middleware(['web', 'auth'])->prefix('uml-viewer')->name('uml-viewer.')->group(function () {
    // Page principale
    Route::get('/', [UmlViewerController::class, 'index'])->name('index');

    // Génération de diagrammes
    Route::post('/generate', [UmlViewerController::class, 'generateDiagram'])->name('generate');

    // Export de diagrammes
    Route::post('/export', [UmlViewerController::class, 'exportDiagram'])->name('export');

    // Détails d'une table
    Route::get('/table/{tableName}', [UmlViewerController::class, 'getTableDetails'])->name('table.details');
});
