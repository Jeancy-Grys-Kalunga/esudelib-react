<?php

use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\Faculty;
use Illuminate\Support\Str;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- STARTING ISC PROMOTION SEEDING ---\n";

// 1. Get Institutions
$iss = Institution::where('name', 'LIKE', '%ISS%')->first();
$isc = Institution::where('name', 'LIKE', '%ISC%')->first();

if (!$iss || !$isc) {
    die("Error: Could not find ISS or ISC institutions.\n");
}

echo "Found ISS (ID: {$iss->id}) and ISC (ID: {$isc->id})\n";

// 2. Define ISC Keywords to filter faculties
$iscKeywords = [
    'COMPTABILITE',
    'FISCALITE',
    'DOUANE',
    'MARKETING',
    'BANQUE',
    'INFORMATIQUE DE GESTION'
];

// 3. Get relevant faculties
$targetFacultyIds = Faculty::where(function ($query) use ($iscKeywords) {
    foreach ($iscKeywords as $keyword) {
        $query->orWhere('title', 'LIKE', "%{$keyword}%");
    }
})->pluck('id')->toArray();

echo "Found " . count($targetFacultyIds) . " target faculties based on ISC keywords.\n";

if (empty($targetFacultyIds)) {
    die("No matching faculties found. Check keywords or DB.\n");
}

// 4. Get Promotions from ISS that belong to these faculties
$issPromotions = Promotion::where('institution_id', $iss->id)
    ->whereIn('faculty_id', $targetFacultyIds)
    ->get();

echo "Found " . $issPromotions->count() . " source promotions in ISS.\n";

$createdCount = 0;

foreach ($issPromotions as $sourcePromo) {
    // Check if duplicate exists
    $exists = Promotion::where('institution_id', $isc->id)
        ->where('title', $sourcePromo->title)
        ->where('faculty_id', $sourcePromo->faculty_id)
        ->exists();

    if ($exists) {
        echo " - Skipped [Exists]: {$sourcePromo->title}\n";
        continue;
    }

    // Create copy for ISC
    Promotion::create([
        'title' => $sourcePromo->title,
        'institution_id' => $isc->id,
        'faculty_id' => $sourcePromo->faculty_id,
        // Copy other fields if necessary
    ]);

    echo " + Created: {$sourcePromo->title}\n";
    $createdCount++;
}

echo "--- DONE. Created $createdCount new promotions for ISC. ---\n";
