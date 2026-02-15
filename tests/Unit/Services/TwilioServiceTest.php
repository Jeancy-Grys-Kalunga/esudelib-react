<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\TwilioService;
use Illuminate\Support\Facades\Http;

class TwilioServiceTest extends TestCase
{
    private TwilioService $service;

    protected function setUp(): void
    {

        parent::setUp();

        // Configuration des identifiants de test
        config([
            'services.twilio.account_sid'    => 'TEST_SID',
            'services.twilio.auth_token'     => 'TEST_TOKEN',
            'services.twilio.from_number'    => '+1234567890',
            'services.twilio.whatsapp_from'  => 'whatsapp:+1234567890',
        ]);

        $this->service = new TwilioService();
    }

    public function test_send_sms_success(): void
    {
        // Arrange
        Http::fake([
            'https://api.twilio.com/2010-04-01/Accounts/TEST_SID/Messages.json' => Http::response([
                'sid'    => 'SM123456789',
                'status' => 'sent',
            ], 201),
        ]);

        // Act
        $result = $this->service->sendSMS('+243812345678', 'Test message');

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('SM123456789', $result['message_id']);
        $this->assertEquals('sent', $result['status']);
    }

    public function test_send_whatsapp_message_success(): void
    {
        // Arrange
        Http::fake([
            'https://api.twilio.com/2010-04-01/Accounts/TEST_SID/Messages.json' => Http::response([
                'sid'    => 'SM987654321',
                'status' => 'sent',
            ], 201),
        ]);

        // Act
        $result = $this->service->sendWhatsApp('+243812345678', 'WhatsApp test');

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('SM987654321', $result['message_id']);

        // Vérifier que la requête a été faite avec les bons paramètres
        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.twilio.com/2010-04-01/Accounts/TEST_SID/Messages.json'
                && $request->method() === 'POST'
                && $request['To'] === 'whatsapp:+243812345678'
                && $request['From'] === 'whatsapp:+1234567890'
                && $request['Body'] === 'WhatsApp test';
        });
    }

    public function test_send_sms_failure(): void
    {
        // Arrange
        Http::fake([
            'https://api.twilio.com/2010-04-01/Accounts/TEST_SID/Messages.json' => Http::response([
                'code'    => 21211,
                'message' => 'Invalid phone number',
            ], 400),
        ]);

        // Act
        $result = $this->service->sendSMS('+invalid', 'Test');

        // Assert
        $this->assertFalse($result['success']);
        $this->assertEquals('Numéro de téléphone invalide', $result['message']);
    }

    public function test_formats_phone_number_correctly(): void
    {
        // Arrange
        Http::fake([
            'https://api.twilio.com/2010-04-01/Accounts/TEST_SID/Messages.json' => Http::response([
                'sid'    => 'SM123',
                'status' => 'sent',
            ], 201),
        ]);

        // Act
        $result = $this->service->sendSMS('0812345678', 'Test');

        // Assert
        $this->assertTrue($result['success']);

        Http::assertSent(function ($request) {
            return $request['To'] === '+243812345678';
        });
    }

    public function test_get_message_status(): void
    {
        // Arrange
        Http::fake([
            'https://api.twilio.com/2010-04-01/Accounts/TEST_SID/Messages/SM123.json' => Http::response([
                'sid'    => 'SM123',
                'status' => 'delivered',
            ], 200),
        ]);

        // Act
        $result = $this->service->getMessageStatus('SM123');

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('delivered', $result['status']);
    }

    public function test_send_bulk_sms(): void
    {
        // Arrange
        Http::fake([
            'https://api.twilio.com/2010-04-01/Accounts/TEST_SID/Messages.json' => Http::response([
                'sid'    => 'SM123',
                'status' => 'sent',
            ], 201),
        ]);

        $recipients = ['+243812345678', '+243898765432', '+243811111111'];

        // Act
        $result = $this->service->sendBulkSMS($recipients, 'Bulk message');

        // Assert
        $this->assertTrue($result['success']);
        $this->assertCount(3, $result['messages']);
        foreach ($result['messages'] as $msg) {
            $this->assertEquals('SM123', $msg['message_id']);
            $this->assertEquals('sent', $msg['status']);
        }

        // Vérifier que 3 requêtes ont été envoyées
        Http::assertSentCount(3);
    }

    public function test_handles_network_exception(): void
    {
        // Arrange
        Http::fake([
            'https://api.twilio.com/2010-04-01/Accounts/TEST_SID/Messages.json' => function () {
                throw new \Exception('Connection timeout');
            },
        ]);

        // Act
        $result = $this->service->sendSMS('+243812345678', 'Test');

        // Assert
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Connection timeout', $result['message']);
    }

    public function test_request_includes_basic_auth(): void
    {
        // Arrange
        Http::fake([
            'https://api.twilio.com/2010-04-01/Accounts/TEST_SID/Messages.json' => Http::response([
                'sid'    => 'SM123',
                'status' => 'sent',
            ], 201),
        ]);

        // Act
        $this->service->sendSMS('+243812345678', 'Test');

        // Assert
        Http::assertSent(function ($request) {
            return $request->hasHeader('Authorization', 'Basic ' . base64_encode('TEST_SID:TEST_TOKEN'));
        });
    }
}
