<?php

use Illuminate\Support\Facades\Route;
use Modules\Calendar\Http\Controllers\CalendarController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('calendars', CalendarController::class)->names('calendar');
});
