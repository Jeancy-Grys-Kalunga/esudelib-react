<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Modules\Institution\Entities\CourseProgramDetail;

function dumpCourses($promoId)
{
    echo "Courses for Promo ID $promoId:\n";
    $details = CourseProgramDetail::with('course')->where('promotion_id', $promoId)->get();
    foreach ($details as $d) {
        if ($d->course) {
            echo "- " . $d->course->name . " (ID: " . $d->course->id . ")\n";
        } else {
            echo "- Detail ID " . $d->id . " has no course!\n";
        }
    }
    echo "\n";
}

dumpCourses(80);
dumpCourses(81);
