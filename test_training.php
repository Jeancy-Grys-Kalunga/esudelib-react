<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "Starting training...\n";
    $service = app(\Modules\Jury\Services\MasterPredictionService::class);
    $result = $service->trainModel();
    echo "Training result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
} catch (\Exception $e) {
    file_put_contents('training_error.log', $e->getMessage());
    echo "Error logged to training_error.log\n";
}
