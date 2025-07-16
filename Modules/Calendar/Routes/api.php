<?php

use Illuminate\Support\Facades\Route;
use Modules\Calendar\Http\Controllers\CalendarController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('calendars', CalendarController::class)->names('calendar');
});
