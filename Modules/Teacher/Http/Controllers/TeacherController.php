<?php

namespace Modules\Teacher\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Modules\Institution\Entities\Institution;
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

        $this->handleUserCreation($teacher, $request->institutions);
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

    private function handleUserCreation(Teacher $teacher, array $institutionIds)
    {
        foreach ($institutionIds as $institutionId) {
            $institution = Institution::find($institutionId);
            $email       = Str::slug($teacher->name) . Str::slug($institution->name) . '@esudelib.com';

            $user = User::create([
                'name'      => $teacher->name,
                'email'     => strtolower($email),
                'password'  => Hash::make(1234),
                'is_active' => true,
            ]);

            $user->assignRole('Enseignant');
            $user->institutions()->attach($institutionId);
        }
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
