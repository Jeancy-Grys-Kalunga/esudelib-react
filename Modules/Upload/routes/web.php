<?php

use Illuminate\Support\Facades\Route;
use Modules\Upload\Http\Controllers\UploadController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('uploads', UploadController::class)->names('upload');
});
