<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Faculty;
use Modules\Institution\Http\Requests\FacultyRequest;
use Spatie\Permission\Models\Permission;

class FacultyController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('access_faculties')) {
            abort(403, 'Action non autorisée');
        }

        $user = auth()->user();
        $user->load('permissions', 'roles.permissions');

        // Gestion des permissions
        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_faculties',
            'edit'   => 'edit_faculties',
            'delete' => 'delete_faculties',
            'access' => 'access_faculties',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        // Construction de la requête
        $query = Faculty::with(['institution'])
            ->orderByDesc('id');

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereIn('institution_id', $institutionIds);
        }

        $institutions = $user->hasRole('Secrétaire Académique')
            ? $user->institutions()->pluck('id')
            : Institution::pluck('id');

        // Formatage des données pour Inertia
        $faculties = $query->get()->map(function ($faculty) {
            return [
                'id' => $faculty->id,
                'title' => $faculty->title,
                'institution' => $faculty->institution->name,
                'created_at' => $faculty->created_at->translatedFormat('d F Y'),
            ];
        });

        return Inertia::render('faculty/index', [
            'faculties' => $faculties,
            'can' => $can,
            'filters' => $request->only(['search']),
            'flash' => $this->getFlashMessages(),
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

        return Inertia::render('Institution/Faculties/Form', [
            'faculty' => new Faculty(),
            'institutions' => $institutions,
            'isEditing' => false,
        ]);
    }

    public function store(FacultyRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('create_faculties')) {
            abort(403, 'Action non autorisée');
        }

        Faculty::create([
            'title' => $request->title,
            'institution_id' => $request->institution_id,
        ]);

        return redirect()->route('faculties.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Faculté enregistrée avec succès !',
            ],
        ]);
    }

    public function edit(Faculty $faculty)
    {
        $user = auth()->user();

        $institutions = Institution::when(
            $user->hasRole('Secrétaire Académique'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        return Inertia::render('faculty/index', [
            'faculty' => $faculty,
            'institutions' => $institutions,
            'isEditing' => true,
        ]);
    }

    public function update(FacultyRequest $request, Faculty $faculty)
    {
        if (!auth()->user()->hasPermissionTo('edit_faculties')) {
            abort(403, 'Action non autorisée');
        }

        $faculty->update([
            'title' => $request->title,
            'institution_id' => $request->institution_id,
        ]);

        return redirect()->route('faculties.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => 'Faculté modifiée avec succès !',
            ],
        ]);
    }

    public function destroy(Faculty $faculty)
    {
        if (!auth()->user()->hasPermissionTo('delete_faculties')) {
            abort(403, 'Action non autorisée');
        }

        $faculty->delete();

        return redirect()->route('faculties.index')->with([
            'flash' => [
                'type' => 'warning',
                'message' => 'Faculté supprimée avec succès !',
            ],
        ]);
    }

    private function getFlashMessages()
    {
        return [
            'message' => session('flash.message'),
            'type' => session('flash.type'),
        ];
    }
}