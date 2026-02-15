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



    Route::prefix('jury')->group(function () {
        // Dashboard
        Route::get('/dashboard', [JuryDashboardController::class, 'index'])->name('jury.dashboard');

        // Gestion des Résultats et Notes
        Route::controller(ResultsController::class)->group(function () {
            Route::get('/results', 'index')->name('jury.results');
            Route::post('/publish-results', 'publishResults')->name('jury.publish-results');
            Route::post('/add-points', 'addPoints')->name('jury.add-points');
            Route::post('/course-details/update', 'updateCourseDetails')->name('jury.update-course-details');
            Route::post('/update-note', 'updateNote')->name('jury.update-note');
            Route::post('/save-grades', 'saveGrades')->name('jury.save-grades');
            Route::get('/export-results', 'exportResults')->name('jury.export-results');
            Route::post('/apply-equalization', 'applyEqualization')->name('jury.apply-equalization');

            // Historique académique
            Route::get('/students/{student}/academic-history', 'getStudentAcademicHistory')
                ->name('jury.student-history');

            // Route pour l'impression de délibération
            Route::get('/print/deliberation/{promotion}', 'printDeliberation')->name('jury.print.deliberation');
        });

        // Système de prédiction des filières Master
        Route::prefix('predictions')->controller(OrientationPredictionController::class)->group(function () {
            Route::get('/orientation', 'showPredictionInterface')->name('jury.prediction.interface');
            Route::post('/train-model', 'trainModel')->name('jury.prediction.train');
            Route::get('/model-status', 'getModelStatus')->name('jury.prediction.model-status');

            // Prédictions
            Route::get('/students/{student_id}/predict', 'predictOrientation')->name('jury.prediction.student');
            Route::get('/students/{student_id}/get-prediction', 'getPrediction')->name('jury.get-prediction');
            Route::post('/predict-batch', 'predictBatch')->name('jury.prediction.batch');
            Route::post('/generate-dataset', 'generateDataset')->name('jury.generate-dataset');

            // Téléchargements et rapports
            Route::get('/export/{student_id}', 'exportPredictionReport')->name('jury.export-prediction');
            Route::get('/export-all', 'exportAllPredictions')->name('jury.export-all-predictions');
        });
    });

    // Interface pour les étudiants
    Route::get('/student/master-prediction', [OrientationPredictionController::class, 'studentPredictionInterface'])
        ->middleware('role:Etudiant')
        ->name('student.prediction');

    // Ressources principales du Jury - Accessibles uniquement au Jury (Mis après pour éviter les conflits de prefix)
    Route::resource('jury', JuryController::class)->names('jury');

    // Proxy API pour le service ML
    Route::prefix('api/ml')->group(function () {
        Route::post('/train', function () {
            return app(MasterPredictionService::class)->trainModel();
        });

        Route::post('/predict', function (Request $request) {
            $data = $request->validate([
                'student_id' => 'required|exists:students,id'
            ]);

            $student = Student::find($data['student_id']);
            return app(MasterPredictionService::class)->predictForStudent($student);
        });
    });
});

// Webhooks
Route::prefix('webhooks')->group(function () {
    Route::post('/ml-training-complete', function (Request $request) {
        Log::info('Webhook ML training complete received', $request->all());
        return response()->json(['success' => true]);
    })->name('webhooks.ml-training-complete');

    Route::post('/model-updated', function (Request $request) {
        Log::info('Webhook model updated received', $request->all());
        Cache::forget('ml_model_status');
        return response()->json(['success' => true]);
    })->name('webhooks.model-updated');
});
