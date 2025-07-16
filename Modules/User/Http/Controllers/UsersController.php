<?php

namespace Modules\User\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Modules\Institution\Entities\Institution;
use Modules\User\Http\Requests\UpdateUserRequest;
use Modules\User\Http\Requests\UserRequest;
use Spatie\Permission\Models\Permission;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('access_user_management')) {
            abort(403, 'Action non autorisée');
        }

        $user = auth()->user();
        $user->load('permissions', 'roles.permissions');

          $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_users',
            'edit'   => 'edit_users',
            'delete' => 'delete_users',
            'access' => 'access_user_management',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        $users = User::with(['roles', 'institutions'])
        ->where('id', '!=', auth()->id())
        ->orderByDesc('id')
        ->get()
        ->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'avatar' => $user->getFirstMediaUrl('avatars'),
                'role' => $user->roles->first()->name ?? null,
                // Modification ici: retourner des objets au lieu de noms
                'institutions' => $user->institutions->map(fn($inst) => [
                    'id' => $inst->id,
                    'name' => $inst->name
                ]),
                'created_at' => $user->created_at->translatedFormat('d F Y'),
            ];
        });

        return Inertia::render('user/users', [
            'users' => $users,
            'institutions' => Institution::select('id', 'name')->get(),
            'roles' => Role::where('name', '!=', 'Super Admin')->get(),
            'can' => $can,
            'filters' => $request->only(['search']),
            'flash' => $this->getFlashMessages(),
        ]);
    }

    public function store(UserRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('create_users')) {
            abort(403, 'Action non autorisée');
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_active' => $request->is_active,
        ]);

        // Assigner le rôle à l'utilisateur

        $role = Role::findOrFail($request->role);

        $user->assignRole($role->name);
   
        if ($request->has('institutions')) {
            $user->institutions()->sync($request->institutions);
        }

        if ($request->has('document')) {
            foreach ($request->input('document', []) as $file) {
                $user->addMedia(storage_path('app/public/temp/dropzone/' . $file))
                    ->toMediaCollection('avatars');
            }
        }

        return redirect()->route('users.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => "Utilisateur enregistré avec succès avec le rôle '$role' !",
            ],
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        if (!auth()->user()->hasPermissionTo('edit_users')) {
            abort(403, 'Action non autorisée');
        }

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'is_active' => $request->is_active,
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        $role = Role::findOrFail($request->role);

        $user->syncRoles($role);

        if ($request->has('institutions')) {
            $user->institutions()->sync($request->institutions);
        } else {
            $user->institutions()->detach();
        }

        // Gestion des avatars
        $media = $user->getMedia('avatars')->pluck('file_name')->toArray();
        $newFiles = $request->input('document', []);

        // Supprimer les médias non présents dans la nouvelle liste
        foreach ($media as $fileName) {
            if (!in_array($fileName, $newFiles)) {
                $user->getMedia('avatars')
                    ->where('file_name', $fileName)
                    ->first()
                    ?->delete();
            }
        }

        // Ajouter les nouveaux fichiers
        foreach ($newFiles as $file) {
            if (!in_array($file, $media)) {
                $user->addMedia(storage_path('app/public/temp/dropzone/' . $file))
                    ->toMediaCollection('avatars');
            }
        }

        return redirect()->route('users.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => "Informations de l'utilisateur modifiées avec succès !",
            ],
        ]);
    }

    public function destroy(User $user)
    {
        abort_if(Gate::denies('access_user_management'), 403);

        $user->institutions()->detach();
        $user->delete();

        return redirect()->route('users.index')->with([
            'flash' => [
                'type' => 'warning',
                'message' => 'Utilisateur supprimé avec succès',
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