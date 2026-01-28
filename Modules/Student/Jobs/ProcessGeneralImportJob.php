<?php

namespace Modules\Student\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\Faculty;
use Modules\RegistrationDesk\Entities\Inscription;
use Modules\Student\Entities\Student;
use App\Models\User;
use Carbon\Carbon;
use Modules\Student\Imports\GeneralStudentsImport; // We might use it for helpers or just copy logic

class ProcessGeneralImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 1800; // 30 minutes

    public function __construct(
        protected string $filePath,
        protected string $importId,
        protected $academicYearId
    ) {}

    public function handle()
    {
        try {
            Cache::put("import_progress_{$this->importId}", ['status' => 'processing', 'progress' => 0], 3600);

            // Use the Import Class which now handles logic and progress
            Excel::import(new GeneralStudentsImport($this->academicYearId, $this->importId), $this->filePath);

            Cache::put("import_progress_{$this->importId}", ['status' => 'completed', 'progress' => 100], 3600);

            // Clean up file
            if (file_exists($this->filePath)) {
                @unlink($this->filePath);
            }
        } catch (\Exception $e) {
            Log::error("Import Job Failed: " . $e->getMessage());
            Cache::put("import_progress_{$this->importId}", ['status' => 'failed', 'error' => $e->getMessage()], 3600);
        }
    }
}
