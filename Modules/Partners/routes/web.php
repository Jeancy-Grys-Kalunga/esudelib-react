<?php

use Illuminate\Support\Facades\Route;
use Modules\Partners\Http\Controllers\PartnersController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('partners', PartnersController::class)->names('partners');
});
