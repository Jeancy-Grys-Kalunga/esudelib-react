<?php

namespace Modules\User\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Gate;

class RolesController extends Controller 
{
    public function index(Request $request)
    {
        abort_if(Gate::denies('access_user_management'), 403);

        $user = auth()->user();
        $user->load('permissions', 'roles.permissions');

        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_roles',
            'edit'   => 'edit_roles',
            'delete' => 'delete_roles',
            'access' => 'access_user_management',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        $roles = Role::with(['permissions'])
            ->where('name', '!=', 'Super Admin')
            ->orderByDesc('id')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('name'),
                    'created_at' => $role->created_at->translatedFormat('d F Y'),
                ];
            });

        $allPermissions = Permission::pluck('name');

        return Inertia::render('user/role', [
            'roles' => $roles,
            'permissions' => $allPermissions,
            'can' => $can,
            'filters' => $request->only(['search']),
            'flash' => $this->getFlashMessages(),
        ]);
    }

    public function store(Request $request)
    {
        abort_if(Gate::denies('access_user_management'), 403);

        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name'
        ], [
            'name.required' => 'Le nom du rôle est requis.',
            'name.string' => 'Le nom du rôle doit être une chaîne de caractères.',
            'name.max' => 'Le nom du rôle ne doit pas dépasser 255 caractères.',
            'name.unique' => 'Ce nom de rôle existe déjà.',
            'permissions.required' => 'Veuillez sélectionner au moins une permission.',
            'permissions.array' => 'Les permissions doivent être un tableau.',
            'permissions.*.exists' => 'Une ou plusieurs permissions sélectionnées sont invalides.',
        ]);

        $role = Role::create(['name' => $request->name]);
        $role->syncPermissions($request->permissions);

        return redirect()->route('roles.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Rôle créé avec succès !',
            ],
        ]);
    }

    public function update(Request $request, Role $role)
    {
        abort_if(Gate::denies('access_user_management'), 403);

        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name'
        ]);

        $role->update(['name' => $request->name]);
        $role->syncPermissions($request->permissions);

        return redirect()->route('roles.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => 'Rôle modifié avec succès !',
            ],
        ]);
    }

    public function destroy(Role $role)
    {
        abort_if(Gate::denies('access_user_management'), 403);

        $role->delete();

        return redirect()->route('roles.index')->with([
            'flash' => [
                'type' => 'warning',
                'message' => 'Rôle supprimé avec succès !',
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
