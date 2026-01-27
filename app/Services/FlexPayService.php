<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FlexPayService
{
    protected $client;
    protected $merchant;
    protected $token;
    protected $paymentUrl;
    protected $cardPaymentUrl;
    protected $checkUrl;
    protected $payoutUrl;

    public function __construct()
    {
        $this->client = new Client();
        $this->merchant = env('FLEXPAY_MERCHANT');
        $this->token = env('FLEXPAY_TOKEN');
        $this->paymentUrl = env('FLEXPAY_API_URL');
        $this->cardPaymentUrl = env('FLEXPAY_CARD_URL');
        $this->checkUrl = env('FLEXPAY_CHECK_URL');
        $this->payoutUrl = env('FLEXPAY_PAYOUT_URL');
    }

    public function createMobilePayment(array $data)
    {
        try {
            $payload = [
                "merchant" => $this->merchant,
                "type" => "1",
                "phone" => $this->formatPhoneNumber($data['customer_phone_number']),
                "reference" => $data['transaction_id'],
                "amount" => $data['amount'],
                "currency" => $data['currency'],
                "callbackUrl" => $data['notify_url']
            ];

            Log::info('FlexPay Mobile Payment Request payload:', $payload);


            $response = $this->client->post($this->paymentUrl, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->token,
                    'Content-Type' => 'application/json'
                ],
                'json' => $payload,
                'verify' => false
            ]);


            return $this->handleResponse($response);
        } catch (\Exception $e) {
            Log::error('FlexPay Exception: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage());
        }
    }

    // Ajouter cette méthode pour les paiements carte
    public function createCardPayment(array $data)
    {
        try {
            $payload = [
                "merchant" => $this->merchant,
                "type" => "2",
                "reference" => $data['transaction_id'],
                "amount" => $data['amount'],
                "currency" => $data['currency'],
                "description" => "Paiement de la commande " . $data['transaction_id'],
                "callbackUrl" => $data['notify_url'],
                "approveUrl" => $data['approve_url'],
                "cancelUrl" => $data['cancel_url'],
                "declineUrl" => $data['decline_url']

            ];

            $response = $this->client->post($this->paymentUrl, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->token,
                    'Content-Type' => 'application/json'
                ],
                'json' => $payload,
                'verify' => false
            ]);

            return $this->handleCardResponse($response);
        } catch (\Exception $e) {
            Log::error('FlexPay Card Error: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage());
        }
    }

    // Modifier handleResponse pour gérer les deux types
    private function handleCardResponse($response)
    {
        $responseData = json_decode($response->getBody(), true);

        if ($responseData['code'] === '0') {
            return [
                'success' => true,
                'payment_url' => $this->cardPaymentUrl, // URL spécifique aux cartes
                'orderNumber' => $responseData['orderNumber'],
                'post_data' => [
                    'merchant' => $this->merchant,
                    'orderNumber' => $responseData['orderNumber'],
                    'amount' => $responseData['amount']
                ]
            ];
        }

        Log::error('FlexPay Card Error: ' . ($responseData['message'] ?? 'Unknown error'));
        return ['success' => false, 'message' => $responseData['message']];
    }



    private function errorResponse(string $message): array
    {
        return [
            'success' => false,
            'message' => $message
        ];
    }

    public function checkTransaction($flexpayReference)
    {
        try {
            Log::info('FlexPay Check Request', [
                'reference' => $flexpayReference,
                'url' => $this->checkUrl . $flexpayReference,
                'merchant' => $this->merchant
            ]);

            $maxAttempts = 3;
            $attempt = 0;
            $responseData = null;

            do {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                ])->get($this->checkUrl . $flexpayReference);

                $responseData = $response->json();
                Log::info('FlexPay Check Response', $responseData);

                if ($responseData['code'] === '0' && isset($responseData['transaction']['status'])) {
                    if ($responseData['transaction']['status'] === '0') {
                        return ['status' => 'success', 'data' => $responseData];
                    } elseif ($responseData['transaction']['status'] === '1') {
                        // Statut intermédiaire, on réessaye
                        sleep(2);
                        $attempt++;
                    }
                } else {
                    break;
                }
            } while ($attempt < $maxAttempts);

            return [
                'status' => 'failed',
                'message' => $responseData['message'] ?? 'Erreur inconnue'
            ];
        } catch (\Exception $e) {
            Log::error('FlexPay Check Error: ' . $e->getMessage());
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    public function merchantPayout(array $data)
    {
        try {
            $payload = [
                "merchant" => $this->merchant,
                "type" => "1",
                "reference" => $data['reference'],
                "phone" => $this->formatPhoneNumber($data['recipient_phone']),
                "amount" => $data['amount'],
                "currency" => $data['currency'],
                "callbackUrl" => $data['callback_url']
            ];

            $response = $this->client->post($this->payoutUrl, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->token,
                    'Content-Type' => 'application/json'
                ],
                'json' => $payload,
                'verify' => false
            ]);

            return $this->handlePayoutResponse($response);
        } catch (\Exception $e) {
            Log::error('FlexPay Payout Exception: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage());
        }
    }

    private function handleResponse($response)
    {
        $responseData = json_decode($response->getBody(), true);

        if ($responseData['code'] === '0') {
            return [
                'success' => true,
                'payment_url' => $this->paymentUrl,
                'orderNumber' => $responseData['orderNumber']
            ];
        }

        Log::error('FlexPay Error: ' . ($responseData['message'] ?? 'Unknown error'));
        return ['success' => false, 'message' => $responseData['message']];
    }

    private function handlePayoutResponse($response)
    {
        $responseData = json_decode($response->getBody(), true);

        if ($responseData['code'] === '0') {
            return [
                'success' => true,
                'orderNumber' => $responseData['orderNumber'],
                'provider_reference' => $responseData['provider_reference'] ?? null
            ];
        }

        Log::error('FlexPay Payout Error: ' . ($responseData['message'] ?? 'Unknown error'));
        return ['success' => false, 'message' => $responseData['message']];
    }


    private function formatPhoneNumber($phone)
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        // Si le numéro commence par 243 et a 12 chiffres, on le garde
        if (strlen($cleaned) === 12 && substr($cleaned, 0, 3) === '243') {
            return $cleaned;
        }

        // Si le numéro commence par 0 et a 10 chiffres (ex: 08..., 09...), on le met au format 243
        if (strlen($cleaned) === 10 && substr($cleaned, 0, 1) === '0') {
            return '243' . substr($cleaned, 1);
        }

        // Si le numéro a 9 chiffres (ex: 8..., 9...), on ajoute 243
        // Correction par rapport à l'ancienne condition qui limitait aux numéros commençant par 8
        if (strlen($cleaned) === 9) {
            return '243' . $cleaned;
        }

        return $cleaned;
    }
}
