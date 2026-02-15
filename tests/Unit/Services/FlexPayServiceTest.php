<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\FlexPayService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Unit tests for FlexPayService
 * 
 * Tests mobile money payments, card payments, transaction verification,
 * and merchant payouts following clean code principles.
 */
class FlexPayServiceTest extends TestCase
{
    private FlexPayService $service;

    protected function setUp(): void
    {
        parent::setUp();

        // Set up environment variables for testing
        config([
            'services.flexpay.merchant' => 'TEST_MERCHANT',
            'services.flexpay.token' => 'TEST_TOKEN',
            'services.flexpay.api_url' => 'https://api.flexpay.test/payment',
            'services.flexpay.card_url' => 'https://api.flexpay.test/card',
            'services.flexpay.check_url' => 'https://api.flexpay.test/check/',
            'services.flexpay.payout_url' => 'https://api.flexpay.test/payout'
        ]);

        $this->service = new FlexPayService();
    }

    /**
     * Test successful mobile payment creation
     *
     * @return void
     */
    public function test_create_mobile_payment_success(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/payment' => Http::response([
                'code' => '0',
                'orderNumber' => 'FLX123456789',
                'amount' => 1000
            ], 200)
        ]);

        $paymentData = [
            'customer_phone_number' => '0812345678',
            'transaction_id' => 'TXN123',
            'amount' => 1000,
            'currency' => 'CDF',
            'notify_url' => 'https://example.com/callback'
        ];

        // Act
        $result = $this->service->createMobilePayment($paymentData);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('FLX123456789', $result['orderNumber']);
        $this->assertArrayHasKey('payment_url', $result);
    }

    /**
     * Test mobile payment with phone number formatting (10 digits starting with 0)
     *
     * @return void
     */
    public function test_mobile_payment_formats_phone_number_from_10_digits(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/payment' => Http::response([
                'code' => '0',
                'orderNumber' => 'FLX123456789'
            ], 200)
        ]);

        $paymentData = [
            'customer_phone_number' => '0812345678', // Should become 243812345678
            'transaction_id' => 'TXN123',
            'amount' => 1000,
            'currency' => 'CDF',
            'notify_url' => 'https://example.com/callback'
        ];

        // Act
        $result = $this->service->createMobilePayment($paymentData);

        // Assert
        $this->assertTrue($result['success']);

        // Verify the request was made with formatted phone number
        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            return $body['phone'] === '243812345678';
        });
    }

    /**
     * Test mobile payment with phone number formatting (9 digits)
     *
     * @return void
     */
    public function test_mobile_payment_formats_phone_number_from_9_digits(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/payment' => Http::response([
                'code' => '0',
                'orderNumber' => 'FLX123456789'
            ], 200)
        ]);

        $paymentData = [
            'customer_phone_number' => '812345678', // Should become 243812345678
            'transaction_id' => 'TXN123',
            'amount' => 1000,
            'currency' => 'CDF',
            'notify_url' => 'https://example.com/callback'
        ];

        // Act
        $result = $this->service->createMobilePayment($paymentData);

        // Assert
        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            return $body['phone'] === '243812345678';
        });
    }

    /**
     * Test mobile payment with already formatted phone number (12 digits)
     *
     * @return void
     */
    public function test_mobile_payment_keeps_formatted_phone_number(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/payment' => Http::response([
                'code' => '0',
                'orderNumber' => 'FLX123456789'
            ], 200)
        ]);

        $paymentData = [
            'customer_phone_number' => '243812345678',
            'transaction_id' => 'TXN123',
            'amount' => 1000,
            'currency' => 'CDF',
            'notify_url' => 'https://example.com/callback'
        ];

        // Act
        $result = $this->service->createMobilePayment($paymentData);

        // Assert
        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            return $body['phone'] === '243812345678';
        });
    }

    /**
     * Test failed mobile payment
     *
     * @return void
     */
    public function test_create_mobile_payment_failure(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/payment' => Http::response([
                'code' => '1',
                'message' => 'Insufficient balance'
            ], 200)
        ]);

        $paymentData = [
            'customer_phone_number' => '0812345678',
            'transaction_id' => 'TXN123',
            'amount' => 1000,
            'currency' => 'CDF',
            'notify_url' => 'https://example.com/callback'
        ];

        // Act
        $result = $this->service->createMobilePayment($paymentData);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertEquals('Insufficient balance', $result['message']);
    }

    /**
     * Test successful card payment creation
     *
     * @return void
     */
    public function test_create_card_payment_success(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/payment' => Http::response([
                'code' => '0',
                'orderNumber' => 'FLX987654321',
                'amount' => 5000
            ], 200)
        ]);

        $paymentData = [
            'transaction_id' => 'TXN456',
            'amount' => 5000,
            'currency' => 'USD',
            'notify_url' => 'https://example.com/callback',
            'approve_url' => 'https://example.com/success',
            'cancel_url' => 'https://example.com/cancel',
            'decline_url' => 'https://example.com/decline'
        ];

        // Act
        $result = $this->service->createCardPayment($paymentData);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('FLX987654321', $result['orderNumber']);
        $this->assertArrayHasKey('payment_url', $result);
        $this->assertArrayHasKey('post_data', $result);
    }

    /**
     * Test card payment includes correct POST data
     *
     * @return void
     */
    public function test_card_payment_includes_post_data(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/payment' => Http::response([
                'code' => '0',
                'orderNumber' => 'FLX987654321',
                'amount' => 5000
            ], 200)
        ]);

        $paymentData = [
            'transaction_id' => 'TXN456',
            'amount' => 5000,
            'currency' => 'USD',
            'notify_url' => 'https://example.com/callback',
            'approve_url' => 'https://example.com/success',
            'cancel_url' => 'https://example.com/cancel',
            'decline_url' => 'https://example.com/decline'
        ];

        // Act
        $result = $this->service->createCardPayment($paymentData);

        // Assert
        $this->assertArrayHasKey('post_data', $result);
        $this->assertEquals('TEST_MERCHANT', $result['post_data']['merchant']);
        $this->assertEquals('FLX987654321', $result['post_data']['orderNumber']);
        $this->assertEquals(5000, $result['post_data']['amount']);
    }

    /**
     * Test successful transaction check
     *
     * @return void
     */
    public function test_check_transaction_success(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/check/*' => Http::response([
                'code' => '0',
                'transaction' => [
                    'status' => '0',
                    'amount' => 1000,
                    'reference' => 'FLX123456789'
                ]
            ], 200)
        ]);

        // Act
        $result = $this->service->checkTransaction('FLX123456789');

        // Assert
        $this->assertEquals('success', $result['status']);
        $this->assertArrayHasKey('data', $result);
        $this->assertEquals('0', $result['data']['transaction']['status']);
    }

    /**
     * Test transaction check with pending status and retry
     *
     * @return void
     */
    public function test_check_transaction_pending_then_success(): void
    {
        // Arrange
        $callCount = 0;
        Http::fake([
            'https://api.flexpay.test/check/*' => function () use (&$callCount) {
                $callCount++;

                if ($callCount === 1) {
                    // First call: pending
                    return Http::response([
                        'code' => '0',
                        'transaction' => ['status' => '1']
                    ], 200);
                }

                // Second call: success
                return Http::response([
                    'code' => '0',
                    'transaction' => ['status' => '0']
                ], 200);
            }
        ]);

        // Act
        $result = $this->service->checkTransaction('FLX123456789');

        // Assert
        $this->assertEquals('success', $result['status']);
        $this->assertGreaterThanOrEqual(2, $callCount);
    }

    /**
     * Test failed transaction check
     *
     * @return void
     */
    public function test_check_transaction_failure(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/check/*' => Http::response([
                'code' => '1',
                'message' => 'Transaction not found'
            ], 200)
        ]);

        // Act
        $result = $this->service->checkTransaction('INVALID_REF');

        // Assert
        $this->assertEquals('failed', $result['status']);
        $this->assertArrayHasKey('message', $result);
    }

    /**
     * Test successful merchant payout
     *
     * @return void
     */
    public function test_merchant_payout_success(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/payout' => Http::response([
                'code' => '0',
                'orderNumber' => 'PAYOUT123',
                'provider_reference' => 'PROVIDER_REF_123'
            ], 200)
        ]);

        $payoutData = [
            'reference' => 'PAYOUT_TXN_123',
            'recipient_phone' => '0812345678',
            'amount' => 500,
            'currency' => 'CDF',
            'callback_url' => 'https://example.com/payout-callback'
        ];

        // Act
        $result = $this->service->merchantPayout($payoutData);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('PAYOUT123', $result['orderNumber']);
        $this->assertEquals('PROVIDER_REF_123', $result['provider_reference']);
    }

    /**
     * Test payout with phone number formatting
     *
     * @return void
     */
    public function test_payout_formats_phone_number(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/payout' => Http::response([
                'code' => '0',
                'orderNumber' => 'PAYOUT123'
            ], 200)
        ]);

        $payoutData = [
            'reference' => 'PAYOUT_TXN_123',
            'recipient_phone' => '0998765432',
            'amount' => 500,
            'currency' => 'CDF',
            'callback_url' => 'https://example.com/payout-callback'
        ];

        // Act
        $result = $this->service->merchantPayout($payoutData);

        // Assert
        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            return $body['phone'] === '243998765432';
        });
    }

    /**
     * Test failed merchant payout
     *
     * @return void
     */
    public function test_merchant_payout_failure(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/payout' => Http::response([
                'code' => '1',
                'message' => 'Insufficient merchant balance'
            ], 200)
        ]);

        $payoutData = [
            'reference' => 'PAYOUT_TXN_123',
            'recipient_phone' => '0812345678',
            'amount' => 500,
            'currency' => 'CDF',
            'callback_url' => 'https://example.com/payout-callback'
        ];

        // Act
        $result = $this->service->merchantPayout($payoutData);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertEquals('Insufficient merchant balance', $result['message']);
    }

    /**
     * Test exception handling in mobile payment
     *
     * @return void
     */
    public function test_mobile_payment_handles_exception(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/payment' => function () {
                throw new \Exception('Network error');
            }
        ]);

        $paymentData = [
            'customer_phone_number' => '0812345678',
            'transaction_id' => 'TXN123',
            'amount' => 1000,
            'currency' => 'CDF',
            'notify_url' => 'https://example.com/callback'
        ];

        // Act
        $result = $this->service->createMobilePayment($paymentData);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Network error', $result['message']);
    }

    /**
     * Test authorization header is sent correctly
     *
     * @return void
     */
    public function test_requests_include_authorization_header(): void
    {
        // Arrange
        Http::fake([
            'https://api.flexpay.test/payment' => Http::response([
                'code' => '0',
                'orderNumber' => 'FLX123456789'
            ], 200)
        ]);

        $paymentData = [
            'customer_phone_number' => '0812345678',
            'transaction_id' => 'TXN123',
            'amount' => 1000,
            'currency' => 'CDF',
            'notify_url' => 'https://example.com/callback'
        ];

        // Act
        $this->service->createMobilePayment($paymentData);

        // Assert
        Http::assertSent(function ($request) {
            return $request->hasHeader('Authorization', 'Bearer TEST_TOKEN');
        });
    }
}
