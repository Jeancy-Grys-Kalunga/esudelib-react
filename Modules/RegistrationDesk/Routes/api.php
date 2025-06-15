<?php

use Illuminate\Support\Facades\Route;
use Modules\RegistrationDesk\Http\Controllers\RegistrationDeskController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('registrationdesks', RegistrationDeskController::class)->names('registrationdesk');
});
