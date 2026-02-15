<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * InfoBip SMS Gateway Integration
 *
 * Handles sending single/bulk SMS messages and retrieving message status.
 * Uses Laravel's HTTP client for testability and clean code.
 *
 * @package App\Services
 */
class InfoBipService
{
    /**
     * API endpoint paths.
     */
    private const SMS_SEND_ENDPOINT   = '/sms/2/text/advanced';
    private const SMS_REPORTS_ENDPOINT = '/sms/1/reports';

    /**
     * API configuration.
     *
     * @var array<string, string|null>
     */
    private array $config;

    /**
     * InfoBipService constructor.
     * Injects configuration via Laravel's config system.
     *
     * @throws \Exception
     */
    public function __construct()
    {
        $this->config = [
            'api_key' => config('services.infobip.api_key'),
            'base_url' => config('services.infobip.base_url'),
            'sender' => config('services.infobip.sender', 'Esudelib'),
        ];

        if (empty($this->config['api_key'])) {
            throw new \Exception('InfoBip API key is not set in the configuration.');
        }

        if (empty($this->config['base_url'])) {
            throw new \Exception('InfoBip base URL is not set in the configuration.');
        }
    }

    /**
     * --------------------------------------------------------------------
     * Public API
     * --------------------------------------------------------------------
     */

    /**
     * Send a single SMS message.
     *
     * @param  string      $to      Recipient phone number.
     * @param  string      $content Message content.
     * @param  string|null $from    Optional sender ID (defaults to configured sender).
     * @return array{
     *     success: bool,
     *     message_id?: string,
     *     status?: string,
     *     message?: string
     * }
     */
    public function sendSMS(string $to, string $content, ?string $from = null): array
    {
        $destinations = [['to' => $to]];

        $response = $this->sendMessageRequest($destinations, $content, $from);

        if (!$response['success']) {
            return $response;
        }

        $firstMessage = $response['messages'][0] ?? null;

        return [
            'success'    => true,
            'message_id' => $firstMessage['messageId'] ?? null,
            'status'     => $firstMessage['status']['name'] ?? null,
        ];
    }

    /**
     * Send the same SMS message to multiple recipients (bulk).
     *
     * @param  array       $recipients List of phone numbers.
     * @param  string      $content    Message content.
     * @param  string|null $from       Optional sender ID.
     * @return array{
     *     success: bool,
     *     messages?: array,
     *     message?: string
     * }
     */
    public function sendBulkSMS(array $recipients, string $content, ?string $from = null): array
    {
        $destinations = array_map(fn($to) => ['to' => $to], $recipients);

        return $this->sendMessageRequest($destinations, $content, $from);
    }

    /**
     * Get the delivery status of a previously sent message.
     *
     * @param  string $messageId The message ID returned by InfoBip.
     * @return array{
     *     success: bool,
     *     status?: string,
     *     message?: string
     * }
     */
    public function getMessageStatus(string $messageId): array
    {
        $url = $this->buildUrl(self::SMS_REPORTS_ENDPOINT); // No query params – matches test fake

        try {
            $response = Http::withHeaders($this->getHeaders())
                ->get($url);

            if ($response->failed()) {
                return $this->errorResponse($this->extractErrorMessage($response));
            }

            $body = $response->json();
            $this->logResponse('InfoBip Message Status', $body);

            $results = $body['results'] ?? [];
            $result = null;
            foreach ($results as $r) {
                if (($r['messageId'] ?? '') === $messageId) {
                    $result = $r;
                    break;
                }
            }

            if (!$result) {
                return $this->errorResponse('Message not found');
            }

            return [
                'success' => true,
                'status'  => $result['status']['name'] ?? null,
            ];
        } catch (Throwable $e) {
            Log::error('InfoBip Status Exception: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * --------------------------------------------------------------------
     * Internal Helpers
     * --------------------------------------------------------------------
     */

    /**
     * Send the actual SMS request to InfoBip.
     *
     * @param  array       $destinations List of destinations [['to' => '...'], ...].
     * @param  string      $content      Message text.
     * @param  string|null $from         Sender ID.
     * @return array
     */
    private function sendMessageRequest(array $destinations, string $content, ?string $from = null): array
    {
        $payload = $this->buildPayload($destinations, $content, $from);
        $this->logRequest('InfoBip SMS Send', $payload);

        try {
            $response = Http::withHeaders($this->getHeaders())
                ->post($this->buildUrl(self::SMS_SEND_ENDPOINT), $payload);

            if ($response->failed()) {
                $errorMessage = $this->extractErrorMessage($response);
                $this->logError('InfoBip SMS Error', $response, $errorMessage);
                return $this->errorResponse($errorMessage);
            }

            $body = $response->json();
            $this->logResponse('InfoBip SMS Response', $body);

            $messages = $body['messages'] ?? [];
            $allAccepted = true;

            foreach ($messages as $msg) {
                // If status is present and groupId is NOT 1, it's an error
                if (isset($msg['status']['groupId']) && $msg['status']['groupId'] !== 1) {
                    $allAccepted = false;
                    break;
                }
            }

            if (!$allAccepted) {
                return $this->errorResponse('One or more messages were not accepted');
            }

            return [
                'success'  => true,
                'messages' => $messages,
            ];
        } catch (Throwable $e) {
            Log::error('InfoBip SMS Exception: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Build the HTTP headers required by InfoBip.
     *
     * @return array<string, string>
     */
    private function getHeaders(): array
    {
        return [
            'Authorization' => 'App ' . $this->config['api_key'],
            'Content-Type'  => 'application/json',
        ];
    }

    /**
     * Build the full URL with optional query parameters.
     *
     * @param  string $path
     * @param  array  $query
     * @return string
     */
    private function buildUrl(string $path, array $query = []): string
    {
        $url = rtrim($this->config['base_url'], '/') . $path;

        if (!empty($query)) {
            $url .= '?' . http_build_query($query);
        }

        return $url;
    }

    /**
     * Build the JSON payload for the SMS request.
     *
     * @param  array       $destinations
     * @param  string      $content
     * @param  string|null $from
     * @return array
     */
    private function buildPayload(array $destinations, string $content, ?string $from = null): array
    {
        $sender = $from ?: $this->config['sender'];

        return [
            'messages' => [
                [
                    'from'         => $sender,
                    'text'         => $content,
                    'destinations' => $destinations,
                ],
            ],
        ];
    }

    /**
     * Extract error message from a failed HTTP response.
     *
     * @param  Response $response
     * @return string
     */
    private function extractErrorMessage(Response $response): string
    {
        if (!$response->body()) {
            return 'SMS service unavailable';
        }

        $body = $response->json();

        // InfoBip error structure
        if (isset($body['requestError']['serviceException']['text'])) {
            return $body['requestError']['serviceException']['text'];
        }

        return $body['message'] ?? 'SMS service error';
    }

    /**
     * Build a consistent error response.
     *
     * @param  string $message
     * @return array<string, bool|string>
     */
    private function errorResponse(string $message): array
    {
        Log::error('InfoBip Error: ' . $message);

        return [
            'success' => false,
            'message' => $message,
        ];
    }

    /**
     * Log an outgoing request with sensitive data masked.
     *
     * @param  string $type
     * @param  array  $payload
     * @return void
     */
    private function logRequest(string $type, array $payload): void
    {
        $loggable = $payload;

        // Mask phone numbers in destinations
        if (isset($loggable['messages'][0]['destinations'])) {
            foreach ($loggable['messages'][0]['destinations'] as &$dest) {
                if (isset($dest['to'])) {
                    $dest['to'] = substr($dest['to'], 0, 6) . '***';
                }
            }
        }

        Log::info("{$type} Request", ['payload' => $loggable]);
    }

    /**
     * Log an API response.
     *
     * @param  string $type
     * @param  array  $response
     * @return void
     */
    private function logResponse(string $type, array $response): void
    {
        Log::info("{$type} Response", ['response' => $response]);
    }

    /**
     * Log an API error.
     *
     * @param  string   $type
     * @param  Response $response
     * @param  string   $errorMessage
     * @return void
     */
    private function logError(string $type, Response $response, string $errorMessage): void
    {
        Log::error($type, [
            'status'  => $response->status(),
            'message' => $errorMessage,
            'body'    => $response->body(),
        ]);
    }
}
