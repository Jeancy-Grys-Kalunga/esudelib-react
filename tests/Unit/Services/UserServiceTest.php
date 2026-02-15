<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Models\User;
use App\Services\UserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserServiceTest extends TestCase
{
    use RefreshDatabase;

    private UserService $userService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->userService = new UserService();

        // Ensure roles exist
        Role::create(['name' => 'Admin']);
        Role::create(['name' => 'User']);
    }

    public function test_create_user_creates_new_user_with_role()
    {
        $role = Role::where('name', 'User')->first();
        $data = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'secret123',
            'is_active' => true,
        ];

        $user = $this->userService->createUser($data, $role->id);

        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'test@example.com'
        ]);
        $this->assertTrue(Hash::check('secret123', $user->password));
        $this->assertTrue($user->hasRole('User'));
    }

    public function test_update_user_updates_data_and_role()
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@example.com'
        ]);

        $role = Role::where('name', 'Admin')->first();

        $data = [
            'name' => 'New Name',
            'email' => 'new@example.com',
            'password' => 'newsecret',
            'is_active' => false
        ];

        $this->userService->updateUser($user, $data, $role->id);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
            'email' => 'new@example.com',
            'is_active' => false
        ]);
        $this->assertTrue(Hash::check('newsecret', $user->fresh()->password));
        $this->assertTrue($user->hasRole('Admin'));
    }

    public function test_delete_user_removes_user()
    {
        $user = User::factory()->create();

        $this->userService->deleteUser($user);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }
}
