<?php

namespace Modules\Student\Entities;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\CourseProgramDetail;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Palmares;
use Modules\RegistrationDesk\Entities\Inscription;
use Modules\Student\Database\Factories\StudentFactory;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;



class Student extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $table = 'students';

    protected static function newFactory()
    {
        return StudentFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [];

    protected $with = ['media'];

    public function institution()
    {
        return $this->belongsTo(Institution::class, 'institution_id', 'id');
    }

    public function notes()
    {
        return $this->hasMany(Note::class, 'student_id', 'id');
    }

    public function appeals()
    {
        return $this->hasMany(Appeal::class, 'student_id', 'id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'student_id', 'id');
    }

    public function inscriptions()
    {
        return $this->hasMany(Inscription::class, 'student_id', 'id');
    }

    public function palmares()
    {
        return $this->hasMany(Palmares::class, 'student_id', 'id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function courses()
    {
        return $this->belongsToMany(Course::class, 'course_student');
    }

    // Dans app/Models/Student.php
    public function courseProgramDetails()
    {
        return $this->hasMany(CourseProgramDetail::class);
    }

    public function masterPrediction()
    {
        return $this->hasOne(\Modules\Jury\Entities\MasterPrediction::class);
    }

    protected $appends = ['gender'];

    public function getGenderAttribute()
    {
        return $this->gendre ?? null;
    }

    /**
     * Calcule la moyenne pondérée de l'étudiant
     *
     * @param \Illuminate\Support\Collection $notes Collection de notes
     * @param array $creditsMap Tableau associatif [course_id => credits]
     * @return float
     */
    public function calculateWeightedAverage($notes, array $creditsMap): float
    {
        $sommeNotesPonderees = 0;
        $totalCredits = 0;

        foreach ($notes as $note) {
            $courseId = $note->course_id;
            $credits = $creditsMap[$courseId] ?? 0;

            if ($note->cote !== null) {
                $sommeNotesPonderees += $note->cote * $credits;
                $totalCredits += $credits;
            }
        }

        if ($totalCredits > 0) {
            return round($sommeNotesPonderees / $totalCredits, 2);
        }

        // Fallback: Moyenne simple si aucun crédit n'est configuré
        // Cela correspond au comportement du Dashboard étudiant
        $count = 0;
        $simpleSum = 0;
        foreach ($notes as $note) {
            if ($note->cote !== null) {
                $simpleSum += $note->cote;
                $count++;
            }
        }

        return $count > 0 ? round($simpleSum / $count, 2) : 0.0;
    }

    /**
     * Calcule la décision du jury
     */
    public function calculateDecision($notes, array $creditsMap, float $average): string
    {
        $hasMissingNote = false;
        $hasFailedNote = false;

        foreach ($notes as $note) {
            if ($note->cote === null) {
                $hasMissingNote = true;
            } elseif ($note->cote < 10) {
                $hasFailedNote = true;
            }
        }

        if ($hasMissingNote) {
            return 'DEF';
        } elseif ($hasFailedNote) {
            // Dans certains systèmes, une cote < 10 entraîne automatiquement AJ ou une autre logique.
            // Ici je garde la logique existante du controller: si note < 10 => AJ.
            return 'AJ';
        } else {
            if ($average >= 18) return 'A';
            if ($average <  18 && $average >= 16) return 'B';
            if ($average < 16 && $average >= 14) return 'C';
            if ($average < 14 && $average >= 12) return 'D';
            if ($average < 12 && $average >= 10) return 'E';
            if ($average < 10 && $average >= 8) return 'F';
            return 'G';
        }
    }

    /**
     * Calcule la mention
     */
    public function calculateMention(string $decision, $notes, float $average): string
    {
        // Mapping des mentions basé sur la moyenne (LMD standard)
        if ($average >= 18) return 'Excellent';
        if ($average <  18 && $average >= 16) return 'Très bien';
        if ($average < 16 && $average >= 14) return 'Bien';
        if ($average < 14 && $average >= 12) return 'Assez bien';
        if ($average < 12 && $average >= 10) return 'Passable';
        if ($average < 10 && $average >= 8) return 'Insatisfaisant';

        return 'Ajourné';
    }

    // Helper pour calculer les besoins et réserves
    public function calculateStats($notes, array $creditsMap)
    {
        $reserve = 0;
        $need = 0;

        foreach ($notes as $note) {
            if ($note->cote !== null) {
                if ($note->cote > 10) {
                    $reserve += ($note->cote - 10);
                } elseif ($note->cote < 10) {
                    $need += (10 - $note->cote);
                }
            }
        }

        return ['reserve' => round($reserve, 2), 'need' => round($need, 2)];
    }
}
