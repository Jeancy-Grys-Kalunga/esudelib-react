<?php

use Illuminate\Support\Facades\Route;
use Modules\RegistrationDesk\Http\Controllers\RegistrationDeskController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('registrationdesks', RegistrationDeskController::class)->names('registrationdesk');
});
