<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Http\Controllers\RolesController;
use Modules\User\Http\Controllers\UserController;
use Modules\User\Http\Controllers\UsersController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('users', UserController::class)->names('user');
});


Route::group(['middleware' => 'auth'], function () {

    //User Profile
    Route::get('/user/profile', 'ProfileController@edit')->name('profile.edit');
    Route::patch('/user/profile', 'ProfileController@update')->name('profile.update');
    Route::patch('/user/password', 'ProfileController@updatePassword')->name('profile.update.password');

    //Users
    Route::resource('users', UsersController::class)->except('show');

    //Roles
    Route::resource('roles', RolesController::class)->except('show');

});

