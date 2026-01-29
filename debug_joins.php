<?php

use Illuminate\Support\Facades\Schema;
use Modules\Institution\Entities\CourseProgramDetail;
use Modules\Institution\Entities\Program;
use Modules\Student\Entities\Student;
use Modules\Institution\Entities\Course;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Schema of course_program_details: " . implode(', ', Schema::getColumnListing('course_program_details')) . "\n";

$s = Student::where('name', 'LIKE', '%AKAMBO%')->first();
if (!$s) die("Student not found\n");

foreach ($s->inscriptions as $i) {
    $promoId = $i->promotion_id;
    echo "Promo: $promoId\n";

    // Base count
    $c1 = CourseProgramDetail::where('promotion_id', $promoId)->count();
    echo "Base CourseProgramDetails: $c1\n";

    // Join Course
    $c2 = CourseProgramDetail::join('courses', 'course_program_details.course_id', '=', 'courses.id')
        ->where('promotion_id', $promoId)->count();
    echo "Join Courses: $c2\n";

    // Join Categories
    $c3 = CourseProgramDetail::join('courses', 'course_program_details.course_id', '=', 'courses.id')
        ->join('course_categories', 'course_program_details.course_category_id', '=', 'course_categories.id')
        ->where('promotion_id', $promoId)->count();
    echo "Join Categories: $c3\n";

    // Join Promotions
    $c4 = CourseProgramDetail::join('courses', 'course_program_details.course_id', '=', 'courses.id')
        ->join('course_categories', 'course_program_details.course_category_id', '=', 'course_categories.id')
        ->join('promotions', 'course_program_details.promotion_id', '=', 'promotions.id')
        ->where('course_program_details.promotion_id', $promoId)->count();
    echo "Join Promotions: $c4\n";

    // Program Filter
    $program = Program::where('institution_id', $i->institution_id)->first();
    if ($program) {
        $c5 = CourseProgramDetail::join('courses', 'course_program_details.course_id', '=', 'courses.id')
            ->join('course_categories', 'course_program_details.course_category_id', '=', 'course_categories.id')
            ->join('promotions', 'course_program_details.promotion_id', '=', 'promotions.id')
            ->where('course_program_details.promotion_id', $promoId)
            ->where('course_program_details.program_id', $program->id)
            ->count();
        echo "With Program Filter ({$program->id}): $c5\n";
    }
}
