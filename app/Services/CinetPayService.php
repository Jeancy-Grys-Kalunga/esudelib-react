<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * CinetPay Payment Gateway Integration
 *
 * Handles payment initialization, verification, and webhook signature validation.
 * Compatible with legacy method signatures while providing a clean, testable API.
 *
 * @package App\Services
 */
class CinetPayService
{
    /**
     * Default currency for transactions.
     *
     * @var string
     */
    private const DEFAULT_CURRENCY = 'XOF';

    /**
     * Default payment channels.
     *
     * @var string
     */
    private const DEFAULT_CHANNELS = 'ALL';

    /**
     * CinetPay API configuration.
     *
     * @var array<string, string|null>
     */
    private array $config;

    /**
     * CinetPayService constructor.
     * Injects configuration via Laravel's config system.
     */
    public function __construct()
    {
        $this->config = [
            'api_key'     => config('services.cinetpay.api_key'),
            'site_id'     => config('services.cinetpay.site_id'),
            'secret_key'  => config('services.cinetpay.secret_key'),
            'payment_url' => config('services.cinetpay.payment_url'),
            'check_url'   => config('services.cinetpay.check_url'),
            'notify_url'  => config('services.cinetpay.notify_url'),
            'return_url'  => config('services.cinetpay.return_url'),
            'cancel_url'  => config('services.cinetpay.cancel_url'),
        ];
    }

    /**
     * --------------------------------------------------------------------
     * Legacy Methods (Backward Compatibility)
     * --------------------------------------------------------------------
     */

    /**
     * Create a payment using the original CinetPay API format.
     *
     * @deprecated Use initializePayment() instead. Kept for backward compatibility.
     * @param  array|null $parameters Raw payment parameters.
     * @return array Raw API response from CinetPay.
     */
    public function createPayment(?array $parameters): array
    {
        $result = $this->initializePayment($parameters ?? []);

        if ($result['success']) {
            return [
                'code'    => '00',
                'message' => 'SUCCESS',
                'data'    => [
                    'payment_url'   => $result['payment_url'],
                    'payment_token' => $result['payment_token'],
                ],
            ];
        }

        return [
            'code'    => '01',
            'message' => $result['message'] ?? 'Payment initialization failed',
            'data'    => null,
        ];
    }

    /**
     * Retrieve payment details using CinetPay's payment ID.
     *
     * @deprecated Use verifyPayment() with transaction ID. Kept for backward compatibility.
     * @param  string $paymentId CinetPay payment identifier.
     * @return array Raw API response.
     */
    public function getPaymentDetails(string $paymentId): array
    {
        $response = Http::post($this->config['payment_url'] . '/details', [
            'apikey'     => $this->config['api_key'],
            'payment_id' => $paymentId,
        ]);

        return $response->json();
    }

    /**
     * --------------------------------------------------------------------
     * Modern, Testable Methods
     * --------------------------------------------------------------------
     */

    /**
     * Initialize a new payment with CinetPay.
     *
     * @param  array{
     *     transaction_id: string,
     *     amount: int|float,
     *     currency?: string,
     *     customer_name: string,
     *     description?: string,
     *     customer_email?: string,
     *     customer_phone_number?: string,
     *     customer_address?: string,
     *     customer_city?: string,
     *     customer_country?: string,
     *     customer_state?: string,
     *     customer_zip_code?: string,
     *     metadata?: mixed,
     *     notify_url?: string,
     *     return_url?: string,
     *     cancel_url?: string,
     * } $data Payment initialization data.
     * @return array{
     *     success: bool,
     *     payment_url?: string|null,
     *     payment_token?: string|null,
     *     message?: string
     * }
     */
    public function initializePayment(array $data): array
    {
        $payload = $this->buildPaymentPayload($data);

        $this->logPaymentInitialization($payload);

        try {
            $response = Http::post($this->config['payment_url'], $payload);

            return $this->handlePaymentResponse($response);
        } catch (Throwable $exception) {
            return $this->handlePaymentException($exception);
        }
    }

    /**
     * Verify the status of a payment using transaction ID.
     *
     * @param  string $transactionId Unique transaction identifier.
     * @return array{
     *     success: bool,
     *     status?: string,
     *     amount?: int|null,
     *     transaction_id?: string,
     *     payment_method?: string|null,
     *     message?: string
     * }
     */
    public function verifyPayment(string $transactionId): array
    {
        $payload = [
            'apikey'         => $this->config['api_key'],
            'site_id'        => $this->config['site_id'],
            'transaction_id' => $transactionId,
        ];

        try {
            $response = Http::post($this->config['check_url'], $payload);

            if ($response->failed()) {
                return $this->errorResponse($this->extractErrorMessage($response));
            }

            $body = $response->json();

            if (($body['code'] ?? '') === '00') {
                $data = $body['data'] ?? [];

                return [
                    'success'        => true,
                    'status'         => $data['status'] ?? 'UNKNOWN',
                    'amount'         => $data['amount'] ?? null,
                    'transaction_id' => $data['transaction_id'] ?? $transactionId,
                    'payment_method' => $data['payment_method'] ?? null,
                ];
            }

            return $this->errorResponse($body['message'] ?? 'Payment verification failed');
        } catch (Throwable $exception) {
            return $this->errorResponse($exception->getMessage());
        }
    }

    /**
     * Validate the signature of an incoming CinetPay webhook.
     *
     * @param  array<string, mixed> $payload Webhook payload.
     * @param  string               $signature Signature from the 'X-Signature' header.
     * @return bool True if signature is valid.
     */
    public function validateWebhookSignature(array $payload, string $signature): bool
    {
        $secret = $this->config['secret_key'];

        if (empty($secret)) {
            Log::warning('CinetPay webhook secret key is not configured.');
            return false;
        }

        $computedSignature = hash_hmac('sha256', (string) json_encode($payload), $secret);

        return hash_equals($computedSignature, $signature);
    }

    /**
     * --------------------------------------------------------------------
     * Internal Helpers
     * --------------------------------------------------------------------
     */

    /**
     * Build the complete payload for payment initialization.
     *
     * @param  array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function buildPaymentPayload(array $data): array
    {
        return [
            'transaction_id'         => $data['transaction_id'],
            'amount'                 => $data['amount'],
            'currency'               => $data['currency'] ?? self::DEFAULT_CURRENCY,
            'customer_surname'       => $data['customer_name'] ?? '',
            'customer_name'          => $data['customer_name'] ?? '',
            'description'           => $data['description'] ?? '',
            'customer_email'        => $data['customer_email'] ?? '',
            'customer_phone_number' => $data['customer_phone_number'] ?? '',
            'customer_address'      => $data['customer_address'] ?? '',
            'customer_city'         => $data['customer_city'] ?? '',
            'customer_country'      => $data['customer_country'] ?? '',
            'customer_state'        => $data['customer_state'] ?? '',
            'customer_zip_code'     => $data['customer_zip_code'] ?? '',
            'channels'             => self::DEFAULT_CHANNELS,
            'metadata'             => $data['metadata'] ?? '',
            'alternative_currency' => '',
            'notify_url'           => $data['notify_url'] ?? $this->config['notify_url'],
            'return_url'           => $data['return_url'] ?? $this->config['return_url'],
            'cancel_url'           => $data['cancel_url'] ?? $this->config['cancel_url'],
            'site_id'             => $this->config['site_id'],
            'apikey'              => $this->config['api_key'],
        ];
    }

    /**
     * Handle successful or failed HTTP response from payment initialization.
     *
     * @param  Response $response
     * @return array<string, mixed>
     */
    private function handlePaymentResponse(Response $response): array
    {
        if ($response->failed()) {
            $errorMessage = $this->extractErrorMessage($response);
            $this->logPaymentError($response, $errorMessage);
            return $this->errorResponse($errorMessage);
        }

        $body = $response->json();
        $this->logPaymentSuccess($body);

        if (($body['code'] ?? '') === '00') {
            return [
                'success'       => true,
                'payment_url'   => $body['data']['payment_url'] ?? null,
                'payment_token' => $body['data']['payment_token'] ?? null,
                'message'       => $body['message'] ?? 'SUCCESS',
            ];
        }

        return $this->errorResponse($body['message'] ?? 'Payment initialization failed');
    }

    /**
     * Handle exceptions during payment initialization.
     *
     * @param  Throwable $exception
     * @return array<string, bool|string>
     */
    private function handlePaymentException(Throwable $exception): array
    {
        Log::channel('cinetpay')->error('CinetPay payment exception', [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        return $this->errorResponse($exception->getMessage());
    }

    /**
     * Extract the error message from a failed HTTP response.
     *
     * @param  Response $response
     * @return string
     */
    private function extractErrorMessage(Response $response): string
    {
        $defaultMessage = 'Payment service unavailable';

        if (!$response->body()) {
            return $defaultMessage;
        }

        $body = $response->json();

        return $body['message'] ?? $defaultMessage;
    }

    /**
     * Log payment initialization payload.
     *
     * @param  array<string, mixed> $payload
     * @return void
     */
    private function logPaymentInitialization(array $payload): void
    {
        // Mask sensitive data before logging
        $loggablePayload = $payload;
        $loggablePayload['apikey'] = '***';

        Log::channel('cinetpay')->info('CinetPay payment initialization', [
            'payload' => $loggablePayload,
        ]);
    }

    /**
     * Log payment initialization error.
     *
     * @param  Response $response
     * @param  string   $errorMessage
     * @return void
     */
    private function logPaymentError(Response $response, string $errorMessage): void
    {
        Log::channel('cinetpay')->error('CinetPay payment error', [
            'status'  => $response->status(),
            'message' => $errorMessage,
            'body'    => $response->body(),
        ]);
    }

    /**
     * Log successful payment initialization.
     *
     * @param  array<string, mixed> $responseBody
     * @return void
     */
    private function logPaymentSuccess(array $responseBody): void
    {
        Log::channel('cinetpay')->info('CinetPay payment initialized successfully', [
            'response' => $responseBody,
        ]);
    }

    /**
     * Build a consistent error response.
     *
     * @param  string $message
     * @return array<string, bool|string>
     */
    private function errorResponse(string $message): array
    {
        return [
            'success' => false,
            'message' => $message,
        ];
    }
}
