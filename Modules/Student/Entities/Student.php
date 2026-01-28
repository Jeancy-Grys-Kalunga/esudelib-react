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
use Modules\Student\Database\factories\StudentFactory;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;


class Student extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

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

        return $totalCredits > 0
            ? round($sommeNotesPonderees / $totalCredits, 2)
            : 0.0;
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
            if ($average >= 16) return 'B';
            if ($average >= 14) return 'C';
            if ($average >= 12) return 'D';
            if ($average >= 10) return 'E';
            if ($average >= 8) return 'F';
            return 'G';
        }
    }

    /**
     * Calcule la mention
     */
    public function calculateMention(string $decision, $notes): string
    {
        $allPassed = true;
        foreach ($notes as $note) {
            if ($note->cote !== null && $note->cote < 10) {
                $allPassed = false;
                break;
            }
        }

        if ($decision === 'DEF') {
            return 'DEF';
        } elseif (in_array($decision, ['F', 'G', 'AJ'])) {
            return 'AJ';
        } else {
            return $allPassed ? 'Admis' : 'Comp';
        }
    }

    // Helper pour calculer les besoins et réserves
    public function calculateStats($notes, array $creditsMap)
    {
        $reserve = 0;
        $need = 0;

        foreach ($notes as $note) {
            $credits = $creditsMap[$note->course_id] ?? 0;
            if ($note->cote !== null) {
                if ($note->cote > 10) {
                    $reserve += ($note->cote - 10); // Note: Logique originale était sans pondération pour reserve/need dans le controller initial?
                    // Attends, le controller initial avait:
                    // $reserve += ($note->cote - 10); (Ligne 85) -> Pas de multiplication par crédits?
                    // $sommeNotesPonderees += $note->cote * $credits; (Ligne 81)
                    // Vérifions ApplyEqualization: $reserve += ($note->cote - 10) * $credits; (Ligne 488) logic globale.
                    // C'est incohérent. Pour l'affichage "Réserve/Besoin", le contrôleur faisait une somme simple.
                    // Mais pour la peréquation, il fait une somme pondérée.
                    // Je vais garder la logique d'affichage simple pour l'instant pour ne pas changer l'UI,
                    // ou devrais-je corriger? Le user a dit "les valeurs de décision et de mention ne sont pas correcte".
                    // Il n'a pas mentionné reserve/need explicitement mais ça fait partie du tableau.
                    // Je vais garder la logique simple (somme des points au dessus/dessous de 10) comme dans le controller original pour l'affichage gridData.
                } elseif ($note->cote < 10) {
                    $need += (10 - $note->cote);
                }
            }
        }

        return ['reserve' => round($reserve, 2), 'need' => round($need, 2)];
    }
}
