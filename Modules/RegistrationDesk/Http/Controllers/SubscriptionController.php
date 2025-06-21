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

class SubscriptionController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('access_inscriptions')) {
            abort(403, 'Action non autorisée');
        }

        $user = auth()->user();
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
        $promotions = Promotion::all(['id', 'title']);

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
        $user = auth()->user();

        $institutions = Institution::when(
            $user->hasRole('Bureau Inscription'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        $academicYears = AcademicYear::all(['id', 'title']);
        $promotions = Promotion::all(['id', 'title']);

        return Inertia::render('inscription::inscriptions/Form', [
            'institutions' => $institutions,
            'academicYears' => $academicYears,
            'promotions' => $promotions,
        ]);
    }

    public function store(StoreInscriptionRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('create_inscriptions')) {
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

            return redirect()->route('subscriptions.index')->with([
                'flash' => [
                    'type' => 'success',
                    'message' => 'Inscription enregistrée avec succès !',
                ],
            ]);
        });
    }

    public function edit(Inscription $inscription)
    {
        if (!auth()->user()->hasPermissionTo('edit_inscriptions')) {
            abort(403, 'Action non autorisée');
        }

        $user = auth()->user();

        $institutions = Institution::when(
            $user->hasRole('Bureau Inscription'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        $academicYears = AcademicYear::all(['id', 'title']);
        $promotions = Promotion::all(['id', 'title']);

        return Inertia::render('inscription::inscriptions/Form', [
            'inscription' => $inscription->load(['student', 'academicYear', 'institution', 'promotion']),
            'institutions' => $institutions,
            'academicYears' => $academicYears,
            'promotions' => $promotions,
        ]);
    }

    public function update(RequestsUpdateInscriptionRequest $request, Inscription $inscription)
    {
        if (!auth()->user()->hasPermissionTo('edit_inscriptions')) {
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
            if ($student->user) {
                $student->user->institutions()->sync([$request->institution_id]);
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
        if (!auth()->user()->hasPermissionTo('delete_inscriptions')) {
            abort(403, 'Action non autorisée');
        }

        return DB::transaction(function () use ($inscription) {
            $student = $inscription->student;
            
            // Supprimer le compte utilisateur associé
            if ($student->user) {
                $student->user->delete();
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
        if (!auth()->user()->hasPermissionTo('import_inscriptions')) {
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
            'type' => session('flash')['type'] ?? null
        ] : null;
    }
}