<?php

use Illuminate\Support\Facades\Route;
use Modules\Secretary\Http\Controllers\SecretaryController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('secretaries', SecretaryController::class)->names('secretary');
});
