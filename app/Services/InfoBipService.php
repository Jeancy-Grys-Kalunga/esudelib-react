<?php

namespace App\Services;

use Infobip\ApiException;
use Infobip\Configuration;
use Infobip\Api\SendSmsApi;
use Infobip\Model\SmsDestination;
use Infobip\Model\SmsTextualMessage;
use Infobip\Model\SmsAdvancedTextualRequest;

class InfoBipService
{
    protected $apiKey;
    protected $baseUrl;
    private $infobipConfig;


    public function __construct()
    {
        $this->apiKey = env('INFOBIP_KEY');
        $this->baseUrl = env('INFOBIP_BASE_URL', 'https://api.infobip.com');

        if (!$this->apiKey) {
            throw new \Exception('InfoBip API key is not set in the environment variables.');
        }
        if (!$this->baseUrl) {
            throw new \Exception('InfoBip base URL is not set in the environment variables.');
        }
    }

    public function sendInfobipSms($to, $content)
    {
        $this->infobipConfig = (new Configuration())
            ->setHost(env('INFOBIP_BASE_URL'))
            ->setApiKeyPrefix('Authorization', 'App')
            ->setApiKey('Authorization', env('INFOBIP_KEY'));

        $smsApi = new SendSmsApi(null, $this->infobipConfig);

        $destination = (new SmsDestination())->setTo($to);
        $message = (new SmsTextualMessage())
            ->setFrom('Esudelib')
            ->setText($content)
            ->setDestinations([$destination]);

        $request = (new SmsAdvancedTextualRequest())->setMessages([$message]);

        $response = $smsApi->sendSmsMessage($request);

        if ($response->getMessages()[0]->getStatus()->getGroupId() !== 1) {
            throw new \Exception('Échec de l\'envoi du SMS');
        }
    }

    private function parseInfobipError(ApiException $e): string
    {
        $response = $e->getResponseBody();
        if (isset($response['requestError']['serviceException']['text'])) {
            return $response['requestError']['serviceException']['text'];
        }
        return $e->getMessage();
    }
}
