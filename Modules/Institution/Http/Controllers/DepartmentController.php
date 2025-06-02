<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Department; 
use Modules\Institution\Http\Requests\DepartmentRequest; 
use Spatie\Permission\Models\Permission;

class DepartmentController extends Controller 
{
    public function index(Request $request)
    {
        // Mise à jour des permissions
        if (!auth()->user()->hasPermissionTo('access_departments')) {
            abort(403, 'Action non autorisée');
        }

        $user = auth()->user();
        $user->load('permissions', 'roles.permissions');

        // Mise à jour des permissions
        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_departments',
            'edit'   => 'edit_departments',
            'delete' => 'delete_departments',
            'access' => 'access_departments',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        // Mise à jour de la requête pour Department
        $query = Department::with(['institution'])
            ->orderByDesc('id');

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereIn('institution_id', $institutionIds);
        }

        $institutions = $user->hasRole('Secrétaire Académique')
            ? $user->institutions()->pluck('id')
            : Institution::pluck('id');

        // Mise à jour des données pour Department
        $departments = $query->get()->map(function ($department) {
            return [
                'id' => $department->id,
                'title' => $department->title,
                'institution' => $department->institution->name,
                'created_at' => $department->created_at->translatedFormat('d F Y'),
            ];
        });

        // Mise à jour du nom de la vue et des variables
        return Inertia::render('department/index', [
            'departments' => $departments,
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

        // Mise à jour du nom de la vue et du modèle
        return Inertia::render('Institution/Departments/Form', [
            'department' => new Department(),
            'institutions' => $institutions,
            'isEditing' => false,
        ]);
    }

    public function store(DepartmentRequest $request) // Changement de Request
    {
        // Mise à jour de la permission
        if (!auth()->user()->hasPermissionTo('create_departments')) {
            abort(403, 'Action non autorisée');
        }

        // Création d'un Department
        Department::create([
            'title' => $request->title,
            'institution_id' => $request->institution_id,
        ]);

        // Mise à jour du nom de la route et du message
        return redirect()->route('departments.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Département enregistré avec succès !',
            ],
        ]);
    }

    public function edit(Department $department) // Changement de modèle
    {
        $user = auth()->user();

        $institutions = Institution::when(
            $user->hasRole('Secrétaire Académique'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        // Mise à jour du nom de la vue et des variables
        return Inertia::render('Institution/Departments/Form', [
            'department' => $department,
            'institutions' => $institutions,
            'isEditing' => true,
        ]);
    }

    public function update(DepartmentRequest $request, Department $department) // Changement de Request et modèle
    {
        // Mise à jour de la permission
        if (!auth()->user()->hasPermissionTo('edit_departments')) {
            abort(403, 'Action non autorisée');
        }

        $department->update([
            'title' => $request->title,
            'institution_id' => $request->institution_id,
        ]);

        // Mise à jour du nom de la route et du message
        return redirect()->route('departments.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => 'Département modifié avec succès !',
            ],
        ]);
    }

    public function destroy(Department $department) // Changement de modèle
    {
        // Mise à jour de la permission
        if (!auth()->user()->hasPermissionTo('delete_departments')) {
            abort(403, 'Action non autorisée');
        }

        $department->delete();

        // Mise à jour du nom de la route et du message
        return redirect()->route('departments.index')->with([
            'flash' => [
                'type' => 'warning',
                'message' => 'Département supprimé avec succès !',
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