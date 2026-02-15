<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\InfoBipService;
use Illuminate\Support\Facades\Http;

/**
 * Unit tests for InfoBipService
 * 
 * Tests SMS sending functionality and message status checking
 * following clean code principles.
 */
class InfoBipServiceTest extends TestCase
{
    private InfoBipService $service;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.infobip.api_key' => 'TEST_API_KEY',
            'services.infobip.base_url' => 'https://api.infobip.test',
            'services.infobip.sender' => 'ESUDELIB'
        ]);

        $this->service = new InfoBipService();
    }

    /**
     * Test successful SMS sending
     *
     * @return void
     */
    public function test_send_sms_success(): void
    {
        // Arrange
        Http::fake([
            'https://api.infobip.test/sms/2/text/advanced' => Http::response([
                'messages' => [
                    [
                        'messageId' => 'MSG123',
                        'status' => [
                            'groupId' => 1,
                            'groupName' => 'PENDING',
                            'id' => 26,
                            'name' => 'PENDING_ACCEPTED'
                        ],
                        'to' => '243812345678'
                    ]
                ]
            ], 200)
        ]);

        // Act
        $result = $this->service->sendSMS('243812345678', 'Test message');

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('MSG123', $result['message_id']);
        $this->assertEquals('PENDING_ACCEPTED', $result['status']);
    }

    /**
     * Test SMS sending to multiple recipients
     *
     * @return void
     */
    public function test_send_sms_to_multiple_recipients(): void
    {
        // Arrange
        Http::fake([
            'https://api.infobip.test/sms/2/text/advanced' => Http::response([
                'messages' => [
                    ['messageId' => 'MSG123', 'to' => '243812345678'],
                    ['messageId' => 'MSG124', 'to' => '243898765432']
                ]
            ], 200)
        ]);

        // Act
        $result = $this->service->sendBulkSMS(
            ['243812345678', '243898765432'],
            'Test message'
        );

        // Assert
        $this->assertTrue($result['success']);
        $this->assertCount(2, $result['messages']);
    }

    /**
     * Test failed SMS sending
     *
     * @return void
     */
    public function test_send_sms_failure(): void
    {
        // Arrange
        Http::fake([
            'https://api.infobip.test/sms/2/text/advanced' => Http::response([
                'requestError' => [
                    'serviceException' => [
                        'messageId' => 'UNAUTHORIZED',
                        'text' => 'Invalid API key'
                    ]
                ]
            ], 401)
        ]);

        // Act
        $result = $this->service->sendSMS('243812345678', 'Test message');

        // Assert
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Invalid API key', $result['message']);
    }

    /**
     * Test message status checking
     *
     * @return void
     */
    public function test_check_message_status_delivered(): void
    {
        // Arrange
        Http::fake([
            'https://api.infobip.test/sms/1/reports' => Http::response([
                'results' => [
                    [
                        'messageId' => 'MSG123',
                        'status' => [
                            'groupId' => 3,
                            'groupName' => 'DELIVERED',
                            'id' => 5,
                            'name' => 'DELIVERED_TO_HANDSET'
                        ],
                        'sentAt' => '2024-01-01T10:00:00.000+0000',
                        'doneAt' => '2024-01-01T10:00:05.000+0000'
                    ]
                ]
            ], 200)
        ]);

        // Act
        $result = $this->service->getMessageStatus('MSG123');

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('DELIVERED_TO_HANDSET', $result['status']);
    }

    /**
     * Test request includes authorization header
     *
     * @return void
     */
    public function test_request_includes_authorization_header(): void
    {
        // Arrange
        Http::fake([
            'https://api.infobip.test/sms/2/text/advanced' => Http::response([
                'messages' => [['messageId' => 'MSG123']]
            ], 200)
        ]);

        // Act
        $this->service->sendSMS('243812345678', 'Test');

        // Assert
        Http::assertSent(function ($request) {
            return $request->hasHeader('Authorization', 'App TEST_API_KEY');
        });
    }

    /**
     * Test SMS with custom sender
     *
     * @return void
     */
    public function test_send_sms_with_custom_sender(): void
    {
        // Arrange
        Http::fake([
            'https://api.infobip.test/sms/2/text/advanced' => Http::response([
                'messages' => [['messageId' => 'MSG123']]
            ], 200)
        ]);

        // Act
        $this->service->sendSMS('243812345678', 'Test', 'CUSTOM');

        // Assert
        Http::assertSent(function ($request) {
            $body = json_decode($request->body(), true);
            return $body['messages'][0]['from'] === 'CUSTOM';
        });
    }

    /**
     * Test exception handling
     *
     * @return void
     */
    public function test_handles_exception(): void
    {
        // Arrange
        Http::fake([
            'https://api.infobip.test/sms/2/text/advanced' => function () {
                throw new \Exception('Connection timeout');
            }
        ]);

        // Act
        $result = $this->service->sendSMS('243812345678', 'Test');

        // Assert
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Connection timeout', $result['message']);
    }
}
