<?php

declare(strict_types=1);

namespace Modules\User\Http\Controllers;

use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Modules\Institution\Entities\Institution;
use Modules\User\Http\Requests\UpdateUserRequest;
use Modules\User\Http\Requests\UserRequest;
use Spatie\Permission\Models\Permission;

class UsersController extends Controller
{
    public function __construct(
        private UserService $userService
    ) {}

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
                    'id'           => $user->id,
                    'name'         => $user->name,
                    'email'        => $user->email,
                    'is_active'    => $user->is_active,
                    'avatar'       => $user->getFirstMediaUrl('avatars'),
                    'role'         => $user->roles->first()->name ?? null,
                    'institutions' => $user->institutions->map(fn($inst) => [
                        'id'   => $inst->id,
                        'name' => $inst->name
                    ]),
                    'created_at'   => $user->created_at->translatedFormat('d F Y'),
                ];
            });

        return Inertia::render('user/users', [
            'users'        => $users,
            'institutions' => Institution::select('id', 'name')->get(),
            'roles'        => Role::where('name', '!=', 'Super Admin')->get(),
            'can'          => $can,
            'filters'      => $request->only(['search']),
            'flash'        => $this->getFlashMessages(),
        ]);
    }

    public function store(UserRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('create_users')) {
            abort(403, 'Action non autorisée');
        }

        $role = Role::findOrFail($request->role);

        $this->userService->createUser(
            $request->validated(),
            $request->role,
            $request->input('institutions', []),
            $request->input('document', [])
        );

        return redirect()->route('users.index')->with([
            'flash' => [
                'type'    => 'success',
                'message' => "Utilisateur enregistré avec succès avec le rôle '{$role->name}' !",
            ],
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        if (!auth()->user()->hasPermissionTo('edit_users')) {
            abort(403, 'Action non autorisée');
        }

        $this->userService->updateUser(
            $user,
            $request->validated(),
            $request->role,
            $request->input('institutions', []),
            $request->input('document', [])
        );

        return redirect()->route('users.index')->with([
            'flash' => [
                'type'    => 'info',
                'message' => "Informations de l'utilisateur modifiées avec succès !",
            ],
        ]);
    }

    public function destroy(User $user)
    {
        abort_if(Gate::denies('access_user_management'), 403);

        $this->userService->deleteUser($user);

        return redirect()->route('users.index')->with([
            'flash' => [
                'type'    => 'warning',
                'message' => 'Utilisateur supprimé avec succès',
            ],
        ]);
    }

    private function getFlashMessages()
    {
        return [
            'message' => session('flash.message'),
            'type'    => session('flash.type'),
        ];
    }
}
