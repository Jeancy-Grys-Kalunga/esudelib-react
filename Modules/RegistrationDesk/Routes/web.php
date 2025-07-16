<?php

use Illuminate\Support\Facades\Route;
use Modules\RegistrationDesk\Http\Controllers\RegistrationDeskController;
use Modules\RegistrationDesk\Http\Controllers\SubscriptionController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('registrationdesks', RegistrationDeskController::class)->names('registrationdesk');
    Route::resource('subscriptions', SubscriptionController::class)->names('subscriptions');
    Route::post('subscriptions/import', [SubscriptionController::class, 'import'])->name('subscriptions.import');
});

