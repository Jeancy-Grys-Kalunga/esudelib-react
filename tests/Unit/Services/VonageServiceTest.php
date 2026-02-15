<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\VonageService;
use Illuminate\Support\Facades\Http;

class VonageServiceTest extends TestCase
{
    private VonageService $service;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.vonage.api_key'    => 'TEST_KEY',
            'services.vonage.api_secret' => 'TEST_SECRET',
            'services.vonage.from'       => 'ESUDELIB',
        ]);

        $this->service = new VonageService();
    }

    public function test_send_sms_success(): void
    {
        // Arrange
        Http::fake([
            'https://rest.nexmo.com/sms/json' => Http::response([
                'messages' => [
                    [
                        'status' => '0',
                        'message-id' => 'MSG123',
                        'to' => '243812345678',
                    ]
                ]
            ], 200),
        ]);

        // Act
        $result = $this->service->sendSMS('+243812345678', 'Test message');

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('MSG123', $result['message_id']);
        $this->assertEquals('0', $result['status']);
    }

    public function test_send_sms_failure(): void
    {
        // Arrange
        Http::fake([
            'https://rest.nexmo.com/sms/json' => Http::response([
                'messages' => [
                    [
                        'status' => '1',
                        'error-text' => 'Throttled',
                    ]
                ]
            ], 200),
        ]);

        // Act
        $result = $this->service->sendSMS('243812345678', 'Test');

        // Assert
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Throttled', $result['message']);
    }

    public function test_process_delivery_receipt_delivered(): void
    {
        // Arrange
        $receipt = [
            'messageId' => 'MSG123',
            'status' => 'delivered',
            'err-code' => '0',
        ];

        // Act
        $result = $this->service->processDeliveryReceipt($receipt);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('delivered', $result['status']);
        $this->assertEquals('MSG123', $result['message_id']);
    }

    public function test_process_delivery_receipt_failed(): void
    {
        // Arrange
        $receipt = [
            'messageId' => 'MSG123',
            'status' => 'failed',
            'err-code' => '5',
        ];

        // Act
        $result = $this->service->processDeliveryReceipt($receipt);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertEquals('failed', $result['status']);
        $this->assertStringContainsString('Erreur interne Vonage', $result['message']);
    }

    public function test_handles_exception(): void
    {
        // Arrange
        Http::fake([
            'https://rest.nexmo.com/sms/json' => function () {
                throw new \Exception('Network error');
            },
        ]);

        // Act
        $result = $this->service->sendSMS('243812345678', 'Test');

        // Assert
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Network error', $result['message']);
    }

    public function test_formats_phone_number_correctly(): void
    {
        // Arrange
        Http::fake([
            'https://rest.nexmo.com/sms/json' => Http::response([
                'messages' => [
                    [
                        'status' => '0',
                        'message-id' => 'MSG123',
                    ]
                ]
            ], 200),
        ]);

        // Act
        $result = $this->service->sendSMS('0812345678', 'Test');

        // Assert
        $this->assertTrue($result['success']);
        Http::assertSent(function ($request) {
            return $request['to'] === '+243812345678';
        });
    }

    public function test_send_bulk_sms(): void
    {
        // Arrange
        Http::fake([
            'https://rest.nexmo.com/sms/json' => Http::response([
                'messages' => [
                    [
                        'status' => '0',
                        'message-id' => 'MSG123',
                    ]
                ]
            ], 200),
        ]);

        $recipients = ['+243812345678', '+243898765432', '+243811111111'];

        // Act
        $result = $this->service->sendBulkSMS($recipients, 'Bulk message');

        // Assert
        $this->assertTrue($result['success']);
        $this->assertCount(3, $result['messages']);
        foreach ($result['messages'] as $msg) {
            $this->assertEquals('MSG123', $msg['message_id']);
            $this->assertEquals('0', $msg['status']);
        }
    }

    public function test_request_includes_basic_auth(): void
    {
        // Arrange
        Http::fake([
            'https://rest.nexmo.com/sms/json' => Http::response([
                'messages' => [
                    [
                        'status' => '0',
                        'message-id' => 'MSG123',
                    ]
                ]
            ], 200),
        ]);

        // Act
        $this->service->sendSMS('+243812345678', 'Test');

        // Assert
        Http::assertSent(function ($request) {
            return $request->hasHeader('Authorization', 'Basic ' . base64_encode('TEST_KEY:TEST_SECRET'));
        });
    }
}
