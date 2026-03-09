<?php

namespace Modules\RegistrationDesk\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Imports\StudentsImport;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Modules\RegistrationDesk\Entities\Inscription;
use Modules\RegistrationDesk\Http\Requests\StoreInscriptionRequest;
use Modules\Inscription\Http\Requests\UpdateInscriptionRequest;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Promotion;
use Modules\RegistrationDesk\Http\Requests\UpdateInscriptionRequest as RequestsUpdateInscriptionRequest;
use Modules\Student\Entities\Student;
use Spatie\Permission\Models\Permission;
// Ajout des nouveaux modèles nécessaires
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Program;
use Modules\Institution\Entities\CourseProgramDetail;
use Modules\Student\Imports\GeneralStudentsImport;
// use Modules\Student\Jobs\ProcessGeneralImportJob; // Unused
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;


class SubscriptionController extends Controller
{
    public function index(Request $request)
    {
        /** @var User $user */
        $user = auth()->user();
        if (!$user->hasPermissionTo('access_inscriptions')) {
            abort(403, 'Action non autorisée');
        }

        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_inscriptions',
            'edit'   => 'edit_inscriptions',
            'delete' => 'delete_inscriptions',
            'import' => 'import_inscriptions',
            'access' => 'access_inscriptions',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        // Construction de la requête
        $query = Inscription::with(['student', 'academicYear', 'institution', 'promotion'])
            ->orderByDesc('id');

        if ($user->hasRole('Bureau Inscription')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereHas('institution', fn($q) => $q->whereIn('id', $institutionIds));
        }

        // Formatage des données
        $inscriptions = $query->get()->map(function ($inscription) {
            return [
                'id' => $inscription->id,
                'student_name' => $inscription->student->name,
                'student_matricule' => $inscription->student->matricule,
                'academic_year' => $inscription->academicYear->title,
                'institution' => $inscription->institution->name,
                'promotion' => $inscription->promotion->title,
                'created_at' => $inscription->created_at->translatedFormat('d F Y'),
            ];
        });

        $institutions = Institution::when(
            $user->hasRole('Bureau Inscription'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        $academicYears = AcademicYear::all(['id', 'title']);
        $promotions = Promotion::all(['id', 'title', 'institution_id']);

        return Inertia::render('inscription/index', [
            'inscriptions' => $inscriptions,
            'can' => $can,
            'institutions' => $institutions,
            'academicYears' => $academicYears,
            'promotions' => $promotions,
            'flash' => $this->getFlashMessages(),
        ]);
    }

    public function create()
    {
        /** @var User $user */
        $user = auth()->user();

        $institutions = Institution::when(
            $user->hasRole('Bureau Inscription'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        $academicYears = AcademicYear::all(['id', 'title']);
        $promotions = Promotion::all(['id', 'title', 'institution_id']);

        return Inertia::render('inscription::inscriptions/Form', [
            'institutions' => $institutions,
            'academicYears' => $academicYears,
            'promotions' => $promotions,
        ]);
    }

    public function store(StoreInscriptionRequest $request)
    {
        /** @var User $user */
        $user = auth()->user();
        if (!$user->hasPermissionTo('create_inscriptions')) {
            abort(403, 'Action non autorisée');
        }

        return DB::transaction(function () use ($request) {
            // Création du compte utilisateur en premier
            $user = $this->createStudentUser($request);

            // Génération du matricule
            $matricule = 'MAT-' . date('Y') . '-' . Str::padLeft(Student::max('id') + 1, 5, '0');

            // Création de l'étudiant avec le user_id
            $student = Student::create([
                'matricule' => $matricule,
                'name' => $request->name,
                'gendre' => $request->gendre,
                'date_of_birth' => $request->date_of_birth,
                'email' => $user->email,
                'phone' => $request->phone,
                'institution_id' => $request->institution_id,
                'user_id' => $user->id,
            ]);

            // Création de l'inscription
            $inscription = Inscription::create([
                'student_id' => $student->id,
                'academic_year_id' => $request->academic_year_id,
                'institution_id' => $request->institution_id,
                'promotion_id' => $request->promotion_id,
            ]);

            // Vérification d'équivalence si étudiant transféré
            if ($request->is_transfer) {
                $equivalenceResults = $this->checkCourseEquivalence(
                    $request->old_institution_id,
                    $request->old_promotion_id,
                    $request->institution_id,
                    $request->promotion_id
                );

                // Stocker les équivalences en session pour affichage (compatibilité legacy)
                session()->flash('flash', [
                    'type' => 'success',
                    'message' => 'Inscription enregistrée avec succès !',
                    'equivalences' => $equivalenceResults['equivalences'],
                    'stats' => $equivalenceResults['stats'],
                ]);
            }

            return redirect()->route('subscriptions.index')->with([
                'flash' => [
                    'type' => 'success',
                    'message' => 'Inscription enregistrée avec succès !',
                ],
            ]);
        });
    }

    /**
     * Méthode pour charger les équivalences via AJAX
     */
    public function getEquivalence(Request $request)
    {
        $request->validate([
            'old_institution_id' => 'required',
            'old_promotion_id' => 'required',
            'new_institution_id' => 'required',
            'new_promotion_id' => 'required',
        ]);

        try {
            $equivalenceResults = $this->checkCourseEquivalence(
                $request->old_institution_id,
                $request->old_promotion_id,
                $request->new_institution_id,
                $request->new_promotion_id
            );

            return response()->json([
                'success' => true,
                'equivalences' => $equivalenceResults['equivalences'],
                'stats' => $equivalenceResults['stats']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul d\'équivalence : ' . $e->getMessage()
            ], 500);
        }
    }

    public function edit(Inscription $inscription)
    {
        /** @var User $user */
        $user = auth()->user();
        if (!$user->hasPermissionTo('edit_inscriptions')) {
            abort(403, 'Action non autorisée');
        }

        $institutions = Institution::when(
            $user->hasRole('Bureau Inscription'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        $academicYears = AcademicYear::all(['id', 'title']);
        $promotions = Promotion::all(['id', 'title', 'institution_id']);

        return Inertia::render('inscription::inscriptions/Form', [
            'inscription' => $inscription->load(['student', 'academicYear', 'institution', 'promotion']),
            'institutions' => $institutions,
            'academicYears' => $academicYears,
            'promotions' => $promotions,
        ]);
    }

    public function update(RequestsUpdateInscriptionRequest $request, Inscription $inscription)
    {
        /** @var User $user */
        $user = auth()->user();
        if (!$user->hasPermissionTo('edit_inscriptions')) {
            abort(403, 'Action non autorisée');
        }

        return DB::transaction(function () use ($request, $inscription) {
            $student = $inscription->student;

            // Mise à jour de l'étudiant
            $student->update([
                'name' => $request->name,
                'gendre' => $request->gendre,
                'date_of_birth' => $request->date_of_birth,
                'phone' => $request->phone,
                'institution_id' => $request->institution_id,
            ]);

            // Mise à jour de l'inscription
            $inscription->update([
                'academic_year_id' => $request->academic_year_id,
                'promotion_id' => $request->promotion_id,
            ]);

            // Mise à jour de la table pivot institution_user
            /** @var User|null $user */
            $user = $student->user;
            if ($user) {
                $user->institutions()->sync([$request->institution_id]);
            }

            return redirect()->route('subscriptions.index')->with([
                'flash' => [
                    'type' => 'success',
                    'message' => 'Inscription mise à jour avec succès !',
                ],
            ]);
        });
    }

    public function destroy(Inscription $inscription)
    {
        /** @var User $user */
        $user = auth()->user();
        if (!$user->hasPermissionTo('delete_inscriptions')) {
            abort(403, 'Action non autorisée');
        }

        return DB::transaction(function () use ($inscription) {
            $student = $inscription->student;

            // Supprimer le compte utilisateur associé
            /** @var User|null $user */
            $user = $student->user;
            if ($user) {
                $user->delete();
            }

            // Supprimer l'inscription et l'étudiant
            $inscription->delete();
            $student->delete();

            return redirect()->route('subscriptions.index')->with([
                'flash' => [
                    'type' => 'success',
                    'message' => 'Inscription supprimée avec succès !',
                ],
            ]);
        });
    }

    public function import(Request $request)
    {
        /** @var User $user */
        $user = auth()->user();
        if (!$user->hasPermissionTo('import_inscriptions')) {
            abort(403, 'Action non autorisée');
        }

        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv',
            'academic_year_id' => 'required|exists:academic_years,id',
            'institution_id' => 'required|exists:institutions,id',
            'promotion_id' => 'required|exists:promotions,id',
        ]);

        Excel::import(new StudentsImport(
            $request->academic_year_id,
            $request->institution_id,
            $request->promotion_id
        ), $request->file('file'));

        return back()->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Importation réussie !',
            ],
        ]);
    }

    public function importGeneral(Request $request)
    {
        /** @var User $user */
        $user = auth()->user();
        if (!$user->hasPermissionTo('import_inscriptions')) {
            abort(403, 'Action non autorisée');
        }

        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv',
        ]);

        $academicYear = AcademicYear::latest()->first();

        if (!$academicYear) {
            return response()->json([
                'error' => 'Aucune année académique trouvée.'
            ], 404);
        }

        set_time_limit(0);
        ini_set('memory_limit', '-1');

        try {
            Excel::import(new GeneralStudentsImport($academicYear->id), $request->file('file'));

            return response()->json([
                'message' => 'Importation terminée avec succès.'
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Import Sync Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erreur lors de l\'importation: ' . $e->getMessage()
            ], 500);
        }
    }

    public function checkImportProgress($id)
    {
        $status = Cache::get("import_progress_{$id}");

        if (!$status) {
            return response()->json(['status' => 'not_found'], 404);
        }

        return response()->json($status);
    }

    private function createStudentUser(StoreInscriptionRequest $request)
    {
        $password = Hash::make('12345678');
        $email = $this->generateStudentEmail($request->name, $request->institution_id);

        $user = User::create([
            'name' => $request->name,
            'email' => $email,
            'password' => $password,
            'is_active' => true,
        ]);

        $user->assignRole('Etudiant');
        $user->institutions()->attach($request->institution_id);

        return $user;
    }

    private function generateStudentEmail(string $name, int $institutionId): string
    {
        $institution = Institution::find($institutionId);
        $baseEmail = Str::slug($name) . '@' . Str::slug($institution->name) . '.edu';

        // Vérification de l'unicité
        $counter = 1;
        $email = $baseEmail;

        while (User::where('email', $email)->exists()) {
            $email = Str::slug($name) . $counter . '@' . Str::slug($institution->name) . '.edu';
            $counter++;
        }

        return strtolower($email);
    }

    private function getFlashMessages()
    {
        return session('flash') ? [
            'message' => session('flash')['message'] ?? null,
            'type' => session('flash')['type'] ?? null,
            'equivalences' => session('flash')['equivalences'] ?? null,
            'stats' => session('flash')['stats'] ?? null,
        ] : null;
    }

    /**
     * Vérifie les équivalences de cours entre deux institutions
     *
     * @param int $oldInstitutionId
     * @param int $oldPromotionId
     * @param int $newInstitutionId
     * @param int $newPromotionId
     * @return array
     */
    private function checkCourseEquivalence($oldInstitutionId, $oldPromotionId, $newInstitutionId, $newPromotionId)
    {
        // Récupérer les détails des cours pour les deux promotions avec les relations nécessaires
        // On ajoute promotion.faculty pour avoir un fallback si le programme est manquant
        $oldCourses = CourseProgramDetail::with(['course', 'program', 'promotion.faculty'])
            ->where('promotion_id', $oldPromotionId)
            ->get();

        $newCourses = CourseProgramDetail::with(['course', 'program', 'promotion.faculty'])
            ->where('promotion_id', $newPromotionId)
            ->get();

        if ($oldCourses->isEmpty() || $newCourses->isEmpty()) {
            return [
                'equivalences' => [],
                'stats' => [
                    'total_source' => $oldCourses->count(),
                    'total_target' => $newCourses->count(),
                    'matched_count' => 0,
                    'adaptation_percentage' => 0
                ]
            ];
        }

        $equivalences = [];
        $matchedCourseIds = [];
        $totalTargetCourses = $newCourses->count();

        foreach ($oldCourses as $oldDetail) {
            $oldVolume = $oldDetail->cm + $oldDetail->td + $oldDetail->tp;
            $oldCredits = $oldDetail->credits > 0 ? $oldDetail->credits : ($oldVolume / 15);

            $oldNameRaw = $oldDetail->course->title ?? 'Cours Inconnu';
            $oldNameNormalized = $this->normalizeString($oldNameRaw);

            // Système de fallback robuste pour le nom du programme
            $oldProgramName = $oldDetail->program->title
                ?? $oldDetail->promotion->faculty->name
                ?? $oldDetail->promotion->title
                ?? 'N/A';

            foreach ($newCourses as $newDetail) {
                // Éviter les doublons de correspondance dans la cible
                if (in_array($newDetail->id, $matchedCourseIds)) continue;

                $newNameRaw = $newDetail->course->title ?? 'Cours Inconnu';
                $newNameNormalized = $this->normalizeString($newNameRaw);

                // Système de fallback robuste pour le nom du programme
                $newProgramName = $newDetail->program->title
                    ?? $newDetail->promotion->faculty->name
                    ?? $newDetail->promotion->title
                    ?? 'N/A';

                // Algorithme de similarité
                $similarity = 0;
                similar_text($oldNameNormalized, $newNameNormalized, $similarity);

                // Seuil de correspondance de 80%
                if ($similarity >= 80) {
                    $newVolume = $newDetail->cm + $newDetail->td + $newDetail->tp;
                    $newCredits = $newDetail->credits > 0 ? $newDetail->credits : ($newVolume / 15);

                    $equivalences[] = [
                        'old_course' => $oldNameRaw,
                        'old_program' => $oldProgramName,
                        'old_volume' => $oldVolume,
                        'old_credits' => round($oldCredits, 2),
                        'new_course' => $newNameRaw,
                        'new_program' => $newProgramName,
                        'new_volume' => $newVolume,
                        'new_credits' => round($newCredits, 2),
                        'match_percentage' => round($similarity, 2)
                    ];

                    $matchedCourseIds[] = $newDetail->id;
                    break;
                }
            }
        }

        // Calcul du score d'adaptation global
        $matchedCount = count($equivalences);
        $adaptationPercentage = ($totalTargetCourses > 0)
            ? round(($matchedCount / $totalTargetCourses) * 100, 2)
            : 0;

        return [
            'equivalences' => $equivalences,
            'stats' => [
                'total_source' => $oldCourses->count(),
                'total_target' => $totalTargetCourses,
                'matched_count' => $matchedCount,
                'adaptation_percentage' => $adaptationPercentage
            ]
        ];
    }

    private function normalizeString($string)
    {
        if (empty($string)) return '';

        // Conversion en minuscules
        $string = mb_strtolower($string, 'UTF-8');

        // Suppression des accents
        if (class_exists('Transliterator')) {
            $transliterator = \Transliterator::create('Any-Latin; Latin-ASCII');
            if ($transliterator) {
                $string = $transliterator->transliterate($string);
            }
        } else {
            // Fallback si l'extension intl n'est pas dispo
            $search = ['à', 'á', 'â', 'ã', 'ä', 'å', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï', 'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', 'ø', 'ù', 'ú', 'û', 'ü', 'ý', 'ÿ'];
            $replace = ['a', 'a', 'a', 'a', 'a', 'a', 'c', 'e', 'e', 'e', 'e', 'i', 'i', 'i', 'i', 'n', 'o', 'o', 'o', 'o', 'o', 'o', 'u', 'u', 'u', 'u', 'y', 'y'];
            $string = str_replace($search, $replace, $string);
        }

        // Suppression de la ponctuation et des caractères spéciaux
        $string = preg_replace('/[^\w\s]/u', ' ', $string);

        // Suppression des espaces multiples et trim
        $string = preg_replace('/\s+/', ' ', $string);
        $string = trim($string);

        return $string;
    }
}
