<?php

use Modules\Institution\Entities\CourseProgramDetail;
use Modules\Institution\Entities\Program;
use Modules\Student\Entities\Student;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$s = Student::where('name', 'LIKE', '%AKAMBO%')->first();

if (!$s) {
    echo 'Student not found' . PHP_EOL;
    exit;
}

echo 'Student: ' . $s->name . ' (ID: ' . $s->id . ')' . PHP_EOL;

$inscriptions = $s->inscriptions()->with(['promotion', 'institution', 'academicYear'])->get();

foreach ($inscriptions as $i) {
    $promoId = $i->promotion_id;
    $promoTitle = $i->promotion ? $i->promotion->title : 'N/A';
    $instName = $i->institution->name;
    $year = $i->academicYear ? $i->academicYear->title : 'N/A';

    echo "------------------------------------------------" . PHP_EOL;
    echo "Inscription ID: {$i->id}" . PHP_EOL;
    echo "Institution: $instName (ID: {$i->institution_id})" . PHP_EOL;
    echo "Promotion: $promoTitle (ID: $promoId)" . PHP_EOL;
    echo "Academic Year: $year" . PHP_EOL;

    // 1. Check courses by Promo ID only
    $coursesViaPromo = CourseProgramDetail::where('promotion_id', $promoId)->count();
    echo "-> Courses linked via Promotion ID ($promoId) ONLY: $coursesViaPromo" . PHP_EOL;

    // 2. Check the "Default Program" logic
    $program = Program::where('institution_id', $i->institution_id)->first();
    if ($program) {
        echo "-> Controller logic picks Program: {$program->name} (ID: {$program->id})" . PHP_EOL;

        $coursesWithProgram = CourseProgramDetail::where('promotion_id', $promoId)
            ->where('program_id', $program->id)
            ->count();
        echo "-> Courses matching Promo ($promoId) AND Program ($program->id): $coursesWithProgram" . PHP_EOL;

        if ($coursesViaPromo > 0 && $coursesWithProgram == 0) {
            echo "!! CRITICAL: Strict Program ID filter is hiding keys courses !!" . PHP_EOL;

            // Check what programs are actually used
            $actualPrograms = CourseProgramDetail::where('promotion_id', $promoId)
                ->distinct()
                ->pluck('program_id');
            echo "-> Actual Program IDs in CourseProgramDetail for this promo: " . $actualPrograms->implode(', ') . PHP_EOL;
        }
    } else {
        echo "-> No default program found for institution." . PHP_EOL;
    }
}
echo "------------------------------------------------" . PHP_EOL;
