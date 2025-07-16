<?php

namespace App\Services;

use Twilio\Exceptions\TwilioException;
use Twilio\Rest\Client;

class TwilioService
{
    protected $accountSid;
    protected $authToken;
    protected $fromNumber;
    private $twilioClient;

    public function __construct()
    {
        $this->accountSid = env('TWILIO_ACCOUNT_SID');
        $this->authToken = env('TWILIO_AUTH_TOKEN');
        $this->fromNumber = env('TWILIO_FROM_NUMBER');

        if (!$this->accountSid || !$this->authToken || !$this->fromNumber) {
            throw new \Exception('Les identifiants Twilio sont manquants dans les variables d\'environnement.');
        }
    }

    public function sendTwilioSms($to, $content)
    {
        $this->initializeClient();
        
        try {
            $message = $this->twilioClient->messages->create(
                $to,
                [
                    'from' => $this->fromNumber,
                    'body' => $content
                ]
            );

            if ($message->errorCode || $message->errorMessage) {
                throw new \Exception($this->parseTwilioError($message->errorCode, $message->errorMessage));
            }
            
            return true;
            
        } catch (TwilioException $e) {
            throw new \Exception($this->parseTwilioException($e));
        }
    }

    private function initializeClient()
    {
        if (!$this->twilioClient) {
            $this->twilioClient = new Client($this->accountSid, $this->authToken);
        }
    }

    private function parseTwilioError(?int $errorCode, ?string $errorMessage): string
    {
        if ($errorCode === null) {
            return 'Erreur inconnue';
        }

        $errors = [
            14101 => 'Destinataire invalide',
            21211 => 'Numéro de téléphone invalide',
            21610 => 'Le numéro n\'est pas mobile',
            21614 => 'Numéro non valide pour cette région',
            21408 => 'Non autorisé à envoyer à ce destinataire',
            21612 => 'Impossible d\'envoyer au numéro',
            21617 => 'Numéro blacklisté'
        ];

        return $errors[$errorCode] ?? "Erreur Twilio [$errorCode]: $errorMessage";
    }

    private function parseTwilioException(TwilioException $e): string
    {
        $message = $e->getMessage();
        
        // Extraction des détails d'erreur spécifiques
        if (preg_match('/\[HTTP (\d+)\] (.+)/', $message, $matches)) {
            $statusCode = $matches[1];
            $errorDetails = $matches[2];
            
            $statusMessages = [
                400 => 'Requête incorrecte',
                401 => 'Authentification échouée',
                403 => 'Action non autorisée',
                404 => 'Ressource introuvable',
                500 => 'Erreur serveur Twilio'
            ];
            
            $baseMessage = $statusMessages[$statusCode] ?? "Erreur HTTP $statusCode";
            return "$baseMessage: $errorDetails";
        }
        
        return $message;
    }
}