<?php

namespace Modules\Jury\Http\Controllers;

use App\Http\Controllers\Controller;
use Rubix\ML\PersistentModel;
use Rubix\ML\Serializers\RBX;
use Rubix\ML\Persisters\Filesystem;
use Rubix\ML\Datasets\Unlabeled;
use Modules\Student\Entities\Student;
use Modules\Student\Entities\Note;
use Modules\Institution\Entities\Course;
use Illuminate\Support\Facades\DB;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\UnitsTeaching;
use Illuminate\Http\Request;
use Inertia\Inertia;


class OrientationPredictionController extends Controller
{
    public function predictOrientation(Student $student)
    {
        // Récupérer les données académiques de l'étudiant
        $academicData = $this->prepareAcademicData($student);
        
        // Charger le modèle pré-entraîné
        $estimator = PersistentModel::load(
            new Filesystem(storage_path('ml/orientation.model')),
            new RBX()
        );

        // Créer le dataset pour la prédiction
        $dataset = new Unlabeled([$academicData['features']]);
        
        // Faire la prédiction
        $prediction = $estimator->predict($dataset)[0];
        
        // Formater les résultats
        return [
            'student' => $student->only('id', 'name'),
            'prediction' => $prediction,
            'confidence' => $academicData['confidence'],
            'features' => $academicData['features'],
            'orientations' => $academicData['orientations']
        ];
    }

    private function prepareAcademicData(Student $student)
    {
        // 1. Récupérer les notes avec les cours et leurs orientations
        $notes = Note::with(['course' => function($query) {
                $query->select('id', 'title', 'orientation');
            }])
            ->where('student_id', $student->id)
            ->whereNotNull('cote')
            ->get();

        // 2. Récupérer les crédits des cours
        $coursesCredits = DB::table('course_program_details')
            ->whereIn('course_id', $notes->pluck('course_id'))
            ->pluck('credits', 'course_id')
            ->toArray();

        // 3. Calculer les scores par orientation
        $orientationScores = [];
        $orientationCredits = [];
        
        foreach ($notes as $note) {
            if (!isset($coursesCredits[$note->course_id])) continue;
            
            $orientation = $note->course->orientation;
            $credits = $coursesCredits[$note->course_id];
            $score = $note->cote * $credits;
            
            if (!isset($orientationScores[$orientation])) {
                $orientationScores[$orientation] = 0;
                $orientationCredits[$orientation] = 0;
            }
            
            $orientationScores[$orientation] += $score;
            $orientationCredits[$orientation] += $credits;
        }
        
        // 4. Calculer les moyennes pondérées
        $orientationAverages = [];
        $totalCredits = 0;
        
        foreach ($orientationScores as $orientation => $score) {
            $average = $orientationCredits[$orientation] > 0 
                ? $score / $orientationCredits[$orientation] 
                : 0;
                
            $orientationAverages[$orientation] = round($average, 2);
            $totalCredits += $orientationCredits[$orientation];
        }
        
        // 5. Calculer la confiance globale
        $confidence = ($totalCredits > 0) ? min(100, round(($student->average / 20) * 100)) : 0;
        
        // 6. Préparer les features pour le modèle
        $features = [
            'average' => $student->average,
            'credits_completed' => $totalCredits,
            'orientation_variance' => $this->calculateVariance($orientationAverages),
            'top_orientation_score' => max($orientationAverages) ?: 0,
            'failed_courses' => $notes->where('cote', '<', 10)->count(),
        ];
        
        // Ajouter les scores par orientation
        foreach ($orientationAverages as $orientation => $score) {
            $features["orientation_".str_slug($orientation)] = $score;
        }
        
        return [
            'features' => array_values($features),
            'confidence' => $confidence,
            'orientations' => $orientationAverages
        ];
    }

    private function calculateVariance(array $values)
    {
        if (count($values) < 2) return 0;
        
        $mean = array_sum($values) / count($values);
        $variance = 0.0;
        
        foreach ($values as $value) {
            $variance += pow($value - $mean, 2);
        }
        
        return $variance / count($values);
    }

    public function showPredictionInterface(Request $request)
    {
        $context = $request->session()->get('jury_context');
        $academicYear = AcademicYear::find($context['academic_year_id']);
        $promotion = Promotion::find($context['promotion_id']);
        
        // Récupérer les étudiants avec leurs moyennes
        $students = Student::whereHas('notes', function($query) use ($context) {
                $query->where('academic_year_id', $context['academic_year_id'])
                    ->where('promotion_id', $context['promotion_id']);
            })
            ->withCount(['notes as average' => function($query) use ($context) {
                $query->select(DB::raw('AVG(cote)'))
                    ->where('academic_year_id', $context['academic_year_id'])
                    ->where('promotion_id', $context['promotion_id']);
            }])
            ->paginate(10);

        return Inertia::render('jury/orientation-prediction', [
            'academicYear' => $academicYear,
            'promotion' => $promotion,
            'students' => $students
        ]);
    }
}