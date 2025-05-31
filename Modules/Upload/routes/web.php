<?php

use Illuminate\Support\Facades\Route;
use Modules\Upload\Http\Controllers\UploadController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('uploads', UploadController::class)->names('upload');
     Route::post('/dropzone/upload', [UploadController::class, 'dropzoneUpload'])->name('dropzone.upload');
    Route::post('/dropzone/delete', [UploadController::class, 'dropzoneDelete'])->name('dropzone.delete');
    //Filepond
    Route::post('/filepond/upload', [UploadController::class, 'filepondUpload'])->name('filepond.upload');
    Route::delete('/filepond/delete', [UploadController::class, 'filepondDelete'])->name('filepond.delete');
});




