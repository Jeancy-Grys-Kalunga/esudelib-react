<?php

namespace App\Services;

use DragonCode\PrettyArray\Services\Formatters\Json;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;

class CinetPayService
{
    protected $client;

    public function __construct()
    {
        $this->client = new Client();
    }

    public function createPayment(?array $param)
    {
        $channels = "ALL";

        $response = $this->client->post(env('CINETPAY_URL'),
        [
            'json' => [
                "transaction_id" => $param['transaction_id'], 
                "amount" => $param['amount'], 
                "currency" => $param['currency'], 
                "customer_surname" => $param['customer_surname'], 
                "customer_name" =>  $param['customer_name'], 
                "description" => $param['description'], 
                "customer_email" => $param['customer_email'], 
                "customer_phone_number" => $param['customer_phone_number'], 
                "customer_address" => $param['customer_address'], 
                "customer_city" => $param['customer_city'], 
                "customer_country" => $param['customer_country'], 
                "customer_state" => $param['customer_state'], 
                "customer_zip_code" => $param['customer_zip_code'], 
                "channels" => $channels,
                'notify_url' => env('CINETPAY_NOTIFY_URL'),
                'return_url' => env('CINETPAY_RETURN_URL'),
                'cancel_url' => env('CINETPAY_CANCEL_URL'),
                'site_id' => env('CINETPAY_SITE_ID'),
                'apikey' => env('CINETPAY_API_KEY')
            ]
            ]);

            return json_decode($response->getBody(), true);
    }


    public function getPaymentDetails($paymentId)
    {
        $response = Http::post(env('CINETPAY_URL').'/details', [
            'apikey' => env('CINETPAY_API_KEY'), // Votre clé API
            'payment_id' => $paymentId,
        ]);

        return $response->json();
    }

}