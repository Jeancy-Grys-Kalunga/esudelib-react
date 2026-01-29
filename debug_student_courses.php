<?php
$s = \Modules\Student\Entities\Student::where('name', 'LIKE', '%AKAMBO%')->first();
if (!$s) {
    echo 'Student not found' . PHP_EOL;
} else {
    echo 'Student: ' . $s->name . ' (ID: ' . $s->id . ')' . PHP_EOL;
    $inscriptions = $s->inscriptions()->with(['promotion', 'institution', 'academicYear'])->get();

    foreach ($inscriptions as $i) {
        $promoId = $i->promotion_id;
        $promoTitle = $i->promotion ? $i->promotion->title : 'N/A';
        $instName = $i->institution->name;
        $year = $i->academicYear ? $i->academicYear->title : 'N/A';

        echo "Inscription ID: {$i->id}, Promo: $promoTitle (ID: $promoId), Inst: $instName, Year: $year" . PHP_EOL;

        $coursesViaPromo = \Modules\Institution\Entities\CourseProgramDetail::where('promotion_id', $promoId)->count();
        echo "  -> Courses linked to Promo $promoId: $coursesViaPromo" . PHP_EOL;

        // Check filtering by Program ID
        $program = \Modules\Institution\Entities\Program::where('institution_id', $i->institution_id)->first();
        if ($program) {
            echo "  -> Institution default Program: {$program->name} (ID: {$program->id})" . PHP_EOL;
            $coursesWithProgram = \Modules\Institution\Entities\CourseProgramDetail::where('promotion_id', $promoId)
                ->where('program_id', $program->id)
                ->count();
            echo "  -> Courses matching Promo AND Program {$program->id}: $coursesWithProgram" . PHP_EOL;
        } else {
            echo "  -> No default program found for institution." . PHP_EOL;
        }

        // Just list a few course IDs to verify
        $detailSamples = \Modules\Institution\Entities\CourseProgramDetail::where('promotion_id', $promoId)->take(3)->get();
        foreach ($detailSamples as $d) {
            echo "     -> Sample Detail: CourseID={$d->course_id}, ProgramID={$d->program_id}" . PHP_EOL;
        }
    }
}
