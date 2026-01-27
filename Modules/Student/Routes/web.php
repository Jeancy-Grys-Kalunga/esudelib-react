<?php

use Illuminate\Support\Facades\Route;
use Modules\Student\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Log;

// Test route for FlexPay
Route::get('/test-flexpay', function () {
    $flexPayService = new \App\Services\FlexPayService();

    $testData = [
        'customer_phone_number' => '+243977107225',
        'transaction_id' => 'TEST-' . time(),
        'amount' => 100,
        'currency' => 'CDF',
        'notify_url' => route('student.appeals.notify'),
    ];

    Log::info('Testing FlexPay with data:', $testData);

    $response = $flexPayService->createMobilePayment($testData);

    Log::info('FlexPay Test Response:', $response);

    return response()->json([
        'test_data' => $testData,
        'response' => $response
    ]);
});



Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('students', StudentController::class)->names('student');
    Route::prefix('student')->group(function () {
        Route::get('/courses', [StudentController::class, 'index'])->name('student.courses.index');
        Route::post('/courses', [StudentController::class, 'storeCourses'])->name('student.courses.store');
        Route::get('/results', [StudentController::class, 'results'])->name('student.results');
        Route::get('/appeals/create', [StudentController::class, 'createAppeal'])->name('student.appeals.create');
        Route::post('/appeals', [StudentController::class, 'storeAppeal'])->name('student.appeals.store');

        // Route for payment notification
        Route::any('/appeals/notify', [StudentController::class, 'paymentNotify'])->name('student.appeals.notify');
        Route::get('/appeals/status/{reference}', [StudentController::class, 'checkPaymentStatus'])->name('student.appeals.check_status');

        Route::get('/transcript', [StudentController::class, 'downloadTranscript'])->name('student.transcript.download');
    });
});
