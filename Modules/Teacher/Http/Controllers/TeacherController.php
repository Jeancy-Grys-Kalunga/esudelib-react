<?php

namespace Modules\Teacher\Http\Controllers;

use App\Exports\CourseStudentsExport;
use App\Http\Controllers\Controller;
use App\Imports\GradesImport;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\ExamSession;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Promotion;
use Modules\Student\Entities\Appeal;
use Modules\Teacher\Entities\Teacher;
use Modules\Teacher\Http\Requests\StoreTeacherRequest;
use Modules\Teacher\Http\Requests\UpdateTeacherRequest;
use Spatie\Permission\Models\Permission;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
        if (! auth()->user()->hasPermissionTo('access_teachers')) {
            abort(403, 'Action non autorisée');
        }

        $user = auth()->user();
        $user->load('permissions', 'roles.permissions');

        // Gestion des permissions
        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_teachers',
            'edit'   => 'edit_teachers',
            'delete' => 'delete_teachers',
            'access' => 'access_teachers',
            'import' => 'create_teachers',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        // Construction de la requête
        $query = Teacher::with('institutions')
            ->orderByDesc('id');

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereHas('institutions', fn($q) => $q->whereIn('id', $institutionIds));
        }

        $institutions = $user->hasRole('Secrétaire Académique')
            ? $user->institutions()->pluck('id')
            : Institution::pluck('id');

        // Formatage des données pour Inertia
        $teachers = $query->get()->map(function ($teacher) {
            return [
                'id'             => $teacher->id,
                'matricule'      => $teacher->matricule,
                'name'           => $teacher->name,
                'gendre'         => $teacher->gendre,
                'date_of_birth'  => $teacher->date_of_birth,
                'grade'          => $teacher->grade,
                'academic_level' => $teacher->academic_level,
                'date_of_hire'   => $teacher->date_of_hire,
                'specialty'      => $teacher->specialty,
                'address'        => $teacher->address,
                'phone'          => $teacher->phone,
                'institutions'   => $teacher->institutions->map(fn($i) => $i->name),
                'created_at'     => $teacher->created_at->translatedFormat('d F Y'),
                'documents'      => $teacher->getMedia('images')->map(fn($media) => [
                    'url'   => $media->getUrl(),
                    'thumb' => $media->getUrl('thumb'),
                ]),
            ];
        });

        return Inertia::render('teacher/index', [
            'teachers'     => $teachers,
            'can'          => $can,
            'filters'      => $request->only(['search']),
            'flash'        => $this->getFlashMessages(),
            'institutions' => Institution::whereIn('id', $institutions)->get(['id', 'name']),
        ]);
    }

    public function create()
    {
        $user = auth()->user();

        $institutions = Institution::when(
            $user->hasRole('Secrétaire Académique'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        return Inertia::render('teacher::teachers/Form', [
            'teacher'      => new Teacher(),
            'institutions' => $institutions,
            'documentUrls' => [],
        ]);
    }


    public function store(StoreTeacherRequest $request)
    {
        if (! auth()->user()->hasPermissionTo('create_teachers')) {
            abort(403, 'Action non autorisée');
        }

        $teacher = Teacher::create($request->except('document', 'institutions'));
        $teacher->institutions()->sync($request->institutions);

        // Création des utilisateurs et récupération du premier ID
        $firstUserId = $this->handleUserCreation($teacher, $request->institutions);

        // Mise à jour du teacher avec le user_id
        if ($firstUserId) {
            $teacher->update(['user_id' => $firstUserId]);
        }

        $this->handleMediaUpload($teacher, $request->document);

        return redirect()->route('teachers.index')->with([
            'flash' => [
                'type'    => 'success',
                'message' => 'Enseignant enregistré avec succès !',
            ],
        ]);
    }

    public function import(Request $request)
    {
        if (! auth()->user()->hasPermissionTo('create_teachers')) {
            abort(403, 'Action non autorisée');
        }

        $request->validate([
            'file' => 'required|mimes:xlsx,xls',
            'institution_id' => 'required|exists:institutions,id',
        ]);

        try {
            Excel::import(new \App\Imports\TeacherImport($request->institution_id), $request->file('file'));

            $summary = session('import_summary') ?? '';

            return redirect()->back()->with([
                'flash' => [
                    'type'    => 'success',
                    'message' => 'Importation terminée. ' . $summary,
                ],
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with([
                'flash' => [
                    'type'    => 'error',
                    'message' => 'Erreur lors de l\'importation : ' . $e->getMessage(),
                ],
            ]);
        }
    }


    public function edit(Teacher $teacher)
    {
        $user = auth()->user();

        $institutions = Institution::when(
            $user->hasRole('Secrétaire Académique'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        return Inertia::render('teachers.index', [
            'teacher'      => $teacher->load('institutions'),
            'institutions' => $institutions,
            'documentUrls' => $teacher->getMedia('images')->map(fn($m) => [
                'name' => $m->file_name,
                'url'  => $m->getUrl(),
            ]),
        ]);
    }

    public function update(UpdateTeacherRequest $request, Teacher $teacher)
    {
        if (! auth()->user()->hasPermissionTo('edit_teachers')) {
            abort(403, 'Action non autorisée');
        }

        $teacher->update($request->except('document', 'institutions'));
        $this->syncInstitutions($teacher, $request->institutions);
        $this->handleMediaUpload($teacher, $request->document);

        // Mise à jour du nom pour tous les utilisateurs associés
        foreach ($teacher->institutions as $institution) {
            $email = Str::slug($teacher->name) . Str::slug($institution->name) . '@esudelib.com';
            $user  = User::where('email', $email)->first();
            if ($user) {
                $user->update(['name' => $teacher->name]);
            }
        }

        // Synchroniser le user_id principal si nécessaire
        if (!$teacher->user_id && $teacher->institutions->isNotEmpty()) {
            $firstInstitution = $teacher->institutions->first();
            $email = Str::slug($teacher->name) . Str::slug($firstInstitution->name) . '@esudelib.com';
            $user = User::where('email', $email)->first();

            if ($user) {
                $teacher->update(['user_id' => $user->id]);
            }
        }


        return redirect()->route('teachers.index')->with([
            'flash' => [
                'type'    => 'info',
                'message' => 'Enseignant modifié avec succès !',
            ],
        ]);
    }

    public function destroy(Teacher $teacher)
    {
        if (! auth()->user()->hasPermissionTo('delete_teachers')) {
            abort(403, 'Action non autorisée');
        }

        $teacher->delete();

        return redirect()->route('teachers.index')->with([
            'flash' => [
                'type'    => 'warning',
                'message' => 'Enseignant supprimé avec succès !',
            ],
        ]);
    }

    /**
     * Affiche la liste des cours attribués à l'enseignant
     */
    public function courses(Request $request)
    {
        $user = auth()->user();

        // Charge la relation teacher pour éviter le lazy loading
        $user->load('teacher');

        // Vérifier si l'utilisateur a un enseignant associé
        if (!$user->teacher) {
            abort(403, "Vous n'êtes pas associé à un enseignant");
        }

        // Récupérer tous les cours assignés à l'enseignant
        $assignedCourseIds = $user->teacher->courses()->pluck('courses.id');

        // Récupérer les détails des cours avec eager loading
        $courses = Course::with(['courseProgramDetails.program', 'courseProgramDetails.category'])
            ->whereIn('id', $assignedCourseIds)
            ->get()
            ->map(function ($course) {
                // Utiliser la méthode helper pour trouver la bonne promotion assignée
                $promotion = $this->getAssignedPromotion($course);

                // Trouver le détail du programme correspondant à cette promotion
                $detail = null;
                if ($promotion) {
                    $detail = $course->courseProgramDetails->where('promotion_id', $promotion->id)->first();
                }

                // Si on ne trouve pas (fallback), on prend le premier (comportement existant au cas où)
                if (!$detail) {
                    $detail = $course->courseProgramDetails->first();
                }

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'cm' => $detail ? $detail->cm : 0,
                    'td' => $detail ? $detail->td : 0,
                    'tp' => $detail ? $detail->tp : 0,
                    'credits' => $detail ? $detail->credits : 0,
                    'program' => $detail && $detail->program ? $detail->program->name : 'Non défini',
                    'category_name' => $detail && $detail->category ? $detail->category->name : 'Non défini',
                    'promotion' => $promotion ? $promotion->title : ($detail && $detail->promotion ? $detail->promotion->title : 'Non défini'),
                    'student_count' => $course->students()->count(),
                    'appeals_count' => $course->appeals()->count(),
                ];
            });

        return Inertia::render('teacher/courses', [
            'courses' => $courses,
        ]);
    }

    public function exportStudents(Course $course)
    {
        if (!$this->isTeacherAssignedToCourse($course)) {
            abort(403, 'Action non autorisée');
        }

        $fileName = 'etudiants_' . Str::slug($course->title) . '_' . now()->format('Ymd_His') . '.xlsx';

        try {
            return Excel::download(
                new CourseStudentsExport($course),
                $fileName
            );
        } catch (\Throwable $e) {
            \Log::error('Erreur export étudiants : ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'error' => 'Échec de l\'exportation des étudiants. Veuillez réessayer.',
            ], 500);
        }
    }

    public function showSubmitForm(Course $course)
    {
        if (!$this->isTeacherAssignedToCourse($course)) {
            abort(403, 'Action non autorisée');
        }

        $institutionId = auth()->user()->teacher->institutions()->first()->id;
        $promotion = $this->getAssignedPromotion($course);

        return Inertia::render('teacher/submitGrades', [
            'course' => $course->only('id', 'title'),
            'academicYears' => AcademicYear::all(['id', 'title']),
            'promotions' => $promotion ? [['id' => $promotion->id, 'title' => $promotion->title]] : [],
            'examSessions' => ExamSession::where('institution_id', $institutionId)
                ->get(['id', 'title', 'status', 'acceptance_rate']),
        ]);
    }

    public function submitGrades(Request $request, Course $course)
    {
        if (!$this->isTeacherAssignedToCourse($course)) {
            abort(403, 'Action non autorisée');
        }

        $request->validate([
            'grades_file' => 'required|mimes:xlsx,xls',
            'promotion_id' => 'required|exists:promotions,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'exam_session_id' => 'required|exists:exam_sessions,id',
        ]);

        $academicYear = AcademicYear::find($request->academic_year_id);
        $promotion = Promotion::find($request->promotion_id);
        $examSession = ExamSession::find($request->exam_session_id);

        // Vérifier si la session est ouverte
        if ($examSession->status !== 'open') {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'La session d\'examen est fermée. Vous ne pouvez pas soumettre de notes.',
                ],
            ]);
        }

        Excel::import(
            new GradesImport($course, $promotion, $academicYear, $request->session, $examSession->id),
            $request->file('grades_file')
        );

        $successRate = $this->calculateSuccessRate($course);

        // Vérifier le taux de réussite
        if ($successRate < $examSession->acceptance_rate) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => "Le taux de réussite ($successRate%) est inférieur au minimum requis ({$examSession->acceptance_rate}%).",
                ],
            ]);
        }

        return redirect()->route('teacher.courses')->with([
            'flash' => [
                'type' => $successRate >= $examSession->acceptance_rate ? 'success' : 'warning',
                'message' => $successRate >= $examSession->acceptance_rate
                    ? 'Cotation soumise avec succès et acceptée par le jury'
                    : 'Cotation soumise mais taux de réussite insuffisant (' . $successRate . '%)',
            ],
        ]);
    }

    public function appeals(Course $course)
    {
        if (!$this->isTeacherAssignedToCourse($course)) {
            abort(403, 'Action non autorisée');
        }

        $appeals = Appeal::where('course_id', $course->id)
            ->with(['student:id,name,matricule', 'appealDocuments'])
            ->get()
            ->map(function ($appeal) {
                return [
                    'id' => $appeal->id,
                    'object' => json_decode($appeal->objects),
                    'status' => $appeal->status,
                    'created_at' => $appeal->created_at->format('d/m/Y'),
                    'student' => $appeal->student->name,
                    'matricule' => $appeal->student->matricule,
                    'documents' => $appeal->appealDocuments->map(fn($doc) => [
                        'name' => $doc->name,
                        'url' => Storage::url($doc->path),
                    ]),
                ];
            });

        // ✅ Résolution correcte du service
        app(\App\Services\NotificationService::class)->markAsReadForCourseAppeals($course->id);

        return Inertia::render('teacher/appeals', [
            'appeals' => $appeals,
            'course' => $course->only('id', 'title'),
        ]);
    }

    /**
     * Affiche l'éditeur en ligne pour un cours
     */
    public function showOnlineEditor(Course $course, Request $request)
    {
        if (!$this->isTeacherAssignedToCourse($course)) {
            abort(403, 'Action non autorisée');
        }

        $institutionId = auth()->user()->teacher->institutions()->first()->id;

        // Récupérer la promotion associée au cours (via l'assignation de l'enseignant)
        $promotion = $this->getAssignedPromotion($course);

        return Inertia::render('teacher/online-editor', [
            'course' => $course->only('id', 'title', 'code'),
            'academicYears' => AcademicYear::all(['id', 'title']),
            'promotion' => $promotion ? ['id' => $promotion->id, 'title' => $promotion->title] : null,
            'examSessions' => ExamSession::where('institution_id', $institutionId)
                ->get(['id', 'title', 'status', 'acceptance_rate']),
        ]);
    }

    /**
     * API pour récupérer les étudiants avec leurs notes pour l'éditeur en ligne
     */
    public function getOnlineEditorData(Course $course, Request $request)
    {
        if (!$this->isTeacherAssignedToCourse($course)) {
            return response()->json(['error' => 'Action non autorisée'], 403);
        }

        // Validation des paramètres
        $validator = Validator::make($request->all(), [
            'academic_year_id' => 'required|exists:academic_years,id',
            'exam_session_id' => 'required|exists:exam_sessions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Paramètres invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        // Récupérer la promotion du cours
        $promotion = $this->getAssignedPromotion($course);
        if (!$promotion) {
            return response()->json(['error' => 'Ce cours n\'est associé à aucune promotion.'], 404);
        }
        $promotionId = $promotion->id;

        $academicYearId = $request->input('academic_year_id');
        $examSessionId = $request->input('exam_session_id');

        // Récupération des étudiants avec leurs notes
        $students = $course->students()
            ->with(['notes' => function ($query) use ($course, $academicYearId, $promotionId, $examSessionId) {
                $query->where('course_id', $course->id)
                    ->where('academic_year_id', $academicYearId)
                    ->where('promotion_id', $promotionId)
                    ->where('exam_session_id', $examSessionId);
            }])
            ->get()
            ->map(function ($student) {
                $note = $student->notes->first();
                return [
                    'uid' => (string) $student->id,
                    'id' => $student->id,
                    'matricule' => $student->matricule,
                    'name' => $student->name,
                    'cote' => $note->cote ?? null,
                    'observation' => $note->observation ?? null,
                    'situation' => $note->situation ?? null,
                    'participation' => $note->participation ?? null,
                ];
            });

        return response()->json([
            'students' => $students,
        ]);
    }

    public function saveGrades(Request $request, Course $course)
    {
        if (!$this->isTeacherAssignedToCourse($course)) {
            abort(403, 'Action non autorisée');
        }

        // Récupérer la promotion du cours
        $promotion = $this->getAssignedPromotion($course);
        if (!$promotion) {
            return response()->json(['error' => 'Ce cours n\'est associé à aucune promotion.'], 404);
        }
        $promotionId = $promotion->id;

        // Validation des données
        $validator = Validator::make($request->all(), [
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.cote' => 'nullable|numeric|min:0|max:20',
            'grades.*.observation' => 'nullable|string|max:255',
            'grades.*.situation' => 'nullable|string|max:50',
            'grades.*.participation' => 'nullable|string|max:50',
            'academic_year_id' => 'required|exists:academic_years,id',
            'exam_session_id' => 'required|exists:exam_sessions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'type' => 'error',
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        $examSession = ExamSession::find($request->exam_session_id);

        // Vérifier si la session est ouverte
        if ($examSession->status !== 'open') {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'La session d\'examen est fermée. Vous ne pouvez pas soumettre de notes.'
                ],
            ]);
        }

        // Nouvelle logique: Vérification et mise à jour des notes existantes
        $successCount = 0;
        $totalStudents = count($request->grades);
        $hasGrades = false;
        $updatedStudents = [];

        foreach ($request->grades as $grade) {
            $studentId = $grade['student_id'];

            // Rechercher la promotion réelle de l'étudiant via son inscription
            $inscription = \Modules\RegistrationDesk\Entities\Inscription::where('student_id', $studentId)
                ->where('academic_year_id', $request->academic_year_id)
                ->first();

            $targetPromotionId = $inscription ? $inscription->promotion_id : $promotionId;

            $existingNote = DB::table('notes')
                ->where('course_id', $course->id)
                ->where('student_id', $studentId)
                ->where('academic_year_id', $request->academic_year_id)
                ->where('promotion_id', $targetPromotionId) // Utiliser la promotion correcte
                ->where('exam_session_id', $request->exam_session_id)
                ->first();

            $data = [
                'cote' => $grade['cote'] ?? null,
                'observation' => $grade['observation'] ?? '',
                'situation' => $grade['situation'] ?? '',
                'participation' => $grade['participation'] ?? '',
                'is_submitted' => true,
                'updated_at' => now(),
            ];

            if ($existingNote) {
                // Mise à jour si la note existe
                DB::table('notes')
                    ->where('id', $existingNote->id)
                    ->update($data);
            } else {
                // Création si nouvelle note
                DB::table('notes')->insert(array_merge([
                    'course_id' => $course->id,
                    'student_id' => $studentId,
                    'academic_year_id' => $request->academic_year_id,
                    'promotion_id' => $targetPromotionId, // Utiliser la promotion correcte
                    'exam_session_id' => $request->exam_session_id,
                    'created_at' => now(),
                ], $data));
            }

            // Calcul du taux de réussite
            if (isset($grade['cote']) && $grade['cote'] !== null) {
                $hasGrades = true;
                if ($grade['cote'] >= 10) $successCount++;
            }

            $updatedStudents[] = [
                'student_id' => $grade['student_id'],
                'cote' => $grade['cote'] ?? null,
                'observation' => $grade['observation'] ?? null,
                'situation' => $grade['situation'] ?? null,
                'participation' => $grade['participation'] ?? null,
            ];
        }

        $successRate = $hasGrades && $totalStudents > 0 ? ($successCount / $totalStudents) * 100 : 0;

        return response()->json([
            'type' => 'success',
            'message' => 'Notes sauvegardées avec succès',
            'students' => $updatedStudents
        ]);
    }

    /**
     * Vérifie si l'enseignant est assigné au cours
     */
    private function isTeacherAssignedToCourse(Course $course): bool
    {
        $user = auth()->user();

        // Charge la relation teacher si elle n'est pas déjà chargée
        if (!$user->relationLoaded('teacher')) {
            $user->load('teacher');
        }

        return $user->teacher && $user->teacher->courses()
            ->where('course_id', $course->id)
            ->exists();
    }

    /**
     * Calcule le taux de réussite pour un cours
     */
    private function calculateSuccessRate(Course $course): float
    {
        $students = $course->students()->with('notes')->get();
        $totalStudents = $students->count();
        $successCount = 0;

        foreach ($students as $student) {
            $note = $student->notes->firstWhere('course_id', $course->id);
            if ($note && $note->cote >= 10) {
                $successCount++;
            }
        }

        return $totalStudents > 0 ? round(($successCount / $totalStudents) * 100, 2) : 0;
    }

    private function handleUserCreation(Teacher $teacher, array $institutionIds)
    {
        $firstUserId = null;

        foreach ($institutionIds as $institutionId) {
            $institution = Institution::find($institutionId);
            $email = Str::slug($teacher->name) . Str::slug($institution->name) . '@esudelib.com';

            $user = User::create([
                'name'      => $teacher->name,
                'email'     => strtolower($email),
                'password'  => Hash::make(1234),
                'is_active' => true,
            ]);

            $user->assignRole('Enseignant');
            $user->institutions()->attach($institutionId);

            // Stocker le premier user_id créé
            if (is_null($firstUserId)) {
                $firstUserId = $user->id;
            }
        }

        return $firstUserId;
    }


    private function syncInstitutions(Teacher $teacher, array $newInstitutions)
    {
        $currentInstitutions = $teacher->institutions()->pluck('id');

        $added   = collect($newInstitutions)->diff($currentInstitutions);
        $removed = $currentInstitutions->diff($newInstitutions);

        $this->handleRemovedInstitutions($teacher, $removed);
        $this->handleAddedInstitutions($teacher, $added);
    }


    private function handleAddedInstitutions(Teacher $teacher, $added)
    {
        if ($added->isEmpty()) return;

        foreach ($added as $institutionId) {
            $institution = Institution::findOrFail($institutionId);
            $email = Str::slug($teacher->name) . Str::slug($institution->name) . '@esudelib.com';

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $teacher->name,
                    'password' => Hash::make(1234),
                    'is_active' => true,
                ]
            );

            $user->assignRole('Enseignant');
            $user->institutions()->attach($institutionId);
        }

        $teacher->institutions()->attach($added);
    }

    private function handleRemovedInstitutions(Teacher $teacher, $removed)
    {
        if ($removed->isEmpty()) return;

        foreach ($removed as $institutionId) {
            $institution = Institution::findOrFail($institutionId);
            $email = Str::slug($teacher->name) . Str::slug($institution->name) . '@esudelib.com';

            if ($user = User::where('email', $email)->first()) {
                $user->delete();
            }
        }

        $teacher->institutions()->detach($removed);
    }

    private function handleMediaUpload(Teacher $teacher, ?array $documents)
    {
        if (! $documents) {
            return;
        }

        $media = $teacher->getMedia('images')->pluck('file_name');

        // Suppression des médias retirés
        $teacher->getMedia('images')
            ->reject(fn($m) => in_array($m->file_name, $documents))
            ->each(fn($m) => $m->delete());

        // Ajout des nouveaux médias
        collect($documents)
            ->diff($media)
            ->each(
                fn($file) =>
                $teacher->addMedia(storage_path("app/public/temp/dropzone/$file"))
                    ->toMediaCollection('images')
            );
    }

    private function getAssignedPromotion(Course $course)
    {
        $teacher = auth()->user()->teacher;

        // Chercher l'assignation (titulaire ou collaborateur)
        $assignment = \Modules\Institution\Entities\Assignment::where('course_id', $course->id)
            ->where(function ($query) use ($teacher) {
                $query->where('holder_id', $teacher->id)
                    ->orWhere('collaborator_id', $teacher->id);
            })
            ->first();

        if ($assignment && $assignment->promotion) {
            return $assignment->promotion;
        }

        // Fallback si pas de promotion explicite dans l'assignation (ancien comportement)
        $detail = $course->courseProgramDetails()->first();
        return $detail ? $detail->promotion : null;
    }

    private function getFlashMessages()
    {
        return [
            'message' => session('flash.message'),
            'type'    => session('flash.type'),
        ];
    }
}
