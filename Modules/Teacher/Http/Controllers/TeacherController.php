<?php

namespace Modules\Teacher\Http\Controllers;

use App\Exports\CourseStudentsExport;
use App\Http\Controllers\Controller;
use App\Imports\GradesImport;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Institution;
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

        // Vérifier si l'utilisateur a un enseignant associé
        if (!$user->teacher) {
            abort(403, "Vous n'êtes pas associé à un enseignant");
        }

        // Récupérer les cours de l'enseignant avec les détails du programme et de la catégorie
        $courses = Course::select(
            'courses.id',
            'courses.title',
            'course_program_details.cm',
            'course_program_details.td',
            'course_program_details.tp',
            'course_program_details.credits',
            'course_categories.name as category_name',
            'programs.name as program'
        )
            ->join('course_program_details', 'courses.id', '=', 'course_program_details.course_id')
            ->join('course_categories', 'course_program_details.course_category_id', '=', 'course_categories.id')
            ->join('programs', 'course_program_details.program_id', '=', 'programs.id')
            ->whereIn('courses.id', $user->teacher->courses()->pluck('courses.id'))
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'cm' => $course->cm,
                    'td' => $course->td,
                    'tp' => $course->tp,
                    'credits' => $course->credits,
                    'program' => $course->program,
                    'category_name' => $course->category_name,
                    'student_count' => Course::find($course->id)->students()->count(),
                    'appeals_count' => Course::find($course->id)->appeals()->count(),
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

        return Inertia::render('teacher/submitGrades', [
            'course' => $course->only('id', 'title'),
        ]);
    }

    public function submitGrades(Request $request, Course $course)
    {
        if (!$this->isTeacherAssignedToCourse($course)) {
            abort(403, 'Action non autorisée');
        }

        $request->validate([
            'grades_file' => 'required|file|mimes:xlsx,xls',
        ]);

        Excel::import(new GradesImport($course, $request->session), $request->file('grades_file'));

        $successRate = $this->calculateSuccessRate($course);

        return redirect()->route('teacher.courses')->with([
            'flash' => [
                'type' => $successRate >= 70 ? 'success' : 'warning',
                'message' => $successRate >= 70
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
            ->with(['student:id,name,matricule', 'documents'])
            ->get()
            ->map(function ($appeal) {
                return [
                    'id' => $appeal->id,
                    'object' => $appeal->object,
                    'status' => $appeal->status,
                    'created_at' => $appeal->created_at->format('d/m/Y'),
                    'student' => $appeal->student->name,
                    'matricule' => $appeal->student->matricule,
                    'documents' => $appeal->documents->map(fn($doc) => [
                        'name' => $doc->name,
                        'url' => Storage::url($doc->path),
                    ]),
                ];
            });

        return Inertia::render('teacher/appeals', [
            'appeals' => $appeals,
            'course' => $course->only('id', 'title'),
        ]);
    }

    /**
     * Vérifie si l'enseignant est assigné au cours
     */
    private function isTeacherAssignedToCourse(Course $course): bool
    {
        return auth()->user()->teacher->courses()
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

    private function getFlashMessages()
    {
        return [
            'message' => session('flash.message'),
            'type'    => session('flash.type'),
        ];
    }
}
