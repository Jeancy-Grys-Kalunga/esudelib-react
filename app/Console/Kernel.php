<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Entraînement automatique du modèle tous les mois
        $schedule->command('model:train-monthly')
            ->monthly()
            ->timezone('Africa/Kinshasa');

        // Nettoyage des fichiers temporaires
        $schedule->command('model:clean-temp-files')
            ->daily()
            ->timezone('Africa/Kinshasa');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
