<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Modules\Institution\Entities\Assignment;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Http\Requests\BulkAssignmentRequest;
use Modules\Institution\Http\Requests\StoreAssignmentRequest;
use Modules\Institution\Http\Requests\UpdateAssignmentRequest;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Collection;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\CourseProgramDetail;
use Modules\Institution\Entities\Promotion;
use Modules\Teacher\Entities\Teacher;
use App\Services\InfoBipService;
use App\Services\TwilioService;
use App\Services\VonageService;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\AssignmentsExport;
use App\Imports\AssignmentsImport;

class AssignmentController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('access_assignments')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();
        $user->load('permissions', 'roles.permissions');

        // Gestion des permissions
        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_assignments',
            'edit' => 'edit_assignments',
            'delete' => 'delete_assignments',
            'access' => 'access_assignments',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        // Construction de la requête avec filtres
        $query = Assignment::with([
            'holder',
            'collaborator',
            'course.courseProgramDetails.semestre',
            'course.courseProgramDetails.promotion',
            'academicYear',
            'institution',
            'promotion'
        ]);

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereIn('institution_id', $institutionIds);
        }

        // Filtrage par année académique (avec conversion numérique)
        if ($request->has('academic_year') && $request->academic_year) {
            $query->where('academic_year_id', (int)$request->academic_year);
        }

        // Filtrage par recherche texte
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->whereHas('holder', function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', "%$searchTerm%");
                })
                    ->orWhereHas('collaborator', function ($q) use ($searchTerm) {
                        $q->where('name', 'LIKE', "%$searchTerm%");
                    })
                    ->orWhereHas('course', function ($q) use ($searchTerm) {
                        $q->where('title', 'LIKE', "%$searchTerm%");
                    })
                    ->orWhereHas('institution', function ($q) use ($searchTerm) {
                        $q->where('name', 'LIKE', "%$searchTerm%");
                    })
                    ->orWhereHas('promotion', function ($q) use ($searchTerm) {
                        $q->where('title', 'LIKE', "%$searchTerm%");
                    });
            });
        }

        $assignments = $query->orderByDesc('id')->get();

        // Formatage des données pour Inertia
        $formattedAssignments = $assignments->map(function ($assignment) {
            // Valeurs par défaut
            $promotion = $assignment->promotion?->title ?? 'Promotion inconnue';
            $semester = 'Non défini';
            $cm = $td = $tp = $credits = 0;

            // Récupération des détails du cours
            if ($assignment->course && $assignment->course->courseProgramDetails->isNotEmpty()) {
                $details = $assignment->course->courseProgramDetails->first();
                $semester = $details->semestre->title ?? 'Non défini';
                $cm = $details->cm ?? 0;
                $td = $details->td ?? 0;
                $tp = $details->tp ?? 0;
                $credits = $details->credits ?? 0;
            }

            return [
                'id' => $assignment->id,
                'promotion' => $promotion,
                'course' => $assignment->course?->title ?? 'Cours inconnu',
                'semester' => $semester,
                'cm' => $cm,
                'tp' => $tp,
                'td' => $td,
                'credits' => $credits,
                'holder' => $assignment->holder?->name ?? 'Non assigné',
                'collaborator' => $assignment->collaborator?->name ?? 'Aucun',
                // Conserver les autres champs nécessaires pour les actions
                'holder_id' => $assignment->holder_id,
                'collaborator_id' => $assignment->collaborator_id,
                'course_id' => $assignment->course_id,
                'academic_year_id' => $assignment->academic_year_id,
                'academic_year' => $assignment->academicYear?->title ?? 'Année non définie',
                'observation' => $assignment->observation,
                'institution' => $assignment->institution?->name ?? 'Institution inconnue',
            ];
        });

        // Récupération des institutions basée sur le rôle
        $institutions = $this->getUserInstitutions($user);

        // Formatage avec alias cohérents
        $institutionId = $this->getUserInstitutionId();

        $formattedCourses = Course::whereHas('courseProgramDetails.program', function ($query) use ($institutionId) {
            $query->where('institution_id', $institutionId);
        })
            ->with('promotions')
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'name' => $course->title ?? $course->name,
                    'details' => $course->details,
                    'promotions' => $course->promotions->map(function ($promotion) {
                        return [
                            'id' => $promotion->id,
                            'name' => $promotion->title
                        ];
                    })->values()
                ];
            });



        $formattedAcademicYears = AcademicYear::all(['id', 'title'])->map(function ($year) {
            return ['id' => $year->id, 'name' => $year->title];
        });

        return Inertia::render('assignment/index', [
            'assignments' => $formattedAssignments,
            'can' => $can,
            'filters' => $request->only(['search', 'academic_year']),
            'institutions' => $institutions,
            'teachers' => Teacher::all(['id', 'name']),
            'courses' => $formattedCourses,
            'academic_years' => $formattedAcademicYears,
        ]);
    }

    // Helper pour récupérer les institutions
    private function getUserInstitutions($user)
    {
        if ($user->hasRole('Super Admin')) {
            return Institution::all(['id', 'name']);
        }

        return $user->institutions()->get(['id', 'name']);
    }

    public function store(BulkAssignmentRequest $request)
    {
        \Log::info('Assignment Store Request Data:', $request->all());

        if (!auth()->user()->hasPermissionTo('edit_assignments')) {
            abort(403, 'Action non autorisée');
        }

        $newAssignments = [];
        // Récupérer les données validées
        $validated = $request->validated();

        \Log::info('Assignment Store Validated Data:', $validated);

        // Vérifier si nous avons un tableau d'assignations
        $assignmentsData = $validated['assignments'] ?? [];

        // Si vide, on essaie de voir si c'est une requête à plat qui a passé la validation (ce qui ne devrait pas arriver avec BulkRequest mais par sécurité)
        if (empty($assignmentsData) && !empty($validated)) {
            // Si validated ne contient pas 'assignments' mais contient d'autres clés, c'est peut-être un payload plat
            // Mais attention, $validated ne contient QUE ce qui est dans les règles. 
            // Si les règles sont nested, $validated ne contiendra rien si pas nested.
            // On fallback sur request only si nécessaire, mais c'est risqué.
            // Pour l'instant, on suppose que le frontend envoie toujours 'assignments'.
            if (isset($request->course_id)) {
                $assignmentsData = [$request->all()];
            }
        }

        $results = ['created' => 0, 'updated' => 0];

        foreach ($assignmentsData as $data) {
            // Conversion des types
            $data['institution_id'] = $this->getUserInstitutionId();
            $data['academic_year_id'] = (int)$data['academic_year_id'];
            $data['course_id'] = (int)$data['course_id'];
            $data['holder_id'] = (int)$data['holder_id'];
            // Protection contre la clé manquante
            $data['promotion_id'] = isset($data['promotion_id']) ? (int)$data['promotion_id'] : null;

            // Gestion du collaborator_id
            $data['collaborator_id'] = ($data['collaborator_id'] && $data['collaborator_id'] !== 'none')
                ? (int)$data['collaborator_id']
                : null;

            if (isset($data['id']) && $data['id']) {
                $assignment = Assignment::find($data['id']);
                if ($assignment) {
                    $assignment->update($data);
                    $results['updated']++;
                }
            } else {
                $assignment = Assignment::create($data);
                $newAssignments[] = $assignment;
                $results['created']++;
            }
        }

        $message = sprintf(
            "Opération réussie : %d créations, %d mises à jour",
            $results['created'],
            $results['updated']
        );

        $this->sendAssignmentNotifications($newAssignments);

        return redirect()->route('assignments.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => $message,
            ],
        ]);
    }

    // Helper pour obtenir l'ID d'institution
    private function getUserInstitutionId()
    {
        $user = auth()->user();

        if ($user->hasRole('Super Admin')) {
            // Logique pour Super Admin (peut-être null ou première institution)
            return Institution::first()->id ?? null;
        }

        return $user->institutions()->first()->id ?? null;
    }

    public function update(UpdateAssignmentRequest $request, Assignment $assignment)
    {
        if (!auth()->user()->hasPermissionTo('edit_assignments')) {
            abort(403, 'Action non autorisée');
        }

        $assignment->update($request->validated());

        return redirect()->route('assignments.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => 'Attribution mise à jour avec succès !',
            ],
        ]);
    }

    public function destroy(Assignment $assignment)
    {
        if (!auth()->user()->hasPermissionTo('delete_assignments')) {
            abort(403, 'Action non autorisée');
        }

        $assignment->delete();

        return redirect()->route('assignments.index')->with([
            'flash' => [
                'type' => 'warning',
                'message' => 'Attribution supprimée avec succès !',
            ],
        ]);
    }

    public function storeBulk(BulkAssignmentRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('edit_assignments')) {
            abort(403, 'Action non autorisée');
        }

        $validated = $request->validated();
        $assignmentsData = $validated['assignments'];
        $created = 0;
        $newAssignments = [];

        foreach ($assignmentsData as $data) {
            // Conversion des types
            $data['institution_id'] = $this->getUserInstitutionId();
            $data['academic_year_id'] = (int)$data['academic_year_id'];
            $data['course_id'] = (int)$data['course_id'];
            $data['holder_id'] = (int)$data['holder_id'];
            $data['promotion_id'] = (int)$data['promotion_id'];

            // Gestion du collaborator_id
            $data['collaborator_id'] = ($data['collaborator_id'] && $data['collaborator_id'] !== 'none')
                ? (int)$data['collaborator_id']
                : null;

            $assignment = Assignment::create($data);
            $newAssignments[] = $assignment;
            $created++;
        }

        $this->sendAssignmentNotifications($newAssignments);

        return redirect()->back()->with([
            'flash' => [
                'type' => 'success',
                'message' => "{$created} attributions créées avec succès"
            ]
        ]);
    }

    public function export(Request $request)
    {
        try {
            // Construction de la requête avec relations nécessaires
            $query = Assignment::query()->with([
                'course' => function ($query) {
                    $query->with(['courseProgramDetails.promotion', 'courseProgramDetails.semestre']);
                },
                'holder',
                'collaborator'
            ]);

            // Appliquer les filtres
            if ($request->has('academic_year') && $request->academic_year) {
                $query->where('academic_year_id', (int)$request->academic_year);
            }

            if ($request->has('search') && $request->search) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->whereHas('holder', function ($q) use ($searchTerm) {
                        $q->where('name', 'LIKE', "%$searchTerm%");
                    })
                        ->orWhereHas('collaborator', function ($q) use ($searchTerm) {
                            $q->where('name', 'LIKE', "%$searchTerm%");
                        })
                        ->orWhereHas('course', function ($q) use ($searchTerm) {
                            $q->where('title', 'LIKE', "%$searchTerm%");
                        });
                });
            }

            // Exécuter la requête
            $assignments = $query->get();

            // Vérifier si des données existent
            if ($assignments->isEmpty()) {
                return back()->with([
                    'flash' => [
                        'type' => 'warning',
                        'message' => 'Aucune donnée à exporter'
                    ]
                ]);
            }


            $fileName = 'etudiants_' . '_' . now()->format('Ymd_His') . '.xlsx';

            // Exporter les données
            return Excel::download(
                new AssignmentsExport($assignments),
                $fileName
            );
        } catch (\Exception $e) {
            // Journaliser l'erreur complète
            Log::error("Export error: " . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Échec de l\'exportation: ' . $e->getMessage()
                ]
            ]);
        }
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv'
        ]);

        Excel::import(new AssignmentsImport, $request->file('file'));

        return back()->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Attributions importées avec succès'
            ]
        ]);
    }

    private function sendAssignmentNotifications(array $assignments)
    {
        if (empty($assignments)) return;

        // Charger les relations nécessaires
        foreach ($assignments as $assignment) {
            $assignment->load([
                'holder:id,phone,email,name',
                'course:id,title',
                'academicYear:id,title'
            ]);
        }

        $twilioService = new TwilioService();

        foreach ($assignments as $assignment) {
            $teacher = $assignment->holder;
            if (!$teacher || !$teacher->phone) continue;

            try {
                $message = $this->generateAssignmentMessage($assignment, $teacher);
                $twilioService->sendTwilioSms($teacher->phone, $message);
            } catch (\Exception $e) {
                Log::error("Erreur envoi SMS à {$teacher->phone}: " . $e->getMessage());
            }
        }
    }

    private function generateAssignmentMessage(Assignment $assignment, Teacher $teacher): string
    {
        $course = $assignment->course?->title ?? 'Cours inconnu';
        $year = $assignment->academicYear?->title ?? 'Année inconnue';

        $institution = $assignment->institution;

        // Récupération de l'email institutionnel
        $email = Str::slug($teacher->name)
            . Str::slug($institution->name)
            . '@esudelib.com';

        return "BONJOUR {$teacher->name}, "
            . "VOUS AVEZ ETE ASSIGNE AU COURS : $course "
            . "POUR L'ANNEE ACADEMIQUE $year. "
            . "VOTRE EMAIL DE CONNEXION : $email";
    }

    public function autoAssign(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('edit_assignments')) {
            abort(403, 'Action non autorisée');
        }

        $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id'
        ]);

        $academicYearId = (int)$request->academic_year_id;
        $institutionId = $this->getUserInstitutionId();

        // SUPPRESSION des assignations existantes pour cette année et cette institution
        Assignment::where('academic_year_id', $academicYearId)
            ->where('institution_id', $institutionId)
            ->delete();

        $count = 0;

        // 1. Charger les enseignants avec leur spécialité et leur charge actuelle
        // On initialise la charge à 0 car on vient de tout supprimer (pour cette année)
        $allTeachers = Teacher::whereNotNull('specialty')
            ->get()
            ->map(function ($teacher) {
                $teacher->current_load = 0;
                return $teacher;
            });

        // 2. Récupérer les cours à attribuer
        $programDetails = CourseProgramDetail::with(['course', 'promotion.faculty'])
            ->whereHas('promotion', function ($q) use ($institutionId) {
                $q->where('institution_id', $institutionId);
            })
            ->get();

        foreach ($programDetails as $detail) {
            $faculty = $detail->promotion->faculty;
            if (!$faculty) continue;

            // 3. Trouver les candidats éligibles
            $candidates = $allTeachers->filter(function ($teacher) use ($faculty) {
                return stripos($teacher->specialty, $faculty->title) !== false
                    || stripos($faculty->title, $teacher->specialty) !== false;
            });

            if ($candidates->count() < 1) continue;

            // 4. Sélectionner les candidats avec la charge la plus faible
            // On trie par charge croissante
            $sortedCandidates = $candidates->sortBy('current_load')->values();

            $holder = $sortedCandidates[0];
            $collaborator = $sortedCandidates->count() > 1 ? $sortedCandidates[1] : null;

            // 5. Créer l'assignation
            Assignment::create([
                'holder_id' => $holder->id,
                'collaborator_id' => $collaborator ? $collaborator->id : null,
                'course_id' => $detail->course_id,
                'academic_year_id' => $academicYearId,
                'institution_id' => $institutionId,
                'promotion_id' => $detail->promotion_id,
                'observation' => 'Attribution automatique'
            ]);

            // 6. Incrémenter la charge locale
            // On met à jour la référence dans la collection $allTeachers
            // (Comme ce sont des objets, la modification se répercute si on a la même référence, 
            // mais filter() créé une nouvelle collection. Cependant, les éléments sont les mêmes instances d'objets)

            $holder->current_load++;
            if ($collaborator) {
                $collaborator->current_load++;
            }

            $count++;
        }

        return back()->with([
            'flash' => [
                'type' => 'success',
                'message' => "Réinitialisation et attribution terminées : $count cours attribués."
            ]
        ]);
    }
}
