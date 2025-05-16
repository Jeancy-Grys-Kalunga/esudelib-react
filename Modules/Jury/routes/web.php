<?php

use Illuminate\Support\Facades\Route;
use Modules\Jury\Http\Controllers\JuryController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('juries', JuryController::class)->names('jury');
});
