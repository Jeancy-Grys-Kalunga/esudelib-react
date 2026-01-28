<?php

use Illuminate\Support\Facades\Route;
use Modules\Jury\Http\Controllers\JuryController;
use Modules\Jury\Http\Controllers\JuryDashboardController;
use Modules\Jury\Http\Controllers\OrientationPredictionController;
use Modules\Jury\Http\Controllers\ResultsController;
use Modules\Jury\Services\MasterPredictionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Modules\Student\Entities\Student;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('jurys', JuryController::class)->names('jurys');

    Route::prefix('jury')->group(function () {
        // Dashboard et gestion générale
        Route::get('/dashboard', [JuryDashboardController::class, 'index'])->name('jury.dashboard');

        // Résultats et notes
        Route::get('/results', [ResultsController::class, 'index'])->name('jury.results');
        Route::post('/publish-results', [ResultsController::class, 'publishResults'])->name('jury.publish');
        Route::post('/add-points', [ResultsController::class, 'addPoints'])->name('jury.add-points');
        Route::post('/update-note', [ResultsController::class, 'updateNote'])->name('jury.update-note');
        Route::post('/save-grades', [ResultsController::class, 'saveGrades'])->name('jury.save-grades');
        Route::get('/export-results', [ResultsController::class, 'exportResults'])->name('jury.export-results');
        Route::post('/apply-equalization', [ResultsController::class, 'applyEqualization'])->name('jury.apply_equalization');

        // Historique académique des étudiants
        Route::get('/students/{student}/academic-history', [ResultsController::class, 'getStudentAcademicHistory'])
            ->name('students.academic-history');

        // Système de prédiction des filières Master
        Route::prefix('predictions')->group(function () {
            // Interface principale
            Route::get('/orientation', [OrientationPredictionController::class, 'showPredictionInterface'])
                ->name('jury.orientation-predictions');

            // Gestion du modèle ML
            Route::post('/train-model', [OrientationPredictionController::class, 'trainModel'])
                ->name('jury.train-model');
            Route::get('/model-status', [OrientationPredictionController::class, 'getModelStatus'])
                ->name('jury.model-status');

            // Prédictions individuelles
            Route::get('/students/{student}/predict', [OrientationPredictionController::class, 'predictOrientation'])
                ->name('jury.predict-orientation');
            Route::get('/students/{student}/get-prediction', [OrientationPredictionController::class, 'getPrediction'])
                ->name('jury.get-prediction');

            // Prédictions en lot
            Route::post('/predict-batch', [OrientationPredictionController::class, 'predictBatch'])
                ->name('jury.predict-batch');

            // Génération de dataset
            Route::post('/generate-dataset', [OrientationPredictionController::class, 'generateDataset'])
                ->name('jury.generate-dataset');

            // Téléchargement des rapports
            Route::get('/export/{student}', [OrientationPredictionController::class, 'exportPredictionReport'])
                ->name('jury.export-prediction');
            Route::get('/export-all', [OrientationPredictionController::class, 'exportAllPredictions'])
                ->name('jury.export-all-predictions');
        });

        // Interface pour les étudiants (accessible depuis leur dashboard)
        Route::get('/student/master-prediction', [OrientationPredictionController::class, 'studentPredictionInterface'])
            ->middleware('role:student')
            ->name('student.master-prediction');
    });

    // Routes pour l'API ML (si vous utilisez Flask séparément)
    Route::prefix('api/ml')->group(function () {
        Route::post('/train', function () {
            // Route proxy vers le service Flask
            return app(MasterPredictionService::class)->trainModel();
        });

        Route::post('/predict', function (Request $request) {
            // Route proxy pour la prédiction
            $studentData = $request->validate([
                'student_id' => 'required|exists:students,id'
            ]);

            $student = Student::find($studentData['student_id']);
            return app(MasterPredictionService::class)->predictForStudent($student);
        });
    });
});

// Routes accessibles sans authentification pour les webhooks/API externes
Route::prefix('webhooks')->group(function () {
    Route::post('/ml-training-complete', function (Request $request) {
        // Webhook pour notifier de la fin de l'entraînement
        Log::info('Webhook ML training complete received', $request->all());

        // Mettre à jour le statut du modèle
        return response()->json(['success' => true]);
    })->name('webhooks.ml-training-complete');

    Route::post('/model-updated', function (Request $request) {
        // Webhook pour notifier de la mise à jour du modèle
        Log::info('Webhook model updated received', $request->all());

        // Invalider le cache du modèle
        Cache::forget('ml_model_status');

        return response()->json(['success' => true]);
    })->name('webhooks.model-updated');
});
