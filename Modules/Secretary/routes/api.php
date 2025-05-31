<?php

use Illuminate\Support\Facades\Route;
use Modules\Secretary\Http\Controllers\SecretaryController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('secretaries', SecretaryController::class)->names('secretary');
});
