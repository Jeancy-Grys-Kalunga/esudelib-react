<?php

use Illuminate\Support\Facades\Route;
use Modules\Jury\Http\Controllers\JuryController;
use Modules\Jury\Http\Controllers\JuryDashboardController;
use Modules\Jury\Http\Controllers\OrientationPredictionController;
use Modules\Jury\Http\Controllers\ResultsController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('jurys', JuryController::class)->names('jurys');
    Route::prefix('jury')->group(function () {
        Route::get('/dashboard', [JuryDashboardController::class, 'index'])->name('jury.dashboard');
        Route::get('/results', [ResultsController::class, 'index'])->name('jury.results');
        Route::post('/publish-results', [ResultsController::class, 'publishResults'])->name('jury.publish');
        Route::post('/add-points', [ResultsController::class, 'addPoints'])->name('jury.add-points');
        Route::post('/update-note', [ResultsController::class, 'updateNote'])->name('jury.update-note');

        Route::get('/students/{student}/academic-history', [ResultsController::class, 'getStudentAcademicHistory'])
            ->name('students.academic-history');

        // Routes de prédiction d'orientation Master
        Route::get('/orientation-predictions', [OrientationPredictionController::class, 'showPredictionInterface'])
            ->name('jury.orientation-predictions');
        Route::get('/students/{student}/predict-orientation', [OrientationPredictionController::class, 'predictOrientation'])
            ->name('jury.predict-orientation');
        Route::get('/students/{student}/get-prediction', [OrientationPredictionController::class, 'getPrediction'])
            ->name('jury.get-prediction');
        Route::post('/predict-batch', [OrientationPredictionController::class, 'predictBatch'])
            ->name('jury.predict-batch');
        Route::post('/train-model', [OrientationPredictionController::class, 'trainModel'])
            ->name('jury.train-model');
    });
    Route::post('/jury/save-grades', [ResultsController::class, 'saveGrades'])
        ->name('jury.save-grades');

    Route::get('/jury/export-results', [ResultsController::class, 'exportResults'])
        ->name('jury.export-results');

    Route::post('/jury/apply-equalization', [ResultsController::class, 'applyEqualization'])->name('jury.apply_equalization');
});
