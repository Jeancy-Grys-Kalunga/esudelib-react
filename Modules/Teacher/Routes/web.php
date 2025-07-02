<?php

use Illuminate\Support\Facades\Route;
use Modules\Teacher\Http\Controllers\TeacherController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('teachers', TeacherController::class)->names('teachers');
});
Route::prefix('teacher')->group(function () {
    Route::get('/courses', [TeacherController::class, 'courses'])->name('teacher.courses');
    Route::get('/courses/{course}/export', [TeacherController::class, 'exportStudents'])->name('teacher.courses.export');
    Route::post('/courses/{course}/submit-grades', [TeacherController::class, 'submitGrades'])->name('teacher.courses.submit');
    Route::get('/courses/{course}/appeals', [TeacherController::class, 'appeals'])->name('teacher.courses.appeals');
    Route::get('/courses/{course}/submit-grades/form', [TeacherController::class, 'showSubmitForm'])->name('teacher.courses.submit.form');
    Route::get('/courses/{course}/online-editor', [TeacherController::class, 'showOnlineEditor'])
        ->name('teacher.courses.online-editor');
    Route::post('/courses/{course}/save-grades', [TeacherController::class, 'saveGrades'])
        ->name('teacher.courses.save-grades');
        Route::get('/courses/{course}/online-editor/data', [TeacherController::class, 'getOnlineEditorData'])
    ->name('teacher.courses.online-editor.data');
});
