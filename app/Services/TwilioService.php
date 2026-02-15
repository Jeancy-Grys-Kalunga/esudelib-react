<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class TwilioService
{
    /**
     * Base URL for Twilio API.
     */
    private const API_BASE_URL = 'https://api.twilio.com/2010-04-01/Accounts/%s';

    /**
     * Twilio Account SID.
     */
    private string $accountSid;

    /**
     * Twilio Auth Token.
     */
    private string $authToken;

    /**
     * From number (E.164 format).
     */
    private string $fromNumber;

    /**
     * WhatsApp from number (with 'whatsapp:' prefix).
     */
    private string $whatsappFrom;

    /**
     * TwilioService constructor.
     *
     * @throws \Exception
     */
    public function __construct()
    {
        $this->accountSid = config('services.twilio.account_sid') ?? '';
        $this->authToken  = config('services.twilio.auth_token') ?? '';
        $this->fromNumber = config('services.twilio.from_number') ?? '';
        $this->whatsappFrom = config('services.twilio.whatsapp_from') ?? ('whatsapp:' . $this->fromNumber);
    }

    /**
     * --------------------------------------------------------------------
     * Public API
     * --------------------------------------------------------------------
     */

    /**
     * Send a single SMS.
     *
     * @param  string $to      Recipient phone number (will be formatted).
     * @param  string $content Message body.
     * @return array{success: bool, message_id?: string, status?: string, message?: string}
     */
    public function sendSMS(string $to, string $content): array
    {
        $to = $this->formatPhoneNumber($to);
        return $this->sendMessage($to, $content, $this->fromNumber);
    }

    /**
     * Send a WhatsApp message.
     *
     * @param  string $to      Recipient phone number (will be formatted).
     * @param  string $content Message body.
     * @return array{success: bool, message_id?: string, status?: string, message?: string}
     */
    public function sendWhatsApp(string $to, string $content): array
    {
        $to = 'whatsapp:' . $this->formatPhoneNumber($to);
        return $this->sendMessage($to, $content, $this->whatsappFrom);
    }

    /**
     * Send the same SMS to multiple recipients.
     *
     * @param  array  $recipients List of phone numbers.
     * @param  string $content    Message body.
     * @return array{success: bool, messages?: array, message?: string}
     */
    public function sendBulkSMS(array $recipients, string $content): array
    {
        $messages = [];

        foreach ($recipients as $to) {
            $result = $this->sendSMS($to, $content);
            if ($result['success']) {
                $messages[] = [
                    'message_id' => $result['message_id'],
                    'status'     => $result['status'],
                ];
            } else {
                Log::warning('Bulk SMS failed for ' . $to . ': ' . ($result['message'] ?? 'Unknown error'));
            }
        }

        return [
            'success'  => !empty($messages),
            'messages' => $messages,
        ];
    }

    /**
     * Get the status of a previously sent message.
     *
     * @param  string $messageId The message SID.
     * @return array{success: bool, status?: string, message?: string}
     */
    public function getMessageStatus(string $messageId): array
    {
        $url = sprintf(self::API_BASE_URL, $this->accountSid) . '/Messages/' . $messageId . '.json';

        try {
            $response = Http::withBasicAuth($this->accountSid, $this->authToken)
                ->get($url);

            if ($response->failed()) {
                return $this->errorResponse($this->parseHttpError($response->status()));
            }

            $data = $response->json();

            return [
                'success' => true,
                'status'  => $data['status'] ?? 'unknown',
            ];
        } catch (Throwable $e) {
            Log::error('Twilio status fetch exception: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Legacy method – kept for backward compatibility.
     * Sends an SMS using the original method name.
     *
     * @param  string $to
     * @param  string $content
     * @return bool
     * @throws \Exception
     */
    public function sendTwilioSms(string $to, string $content): bool
    {
        $result = $this->sendSMS($to, $content);
        return $result['success'];
    }

    /**
     * --------------------------------------------------------------------
     * Internal helpers
     * --------------------------------------------------------------------
     */

    /**
     * Core method to send a message via Twilio API.
     *
     * @param  string $to
     * @param  string $body
     * @param  string $from
     * @return array{success: bool, message_id?: string, status?: string, message?: string}
     */
    private function sendMessage(string $to, string $body, string $from): array
    {
        $url = sprintf(self::API_BASE_URL, $this->accountSid) . '/Messages.json';

        try {
            $response = Http::withBasicAuth($this->accountSid, $this->authToken)
                ->asForm()
                ->post($url, [
                    'To'   => $to,
                    'From' => $from,
                    'Body' => $body,
                ]);

            if ($response->failed()) {
                $errorMsg = $this->parseTwilioError($response->json());
                Log::error('Twilio error: ' . $errorMsg);
                return $this->errorResponse($errorMsg);
            }

            $data = $response->json();

            return [
                'success'    => true,
                'message_id' => $data['sid'] ?? null,
                'status'     => $data['status'] ?? 'sent',
            ];
        } catch (Throwable $e) {
            Log::error('Twilio exception: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Format a phone number to E.164 international format.
     * Handles:
     *   - 0812345678  → +243812345678
     *   - 812345678   → +243812345678
     *   - 243812345678→ +243812345678
     *
     * @param  string $phone
     * @return string
     */
    private function formatPhoneNumber(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        // Already with country code (12 digits starting with 243)
        if (strlen($cleaned) === 12 && str_starts_with($cleaned, '243')) {
            return '+' . $cleaned;
        }

        // 10 digits starting with 0 → replace 0 with 243
        if (strlen($cleaned) === 10 && str_starts_with($cleaned, '0')) {
            return '+243' . substr($cleaned, 1);
        }

        // 9 digits → prepend 243
        if (strlen($cleaned) === 9) {
            return '+243' . $cleaned;
        }

        // Fallback: assume already valid
        return '+' . $cleaned;
    }

    /**
     * Parse Twilio error response from JSON.
     *
     * @param  array|null $response
     * @return string
     */
    private function parseTwilioError(?array $response): string
    {
        if (!$response) {
            return 'Erreur inconnue';
        }

        $code = $response['code'] ?? null;
        $message = $response['message'] ?? 'No message';

        $errors = [
            14101 => 'Destinataire invalide',
            21211 => 'Numéro de téléphone invalide',
            21610 => 'Le numéro n\'est pas mobile',
            21614 => 'Numéro non valide pour cette région',
            21408 => 'Non autorisé à envoyer à ce destinataire',
            21612 => 'Impossible d\'envoyer au numéro',
            21617 => 'Numéro blacklisté',
        ];

        if ($code && isset($errors[$code])) {
            return $errors[$code];
        }

        return "Erreur Twilio [$code]: $message";
    }

    /**
     * Parse HTTP error status code.
     *
     * @param  int $status
     * @return string
     */
    private function parseHttpError(int $status): string
    {
        $messages = [
            400 => 'Requête incorrecte',
            401 => 'Authentification échouée',
            403 => 'Action non autorisée',
            404 => 'Ressource introuvable',
            500 => 'Erreur serveur Twilio',
        ];

        return $messages[$status] ?? "Erreur HTTP $status";
    }

    /**
     * Build a consistent error response.
     *
     * @param  string $message
     * @return array{success: false, message: string}
     */
    private function errorResponse(string $message): array
    {
        return [
            'success' => false,
            'message' => $message,
        ];
    }
}
