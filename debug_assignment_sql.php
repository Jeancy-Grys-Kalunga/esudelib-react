<?php

use Modules\Institution\Entities\Assignment;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "Testing Assignment::with('course')...\n";

    $assignment = Assignment::with('course')->first();

    if ($assignment) {
        echo "Assignment found. Course ID: " . ($assignment->course_id) . "\n";
        if ($assignment->course) {
            echo "Course loaded: " . ($assignment->course->title ?? $assignment->course->name) . "\n";
        } else {
            echo "Course is NULL.\n";
        }
    } else {
        echo "No assignments found.\n";
    }

    echo "Query executed successfully.\n";
} catch (\Exception $e) {
    echo "Query FAILED: " . $e->getMessage() . "\n";
}
