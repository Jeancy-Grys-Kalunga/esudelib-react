<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;

Route::get('/test-image-proxy', function () {
    try {
        // Un diagramme simple pour le test
        $plantUML = "@startuml\nclass Test { \n +attribute \n +method() \n }\n@enduml";

        // Logique d'encodage (identique au contrôleur)
        $compressed = gzdeflate($plantUML, 9);
        $encoded = '';
        $encode6bit = function (int $b) {
            if ($b < 10) return chr(48 + $b);
            $b -= 10;
            if ($b < 26) return chr(65 + $b);
            $b -= 26;
            if ($b < 26) return chr(97 + $b);
            $b -= 26;
            if ($b == 0) return '-';
            if ($b == 1) return '_';
            return '?';
        };

        for ($i = 0; $i < strlen($compressed); $i += 3) {
            $b1 = ord($compressed[$i]);
            $b2 = $i + 1 < strlen($compressed) ? ord($compressed[$i + 1]) : 0;
            $b3 = $i + 2 < strlen($compressed) ? ord($compressed[$i + 2]) : 0;

            $encoded .= $encode6bit($b1 >> 2);
            $encoded .= $encode6bit((($b1 & 0x3) << 4) | ($b2 >> 4));
            $encoded .= $encode6bit((($b2 & 0xF) << 2) | ($b3 >> 6));
            $encoded .= $encode6bit($b3 & 0x3F);
        }

        $remoteImageUrl = "https://www.plantuml.com/plantuml/png/{$encoded}";

        // Test du téléchargement
        $start = microtime(true);
        $response = Http::timeout(10)->get($remoteImageUrl);
        $duration = microtime(true) - $start;

        if ($response->successful()) {
            $content = $response->body();
            $base64 = base64_encode($content);
            $dataUri = 'data:image/png;base64,' . $base64;

            return response()->json([
                'success' => true,
                'mode' => 'server_proxy_base64',
                'original_url' => $remoteImageUrl,
                'download_duration' => round($duration, 3) . 's',
                'image_size' => strlen($content) . ' bytes',
                'base64_preview' => substr($dataUri, 0, 50) . '...',
                'is_valid_base64' => (strpos($dataUri, 'data:image/png;base64,') === 0),
            ]);
        } else {
            return response()->json([
                'success' => false,
                'status' => $response->status(),
                'url' => $remoteImageUrl
            ], 500);
        }
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ], 500);
    }
});
