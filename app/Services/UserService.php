<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserService
{
    public function createUser(array $data, string|int $roleId, array $institutionIds = [], array $documents = []): User
    {
        $user = User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => Hash::make($data['password']),
            'is_active' => $data['is_active'],
        ]);

        $role = Role::findOrFail($roleId);
        $user->assignRole($role->name);

        if (!empty($institutionIds)) {
            $user->institutions()->sync($institutionIds);
        }

        $this->processAvatars($user, $documents);

        return $user;
    }

    public function updateUser(User $user, array $data, string|int $roleId, array $institutionIds = [], array $documents = []): User
    {
        $updateData = [
            'name'      => $data['name'],
            'email'     => $data['email'],
            'is_active' => $data['is_active'],
        ];

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        $role = Role::findOrFail($roleId);
        $user->syncRoles($role);

        if (!empty($institutionIds)) {
            $user->institutions()->sync($institutionIds);
        } else {
            $user->institutions()->detach();
        }

        $this->syncAvatars($user, $documents);

        return $user;
    }

    public function deleteUser(User $user): void
    {
        $user->institutions()->detach();
        $user->delete();
    }

    private function processAvatars(User $user, array $files): void
    {
        foreach ($files as $file) {
            $user->addMedia(storage_path('app/public/temp/dropzone/' . $file))
                ->toMediaCollection('avatars');
        }
    }

    private function syncAvatars(User $user, array $newFiles): void
    {
        $media = $user->getMedia('avatars')->pluck('file_name')->toArray();

        // Remove deleted media
        foreach ($media as $fileName) {
            if (!in_array($fileName, $newFiles)) {
                $user->getMedia('avatars')
                    ->where('file_name', $fileName)
                    ->first()
                    ?->delete();
            }
        }

        // Add new media
        foreach ($newFiles as $file) {
            if (!in_array($file, $media)) {
                $user->addMedia(storage_path('app/public/temp/dropzone/' . $file))
                    ->toMediaCollection('avatars');
            }
        }
    }
}
