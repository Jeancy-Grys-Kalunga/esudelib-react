<?php

use Illuminate\Support\Facades\Route;
use Modules\Institution\Http\Controllers\InstitutionController;
use Modules\Institution\Http\Controllers\DepartmentController;
use Modules\Institution\Http\Controllers\FacultyController;
use Modules\Institution\Http\Controllers\AcademicYearController;
use Modules\Institution\Http\Controllers\PromotionController;
use Modules\Institution\Http\Controllers\UnitsTeachingController;
use Modules\Institution\Http\Controllers\CourseController;
use Modules\Institution\Http\Controllers\AssignmentController;
use Modules\Institution\Http\Controllers\ExamSessionController;
use Modules\Institution\Http\Controllers\JuryController;
use Modules\Institution\Http\Controllers\ProgramController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('institutions', InstitutionController::class)->names('institutions');
    Route::post('institutions/import', [InstitutionController::class, 'importDataToExcel'])->name('import.institution');

    Route::resource('departments', DepartmentController::class)->names('departments');

    Route::resource('faculties', FacultyController::class)->names('faculties');

    Route::resource('academics', AcademicYearController::class)->names('academics');

    Route::resource('promotions', PromotionController::class)->names('promotions');
    Route::post('promotions/import', [PromotionController::class, 'import'])->name('promotions.import');

    Route::resource('units-teachings', UnitsTeachingController::class)->names('units-teachings');

    Route::resource('courses', CourseController::class)->names('courses');
    Route::post('courses/import', [CourseController::class, 'import'])->name('courses.import');
    Route::get('courses-mass-create', [CourseController::class, 'mass_create'])->name('courses.mass-create');
    Route::post('courses-mass-create', [CourseController::class, 'massStore'])->name('courses.mass-store');

    Route::get('courses/mass-edit', [CourseController::class, 'massEdit'])->name('courses.mass-edit');
    Route::put('courses/mass-update', [CourseController::class, 'massUpdate'])->name('courses.mass-update');

    Route::get('assignments/export', [AssignmentController::class, 'export'])
        ->name('assignments.export');

    // Import Excel
    Route::post('assignments/import', [AssignmentController::class, 'import'])
        ->name('assignments.import');


    Route::resource('assignments', AssignmentController::class, ['except' => ['show']])->names('assignments');

    Route::post('assignmentsbulk', [AssignmentController::class, 'bulkStore'])->name('assignments.bulk');
    Route::post('/assignments/bulk', [AssignmentController::class, 'storeBulk'])->name('assignments.store.bulk');

    Route::resource('exam-sessions', ExamSessionController::class)->except(['create', 'edit', 'show']);

    // Routes pour les programmes
    Route::resource('programs', ProgramController::class)->names('programs');

    // Routes supplémentaires pour la gestion des détails des programmes
    Route::get('programs/{program}/details/create', [ProgramController::class, 'showDetailsForm'])
        ->name('programs.details.create');

    Route::post('programs/{program}/details', [ProgramController::class, 'storeDetails'])
        ->name('programs.details.store');

    Route::get('programs/{program}/details', [ProgramController::class, 'showDetails'])
        ->name('programs.details.show');

    Route::put('programs/{program}/details', [ProgramController::class, 'updateDetails'])
        ->name('programs.details.update');

    Route::get('units-teachings-mass-create', [UnitsTeachingController::class, 'mass_create'])->name('units-teachings.mass-create');
    Route::post('units-teachings-mass-create', [UnitsTeachingController::class, 'massStore'])->name('units-teachings.mass-store');
    Route::get('units-teachings/mass-edit', [UnitsTeachingController::class, 'massEdit'])->name('units-teachings.mass-edit');
    Route::put('units-teachings/mass-update', [UnitsTeachingController::class, 'massUpdate'])->name('units-teachings.mass-update');

    Route::resource('juries', JuryController::class)->names('juries');
});
