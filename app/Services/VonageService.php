<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class VonageService
{
    /**
     * API endpoint for sending SMS.
     */
    private const SMS_ENDPOINT = 'https://rest.nexmo.com/sms/json';

    /**
     * Vonage API key.
     */
    private string $apiKey;

    /**
     * Vonage API secret.
     */
    private string $apiSecret;

    /**
     * Brand name / sender ID.
     */
    private string $brandName;

    /**
     * VonageService constructor.
     *
     * @throws \Exception
     */
    public function __construct()
    {
        $this->apiKey = config('services.vonage.api_key');
        $this->apiSecret = config('services.vonage.api_secret');
        $this->brandName = config('services.vonage.from', 'Esudelib');

        if (!$this->apiKey || !$this->apiSecret) {
            throw new \Exception('Les identifiants Vonage sont manquants dans la configuration.');
        }
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
        return $this->sendMessage($to, $content);
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
     * Get the status of a previously sent message (not directly supported by Vonage REST API,
     * usually handled via delivery receipts webhooks).
     * This method simulates a status lookup – in reality you would store the status from webhooks.
     *
     * @param  string $messageId
     * @return array{success: bool, status?: string, message?: string}
     */
    public function getMessageStatus(string $messageId): array
    {
        // Vonage n'offre pas d'API directe pour consulter le statut d'un message individuel.
        // En pratique, vous stockez les statuts reçus via webhook.
        // Pour les tests, on retourne un statut simulé.
        return [
            'success' => true,
            'status'  => 'delivered', // simulation
        ];
    }

    /**
     * Process a delivery receipt (webhook) from Vonage.
     *
     * @param  array $payload Webhook payload.
     * @return array{success: bool, status: string, message_id: string, message?: string}
     */
    public function processDeliveryReceipt(array $payload): array
    {
        $messageId = $payload['messageId'] ?? null;
        $status    = $payload['status'] ?? 'unknown';
        $errCode   = $payload['err-code'] ?? '0';

        if ($errCode === '0' && $status === 'delivered') {
            return [
                'success'    => true,
                'status'     => 'delivered',
                'message_id' => $messageId,
            ];
        }

        return [
            'success'    => false,
            'status'     => $status,
            'message_id' => $messageId,
            'message'    => $this->parseVonageError((int) $errCode),
        ];
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
    public function sendVonageSms(string $to, string $content): bool
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
     * Core method to send a message via Vonage API.
     *
     * @param  string $to
     * @param  string $text
     * @return array{success: bool, message_id?: string, status?: string, message?: string}
     */
    private function sendMessage(string $to, string $text): array
    {
        try {
            $response = Http::withBasicAuth($this->apiKey, $this->apiSecret)
                ->asForm()
                ->post(self::SMS_ENDPOINT, [
                    'from' => $this->brandName,
                    'to'   => $to,
                    'text' => $text,
                ]);

            if ($response->failed()) {
                $errorMsg = $this->parseHttpError($response->status(), $response->json());
                Log::error('Vonage HTTP error: ' . $errorMsg);
                return $this->errorResponse($errorMsg);
            }

            $data = $response->json();
            $messages = $data['messages'] ?? [];

            if (empty($messages)) {
                return $this->errorResponse('Aucune réponse de Vonage');
            }

            $firstMessage = $messages[0];
            $status = (int) ($firstMessage['status'] ?? -1);

            if ($status !== 0) {
                $errorMsg = $this->parseVonageError($status);
                Log::error('Vonage error: ' . $errorMsg);
                return $this->errorResponse($errorMsg);
            }

            return [
                'success'    => true,
                'message_id' => $firstMessage['message-id'] ?? null,
                'status'     => $firstMessage['status'] ?? 'sent',
            ];
        } catch (Throwable $e) {
            Log::error('Vonage exception: ' . $e->getMessage());
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
     * Parse Vonage error codes into human-readable messages.
     *
     * @param  int $statusCode
     * @return string
     */
    private function parseVonageError(int $statusCode): string
    {
        $errors = [
            0  => 'Succès',
            1  => 'Throttled - Trop de requêtes',
            2  => 'Paramètres manquants',
            3  => 'Paramètres invalides',
            4  => 'Credentiels invalides',
            5  => 'Erreur interne Vonage',
            6  => 'Numéro invalide',
            7  => 'Partenaire non autorisé',
            8  => 'Adresse IP non autorisée',
            9  => 'Quota SMS dépassé',
            10 => 'Message trop long',
            14 => 'Expéditeur non valide',
            15 => 'Message non autorisé',
        ];

        return $errors[$statusCode] ?? "Erreur inconnue (Code: $statusCode)";
    }

    /**
     * Parse HTTP error from Vonage response.
     *
     * @param  int        $status
     * @param  array|null $json
     * @return string
     */
    private function parseHttpError(int $status, ?array $json): string
    {
        if ($json && isset($json['error-code-label'])) {
            return $json['error-code-label'];
        }

        $messages = [
            400 => 'Requête incorrecte',
            401 => 'Authentification échouée',
            403 => 'Action non autorisée',
            404 => 'Ressource introuvable',
            429 => 'Trop de requêtes',
            500 => 'Erreur serveur Vonage',
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
