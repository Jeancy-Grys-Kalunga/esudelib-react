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

// Test route for CinetPay
Route::get('/test-cinetpay', function () {
    $cinetPayService = new \App\Services\CinetPayService();

    $testData = [
        'transaction_id' => 'TEST-CINET-' . time(),
        'amount' => 100,
        'currency' => 'CDF',
        'customer_surname' => 'Doe',
        'customer_name' => 'John',
        'description' => 'Test Transaction',
        'customer_email' => 'john.doe@example.com',
        'customer_phone_number' => '+243999999999',
        'customer_address' => '123 Test St',
        'customer_city' => 'Kinshasa',
        'customer_country' => 'CD',
        'customer_state' => 'Kinshasa',
        'customer_zip_code' => '00000',
        'notify_url' => route('student.appeals.notify'),
        'return_url' => route('student.appeals.create'),
        'cancel_url' => route('student.appeals.create'),
    ];

    Log::channel('cinetpay')->info('Testing CinetPay with data:', $testData);

    try {
        $paymentData = $testData;
        // Adding dummy metadata as expected by service
        $paymentData['metadata'] = 'TEST_MODE';

        $response = $cinetPayService->createPayment($paymentData);
        Log::channel('cinetpay')->info('CinetPay Test Response:', $response);

        return response()->json([
            'test_data' => $testData,
            'response' => $response
        ]);
    } catch (\Exception $e) {
        Log::channel('cinetpay')->error('CinetPay Test Error: ' . $e->getMessage());
        return response()->json([
            'error' => $e->getMessage()
        ], 500);
    }
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

        // Missing routes for feature tests
        Route::post('/payments/create', [StudentController::class, 'createPayment'])->name('payments.create');
        Route::get('/payments/status/{id}', [StudentController::class, 'getPaymentStatus'])->name('payments.status');
        Route::get('/payments/history', [StudentController::class, 'paymentHistory'])->name('payments.history');
        Route::get('/payments/receipt/{id}', [StudentController::class, 'paymentReceipt'])->name('payments.receipt');

        Route::post('/profile/create', [StudentController::class, 'createProfile'])->name('student.profile.create');
        Route::post('/enrollment/store', [StudentController::class, 'storeEnrollment'])->name('student.enrollment.store');
        Route::post('/registration/payment', [StudentController::class, 'registrationPayment'])->name('student.registration.payment');
        Route::post('/documents/upload', [StudentController::class, 'uploadDocuments'])->name('student.documents.upload');
    });
});

Route::post('/student/payments/webhook', [StudentController::class, 'paymentWebhook'])->name('payments.webhook');
