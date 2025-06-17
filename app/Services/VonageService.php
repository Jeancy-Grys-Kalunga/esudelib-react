<?php

namespace App\Services;

use Vonage\Client;
use Vonage\Client\Credentials\Basic;
use Vonage\SMS\Message\SMS;
use Vonage\Client\Exception\Exception as VonageException;

class VonageService
{
    protected $apiKey;
    protected $apiSecret;
    protected $brandName;
    private $vonageClient;

    public function __construct()
    {
        $this->apiKey = env('VONAGE_KEY');
        $this->apiSecret = env('VONAGE_SECRET');
        $this->brandName = env('VONAGE_BRAND_NAME', 'Esudelib');

        if (!$this->apiKey || !$this->apiSecret) {
            throw new \Exception('Les identifiants Vonage sont manquants dans les variables d\'environnement.');
        }
    }

    public function sendVonageSms($to, $content)
    {
        $this->initializeClient();
        
        try {
            $response = $this->vonageClient->sms()->send(
                new SMS($to, $this->brandName, $content)
            );

            $message = $response->current();
            
            if ($message->getStatus() !== 0) {
                throw new \Exception($this->parseVonageError($message->getStatus()));
            }
            
            return true;
            
        } catch (VonageException $e) {
            throw new \Exception($this->parseVonageException($e));
        } catch (\Exception $e) {
            throw new \Exception($this->parseVonageException($e));
        }
    }

    private function initializeClient()
    {
        if (!$this->vonageClient) {
            $credentials = new Basic($this->apiKey, $this->apiSecret);
            $this->vonageClient = new Client($credentials);
        }
    }

    private function parseVonageError(int $statusCode): string
    {
        $errors = [
            1 => 'Throttled - Trop de requêtes',
            2 => 'Paramètres manquants',
            3 => 'Paramètres invalides',
            4 => 'Credentiels invalides',
            5 => 'Erreur interne Vonage',
            6 => 'Numéro invalide',
            7 => 'Partenaire non autorisé',
            8 => 'Adresse IP non autorisée',
            9 => 'Quota SMS dépassé',
            10 => 'Message trop long',
            14 => 'Expéditeur non valide',
            15 => 'Message non autorisé'
        ];

        return $errors[$statusCode] ?? "Erreur inconnue (Code: $statusCode)";
    }

    private function parseVonageException(\Exception $e): string
    {
        // Check if the exception is a VonageException and has getResponse method
        if ($e instanceof \Vonage\Client\Exception\Request && method_exists($e, 'getResponse') && $e->getResponse()) {
            $response = json_decode($e->getResponse()->getBody()->getContents(), true);
            if (isset($response['error-code-label'])) {
                return $response['error-code-label'];
            }
        }
        return $e->getMessage();
    }
}