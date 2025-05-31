<?php

use Illuminate\Support\Facades\Route;
use Modules\Upload\Http\Controllers\UploadController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('uploads', UploadController::class)->names('upload');
});
