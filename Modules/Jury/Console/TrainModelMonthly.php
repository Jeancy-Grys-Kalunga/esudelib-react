<?php

namespace Modules\Jury\Console;

use Modules\Jury\Services\MasterPredictionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TrainModelMonthly extends Command
{
    protected $signature = 'model:train-monthly';
    protected $description = 'Entraîne automatiquement le modèle XGBoost tous les mois';

    public function handle()
    {
        $this->info('Début de l\'entraînement mensuel du modèle XGBoost...');

        try {
            $service = new MasterPredictionService();
            $result = $service->trainModel();

            $this->info('Modèle entraîné avec succès!');
            $this->info('Précision: ' . ($result['accuracy'] * 100) . '%');
            $this->info('Nombre d\'échantillons: ' . $result['n_samples']);

            Log::info('Entraînement mensuel du modèle XGBoost réussi', $result);
        } catch (\Exception $e) {
            $this->error('Erreur lors de l\'entraînement: ' . $e->getMessage());
            Log::error('Erreur entraînement mensuel modèle XGBoost: ' . $e->getMessage());
        }
    }
}
