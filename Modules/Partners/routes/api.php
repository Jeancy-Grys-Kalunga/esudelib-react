<?php

use Illuminate\Support\Facades\Route;
use Modules\Partners\Http\Controllers\PartnersController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('partners', PartnersController::class)->names('partners');
});
