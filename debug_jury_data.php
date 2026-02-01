<?php

use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Promotion;
use Modules\Student\Entities\Student;
use Modules\RegistrationDesk\Entities\Inscription;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// --- Configuration ---
// Adjust these IDs based on your database context 
// (You might need to find a valid context ID first)
$promotionId = 180; // Example Promotion ID (e.g., from previous 'BAC1 MARKETING' issue context)
$academicYearId = 1; // Example Academic Year ID

// If you don't know the IDs, let's find a promotion with students
$promoWithStudents = Inscription::select('promotion_id', DB::raw('count(*) as count'))
    ->groupBy('promotion_id')
    ->orderByDesc('count')
    ->first();

if ($promoWithStudents) {
    $promotionId = $promoWithStudents->promotion_id;
    echo "Found Promotion ID with students: " . $promotionId . " (Count: " . $promoWithStudents->count . ")\n";
} else {
    echo "No promotion with students found.\n";
}

$activeYear = AcademicYear::latest()->first();
if ($activeYear) {
    $academicYearId = $activeYear->id;
    echo "Using Academic Year: " . $activeYear->title . " (ID: " . $academicYearId . ")\n";
}

echo "\n--- Debugging Jury Data Fetching ---\n";
echo "Context: Promotion ID $promotionId, Academic Year ID $academicYearId\n";

// 1. Check raw Inscriptions count
$countInscriptions = Inscription::where('promotion_id', $promotionId)
    ->where('academic_year_id', $academicYearId)
    ->count();
echo "Raw Inscriptions count matching context: $countInscriptions\n";

// 2. Test the Query Logic used in ResultsController
$studentsQuery = Student::whereHas('inscriptions', function ($query) use ($promotionId, $academicYearId) {
    $query->where('academic_year_id', $academicYearId)
        ->where('promotion_id', $promotionId);
});

echo "Students found via query: " . $studentsQuery->count() . "\n";

if ($studentsQuery->count() == 0) {
    echo "\n[WARNING] No students found. Possible reasons:\n";
    echo "- Mismatch between Inscription academic_year_id and Context.\n";
    echo "- Soft deletes on Students?\n";

    // Check one inscription detailed
    $oneInscription = Inscription::where('promotion_id', $promotionId)->first();
    if ($oneInscription) {
        echo "Sample Inscription in this promotion:\n";
        echo " - Student ID: " . $oneInscription->student_id . "\n";
        echo " - Academic Year ID: " . $oneInscription->academic_year_id . "\n";
        echo " - Created At: " . $oneInscription->created_at . "\n";
        echo "Expected Year ID: $academicYearId\n";
    }
}

// 3. Debug Course Fetching
echo "\n--- Debugging Course Fetching ---\n";
$courses = DB::table('course_program_details')
    ->where('promotion_id', $promotionId)
    ->pluck('course_id')
    ->toArray();

echo "Courses explicitly linked to Promotion $promotionId: " . count($courses) . "\n";
// print_r($courses);

echo "\nDone.\n";
