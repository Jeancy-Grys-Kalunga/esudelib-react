<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\CinetPayService;
use Illuminate\Support\Facades\Http;

/**
 * Unit tests for CinetPayService
 * 
 * Tests payment initialization, verification, and webhook handling
 * following clean code principles.
 */
class CinetPayServiceTest extends TestCase
{
    private CinetPayService $service;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.cinetpay.api_key' => 'TEST_API_KEY',
            'services.cinetpay.site_id' => 'TEST_SITE_ID',
            'services.cinetpay.secret_key' => 'TEST_SECRET',
            'services.cinetpay.payment_url' => 'https://api.cinetpay.test/payment',
            'services.cinetpay.check_url' => 'https://api.cinetpay.test/check'
        ]);

        $this->service = new CinetPayService();
    }

    /**
     * Test successful payment initialization
     *
     * @return void
     */
    public function test_initialize_payment_success(): void
    {
        // Arrange
        Http::fake([
            'https://api.cinetpay.test/payment' => Http::response([
                'code' => '00',
                'message' => 'SUCCESS',
                'data' => [
                    'payment_url' => 'https://checkout.cinetpay.test/pay/123',
                    'payment_token' => 'TOKEN123'
                ]
            ], 200)
        ]);

        $paymentData = [
            'transaction_id' => 'TXN123',
            'amount' => 5000,
            'currency' => 'XOF',
            'description' => 'Test payment',
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'notify_url' => 'https://example.com/notify',
            'return_url' => 'https://example.com/return'
        ];

        // Act
        $result = $this->service->initializePayment($paymentData);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('payment_url', $result);
        $this->assertArrayHasKey('payment_token', $result);
        $this->assertEquals('https://checkout.cinetpay.test/pay/123', $result['payment_url']);
    }

    /**
     * Test failed payment initialization
     *
     * @return void
     */
    public function test_initialize_payment_failure(): void
    {
        // Arrange
        Http::fake([
            'https://api.cinetpay.test/payment' => Http::response([
                'code' => '01',
                'message' => 'Invalid API key'
            ], 400)
        ]);

        $paymentData = [
            'transaction_id' => 'TXN123',
            'amount' => 5000,
            'currency' => 'XOF',
            'description' => 'Test payment',
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'notify_url' => 'https://example.com/notify',
            'return_url' => 'https://example.com/return'
        ];

        // Act
        $result = $this->service->initializePayment($paymentData);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertEquals('Invalid API key', $result['message']);
    }

    /**
     * Test successful payment verification
     *
     * @return void
     */
    public function test_verify_payment_success(): void
    {
        // Arrange
        Http::fake([
            'https://api.cinetpay.test/check' => Http::response([
                'code' => '00',
                'message' => 'SUCCES',
                'data' => [
                    'status' => 'ACCEPTED',
                    'amount' => 5000,
                    'transaction_id' => 'TXN123',
                    'payment_method' => 'CARD'
                ]
            ], 200)
        ]);

        // Act
        $result = $this->service->verifyPayment('TXN123');

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('ACCEPTED', $result['status']);
        $this->assertEquals(5000, $result['amount']);
    }

    /**
     * Test payment verification with pending status
     *
     * @return void
     */
    public function test_verify_payment_pending(): void
    {
        // Arrange
        Http::fake([
            'https://api.cinetpay.test/check' => Http::response([
                'code' => '00',
                'message' => 'SUCCES',
                'data' => [
                    'status' => 'PENDING',
                    'amount' => 5000,
                    'transaction_id' => 'TXN123'
                ]
            ], 200)
        ]);

        // Act
        $result = $this->service->verifyPayment('TXN123');

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('PENDING', $result['status']);
    }

    /**
     * Test payment verification with rejected status
     *
     * @return void
     */
    public function test_verify_payment_rejected(): void
    {
        // Arrange
        Http::fake([
            'https://api.cinetpay.test/check' => Http::response([
                'code' => '00',
                'message' => 'SUCCES',
                'data' => [
                    'status' => 'REFUSED',
                    'amount' => 5000,
                    'transaction_id' => 'TXN123'
                ]
            ], 200)
        ]);

        // Act
        $result = $this->service->verifyPayment('TXN123');

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('REFUSED', $result['status']);
    }

    /**
     * Test webhook signature validation
     *
     * @return void
     */
    public function test_validate_webhook_signature_success(): void
    {
        // Arrange
        $payload = [
            'cpm_trans_id' => 'CPM123',
            'cpm_amount' => 5000,
            'cpm_currency' => 'XOF',
            'cpm_trans_status' => 'ACCEPTED'
        ];

        $signature = hash_hmac('sha256', json_encode($payload), 'TEST_SECRET');

        // Act
        $result = $this->service->validateWebhookSignature($payload, $signature);

        // Assert
        $this->assertTrue($result);
    }

    /**
     * Test webhook signature validation failure
     *
     * @return void
     */
    public function test_validate_webhook_signature_failure(): void
    {
        // Arrange
        $payload = [
            'cpm_trans_id' => 'CPM123',
            'cpm_amount' => 5000,
            'cpm_currency' => 'XOF',
            'cpm_trans_status' => 'ACCEPTED'
        ];

        $invalidSignature = 'invalid_signature';

        // Act
        $result = $this->service->validateWebhookSignature($payload, $invalidSignature);

        // Assert
        $this->assertFalse($result);
    }

    /**
     * Test payment initialization includes correct headers
     *
     * @return void
     */
    public function test_payment_request_includes_api_key(): void
    {
        // Arrange
        Http::fake([
            'https://api.cinetpay.test/payment' => Http::response([
                'code' => '00',
                'data' => ['payment_url' => 'https://checkout.cinetpay.test/pay/123']
            ], 200)
        ]);

        $paymentData = [
            'transaction_id' => 'TXN123',
            'amount' => 5000,
            'currency' => 'XOF',
            'description' => 'Test',
            'customer_name' => 'John',
            'customer_email' => 'john@example.com',
            'notify_url' => 'https://example.com/notify',
            'return_url' => 'https://example.com/return'
        ];

        // Act
        $this->service->initializePayment($paymentData);

        // Assert
        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            return $body['apikey'] === 'TEST_API_KEY'
                && $body['site_id'] === 'TEST_SITE_ID';
        });
    }

    /**
     * Test exception handling
     *
     * @return void
     */
    public function test_handles_network_exception(): void
    {
        // Arrange
        Http::fake([
            'https://api.cinetpay.test/payment' => function () {
                throw new \Exception('Network error');
            }
        ]);

        $paymentData = [
            'transaction_id' => 'TXN123',
            'amount' => 5000,
            'currency' => 'XOF',
            'description' => 'Test',
            'customer_name' => 'John',
            'customer_email' => 'john@example.com',
            'notify_url' => 'https://example.com/notify',
            'return_url' => 'https://example.com/return'
        ];

        // Act
        $result = $this->service->initializePayment($paymentData);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Network error', $result['message']);
    }
}
