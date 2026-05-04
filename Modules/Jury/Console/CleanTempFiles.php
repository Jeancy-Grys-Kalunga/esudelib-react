<?php

namespace Modules\Jury\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanTempFiles extends Command
{
    protected $signature = 'model:clean-temp-files';
    protected $description = 'Nettoie les fichiers temporaires des modèles ML';

    public function handle()
    {
        $tempDir = storage_path('ml/temp');

        if (!file_exists($tempDir)) {
            $this->info('Le répertoire temp n\'existe pas.');
            return;
        }

        $files = glob($tempDir . '/*');
        $count = 0;

        foreach ($files as $file) {
            if (is_file($file)) {
                $fileAge = time() - filemtime($file);
                // Supprimer les fichiers de plus de 24 heures
                if ($fileAge > 86400) {
                    unlink($file);
                    $count++;
                }
            }
        }

        $this->info("{$count} fichiers temporaires supprimés.");
    }
}
