<?php

use Illuminate\Support\Facades\Route;
use Modules\Jury\Http\Controllers\JuryController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('jurys', JuryController::class)->names('jurys');
});
