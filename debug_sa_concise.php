<?php

use Modules\Institution\Entities\CourseProgramDetail;
use Modules\Institution\Entities\Program;
use Modules\Student\Entities\Student;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$s = Student::where('name', 'LIKE', '%AKAMBO%')->first();
if (!$s) die("Student not found\n");

echo "Student: {$s->id}\n";
foreach ($s->inscriptions as $i) {
    $pid = $i->promotion_id;
    echo "Promo: $pid\n";
    $c_promo = CourseProgramDetail::where('promotion_id', $pid)->count();
    echo "Count(Promo): $c_promo\n";

    $prog = Program::where('institution_id', $i->institution_id)->first();
    if ($prog) {
        $c_prog = CourseProgramDetail::where('promotion_id', $pid)->where('program_id', $prog->id)->count();
        echo "Count(Promo+Prog {$prog->id}): $c_prog\n";
        if ($c_promo > 0 && $c_prog == 0) echo "MISMATCH: Program filter hides all courses!\n";
    } else {
        echo "No default program.\n";
    }
}
