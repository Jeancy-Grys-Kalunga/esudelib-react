<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * FlexPay Payment Gateway Integration
 *
 * Handles mobile money payments, card payments, transaction verification,
 * and merchant payouts.
 *
 * @package App\Services
 */
class FlexPayService
{
    /**
     * Payment type constants.
     */
    private const PAYMENT_TYPE_MOBILE = '1';
    private const PAYMENT_TYPE_CARD   = '2';
    private const PAYOUT_TYPE         = '1';

    /**
     * API configuration.
     *
     * @var array<string, string|null>
     */
    private array $config;

    /**
     * FlexPayService constructor.
     * Injects configuration via Laravel's config system.
     */
    public function __construct()
    {
        $this->config = [
            'merchant'    => config('services.flexpay.merchant'),
            'token'       => config('services.flexpay.token'),
            'api_url'     => config('services.flexpay.api_url'),
            'card_url'    => config('services.flexpay.card_url'),
            'check_url'   => config('services.flexpay.check_url'),
            'payout_url'  => config('services.flexpay.payout_url'),
        ];
    }

    /**
     * --------------------------------------------------------------------
     * Public API
     * --------------------------------------------------------------------
     */

    /**
     * Create a mobile money payment.
     *
     * @param  array{
     *     customer_phone_number: string,
     *     transaction_id: string,
     *     amount: int|float,
     *     currency: string,
     *     notify_url: string
     * } $data Payment details.
     * @return array{
     *     success: bool,
     *     payment_url?: string|null,
     *     orderNumber?: string|null,
     *     message?: string
     * }
     */
    public function createMobilePayment(array $data): array
    {
        $payload = [
            'merchant'    => $this->config['merchant'],
            'type'        => self::PAYMENT_TYPE_MOBILE,
            'phone'       => $this->formatPhoneNumber($data['customer_phone_number']),
            'reference'   => $data['transaction_id'],
            'amount'      => $data['amount'],
            'currency'    => $data['currency'],
            'callbackUrl' => $data['notify_url'],
        ];

        $this->logRequest('FlexPay Mobile Payment', $payload);

        try {
            $response = $this->sendPostRequest($this->config['api_url'], $payload);
            return $this->handleMobilePaymentResponse($response);
        } catch (Throwable $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Create a card payment.
     *
     * @param  array{
     *     transaction_id: string,
     *     amount: int|float,
     *     currency: string,
     *     notify_url: string,
     *     approve_url: string,
     *     cancel_url: string,
     *     decline_url: string
     * } $data Payment details.
     * @return array{
     *     success: bool,
     *     payment_url?: string|null,
     *     orderNumber?: string|null,
     *     post_data?: array{
     *         merchant: string|null,
     *         orderNumber: string,
     *         amount: int|float
     *     },
     *     message?: string
     * }
     */
    public function createCardPayment(array $data): array
    {
        $payload = [
            'merchant'    => $this->config['merchant'],
            'type'        => self::PAYMENT_TYPE_CARD,
            'reference'   => $data['transaction_id'],
            'amount'      => $data['amount'],
            'currency'    => $data['currency'],
            'description' => 'Paiement de la commande ' . $data['transaction_id'],
            'callbackUrl' => $data['notify_url'],
            'approveUrl'  => $data['approve_url'],
            'cancelUrl'   => $data['cancel_url'],
            'declineUrl'  => $data['decline_url'],
        ];

        $this->logRequest('FlexPay Card Payment', $payload);

        try {
            $response = $this->sendPostRequest($this->config['api_url'], $payload);
            return $this->handleCardPaymentResponse($response);
        } catch (Throwable $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Check the status of a transaction.
     *
     * @param  string $flexpayReference FlexPay order number.
     * @return array{
     *     status: string,
     *     data?: array,
     *     message?: string
     * }
     */
    public function checkTransaction(string $flexpayReference): array
    {
        $url = rtrim($this->config['check_url'] ?? '', '/') . '/' . $flexpayReference;

        $this->logRequest('FlexPay Check', [
            'reference' => $flexpayReference,
            'url'       => $url,
        ]);

        $maxAttempts = 3;
        $attempt     = 0;
        $responseData = null;

        do {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->config['token'],
                ])->get($url);

                $responseData = $response->json();
                $this->logResponse('FlexPay Check', $responseData);

                if (($responseData['code'] ?? '') === '0' && isset($responseData['transaction']['status'])) {
                    if ($responseData['transaction']['status'] === '0') {
                        return [
                            'status' => 'success',
                            'data'   => $responseData,
                        ];
                    }

                    if ($responseData['transaction']['status'] === '1') {
                        // Pending – wait and retry
                        sleep(2);
                        $attempt++;
                        continue;
                    }
                }

                // Any other code / missing status => break with failure
                break;
            } catch (Throwable $e) {
                Log::error('FlexPay Check Exception: ' . $e->getMessage());
                return [
                    'status'  => 'error',
                    'message' => $e->getMessage(),
                ];
            }
        } while ($attempt < $maxAttempts);

        return [
            'status'  => 'failed',
            'message' => $responseData['message'] ?? 'Transaction verification failed',
        ];
    }

    /**
     * Initiate a merchant payout.
     *
     * @param  array{
     *     reference: string,
     *     recipient_phone: string,
     *     amount: int|float,
     *     currency: string,
     *     callback_url: string
     * } $data Payout details.
     * @return array{
     *     success: bool,
     *     orderNumber?: string|null,
     *     provider_reference?: string|null,
     *     message?: string
     * }
     */
    public function merchantPayout(array $data): array
    {
        $payload = [
            'merchant'    => $this->config['merchant'],
            'type'        => self::PAYOUT_TYPE,
            'reference'   => $data['reference'],
            'phone'       => $this->formatPhoneNumber($data['recipient_phone']),
            'amount'      => $data['amount'],
            'currency'    => $data['currency'],
            'callbackUrl' => $data['callback_url'],
        ];

        $this->logRequest('FlexPay Payout', $payload);

        try {
            $response = $this->sendPostRequest($this->config['payout_url'], $payload);
            return $this->handlePayoutResponse($response);
        } catch (Throwable $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * --------------------------------------------------------------------
     * Private Helpers
     * --------------------------------------------------------------------
     */

    /**
     * Send a POST request with standard headers.
     *
     * @param  string $url
     * @param  array  $payload
     * @return Response
     * @throws Throwable
     */
    private function sendPostRequest(string $url, array $payload): Response
    {
        return Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->config['token'],
            'Content-Type'  => 'application/json',
        ])->post($url, $payload);
    }

    /**
     * Handle the response from a mobile payment request.
     *
     * @param  Response $response
     * @return array
     */
    private function handleMobilePaymentResponse(Response $response): array
    {
        if ($response->failed()) {
            return $this->errorResponse($this->extractErrorMessage($response));
        }

        $body = $response->json();
        $this->logResponse('FlexPay Mobile Payment', $body);

        if (($body['code'] ?? '') === '0') {
            return [
                'success'     => true,
                'payment_url' => $this->config['api_url'],
                'orderNumber' => $body['orderNumber'] ?? null,
            ];
        }

        return $this->errorResponse($body['message'] ?? 'Mobile payment failed');
    }

    /**
     * Handle the response from a card payment request.
     *
     * @param  Response $response
     * @return array
     */
    private function handleCardPaymentResponse(Response $response): array
    {
        if ($response->failed()) {
            return $this->errorResponse($this->extractErrorMessage($response));
        }

        $body = $response->json();
        $this->logResponse('FlexPay Card Payment', $body);

        if (($body['code'] ?? '') === '0') {
            return [
                'success'     => true,
                'payment_url' => $this->config['card_url'],
                'orderNumber' => $body['orderNumber'] ?? null,
                'post_data'   => [
                    'merchant'    => $this->config['merchant'],
                    'orderNumber' => $body['orderNumber'] ?? '',
                    'amount'      => $body['amount'] ?? null,
                ],
            ];
        }

        return $this->errorResponse($body['message'] ?? 'Card payment failed');
    }

    /**
     * Handle the response from a payout request.
     *
     * @param  Response $response
     * @return array
     */
    private function handlePayoutResponse(Response $response): array
    {
        if ($response->failed()) {
            return $this->errorResponse($this->extractErrorMessage($response));
        }

        $body = $response->json();
        $this->logResponse('FlexPay Payout', $body);

        if (($body['code'] ?? '') === '0') {
            return [
                'success'            => true,
                'orderNumber'        => $body['orderNumber'] ?? null,
                'provider_reference' => $body['provider_reference'] ?? null,
            ];
        }

        return $this->errorResponse($body['message'] ?? 'Payout failed');
    }

    /**
     * Format a phone number to the international format expected by FlexPay.
     *
     * @param  string $phone
     * @return string
     */
    private function formatPhoneNumber(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        // Already formatted (12 digits starting with 243)
        if (strlen($cleaned) === 12 && str_starts_with($cleaned, '243')) {
            return $cleaned;
        }

        // 10 digits starting with 0 → replace 0 with 243
        if (strlen($cleaned) === 10 && str_starts_with($cleaned, '0')) {
            return '243' . substr($cleaned, 1);
        }

        // 9 digits → prepend 243
        if (strlen($cleaned) === 9) {
            return '243' . $cleaned;
        }

        return $cleaned;
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
            return 'Payment service unavailable';
        }

        $body = $response->json();
        return $body['message'] ?? 'Payment service unavailable';
    }

    /**
     * Build a consistent error response.
     *
     * @param  string $message
     * @return array<string, bool|string>
     */
    private function errorResponse(string $message): array
    {
        Log::error('FlexPay Error: ' . $message);

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
        // Mask sensitive fields
        if (isset($loggable['merchant'])) {
            $loggable['merchant'] = '***';
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
}
