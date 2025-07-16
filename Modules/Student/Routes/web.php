<?php

use Illuminate\Support\Facades\Route;
use Modules\Student\Http\Controllers\StudentController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('students', StudentController::class)->names('student');
    Route::prefix('student')->group(function () {
        Route::get('/courses', [StudentController::class, 'index'])->name('student.courses.index');
        Route::post('/courses', [StudentController::class, 'storeCourses'])->name('student.courses.store');
        Route::get('/results', [StudentController::class, 'results'])->name('student.results');
        Route::get('/appeals/create/{course}', [StudentController::class, 'createAppeal'])->name('student.appeals.create');
        Route::post('/appeals/{course}', [StudentController::class, 'storeAppeal'])->name('student.appeals.store');
        Route::get('/transcript', [StudentController::class, 'downloadTranscript'])->name('student.transcript.download');
    });
});
