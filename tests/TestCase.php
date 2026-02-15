<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use App\Models\User;
use Modules\Student\Entities\Student;
use Modules\Teacher\Entities\Teacher;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication, RefreshDatabase, WithFaker;

    /**
     * Setup the test environment.
     */
    protected function setUp(): void
    {
        parent::setUp();
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create essential roles for testing
        if (!\Spatie\Permission\Models\Role::where('name', 'Super Admin')->exists()) {
            \Spatie\Permission\Models\Role::create(['name' => 'Super Admin']);
        }
        if (!\Spatie\Permission\Models\Role::where('name', 'Etudiant')->exists()) {
            \Spatie\Permission\Models\Role::create(['name' => 'Etudiant']);
        }
        if (!\Spatie\Permission\Models\Role::where('name', 'Enseignant')->exists()) {
            \Spatie\Permission\Models\Role::create(['name' => 'Enseignant']);
        }
        if (!\Spatie\Permission\Models\Role::where('name', 'Jury')->exists()) {
            \Spatie\Permission\Models\Role::create(['name' => 'Jury']);
        }
    }

    /**
     * Create and authenticate a user with a specific role.
     *
     * @param string $role
     * @return User
     */
    protected function authenticateAs(string $role = 'Super Admin'): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);
        $this->actingAs($user);

        return $user;
    }

    /**
     * Create and authenticate a student user.
     *
     * @return array{user: User, student: Student}
     */
    protected function authenticateAsStudent(): array
    {
        $user = $this->authenticateAs('Etudiant');
        $student = Student::factory()->create(['user_id' => $user->id]);

        return ['user' => $user, 'student' => $student];
    }

    /**
     * Create and authenticate a teacher user.
     *
     * @return array{user: User, teacher: Teacher}
     */
    protected function authenticateAsTeacher(): array
    {
        $user = $this->authenticateAs('Enseignant');
        $teacher = Teacher::factory()->create(['user_id' => $user->id]);

        return ['user' => $user, 'teacher' => $teacher];
    }

    /**
     * Create and authenticate an admin user.
     *
     * @return User
     */
    protected function authenticateAsAdmin(): User
    {
        return $this->authenticateAs('Super Admin');
    }

    /**
     * Assert that a JSON response has the expected structure.
     *
     * @param array $response
     * @param array $expectedKeys
     * @return void
     */
    protected function assertJsonStructureMatches(array $response, array $expectedKeys): void
    {
        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $response, "Expected key '{$key}' not found in response");
        }
    }

    /**
     * Assert that a response is a successful JSON response.
     *
     * @param \Illuminate\Testing\TestResponse $response
     * @param int $status
     * @return void
     */
    protected function assertSuccessfulJsonResponse($response, int $status = 200): void
    {
        $response->assertStatus($status);
        $response->assertJsonStructure(['success', 'data']);
        $this->assertTrue($response->json('success'));
    }

    /**
     * Assert that a response is an error JSON response.
     *
     * @param \Illuminate\Testing\TestResponse $response
     * @param int $status
     * @return void
     */
    protected function assertErrorJsonResponse($response, int $status = 400): void
    {
        $response->assertStatus($status);
        $response->assertJsonStructure(['success', 'message']);
        $this->assertFalse($response->json('success'));
    }

    /**
     * Mock an external HTTP service.
     *
     * @param string $url
     * @param array $responseData
     * @param int $status
     * @return void
     */
    protected function mockHttpService(string $url, array $responseData, int $status = 200): void
    {
        \Illuminate\Support\Facades\Http::fake([
            $url => \Illuminate\Support\Facades\Http::response($responseData, $status)
        ]);
    }

    /**
     * Create a test file for upload testing.
     *
     * @param string $name
     * @param string $mimeType
     * @return \Illuminate\Http\UploadedFile
     */
    protected function createTestFile(string $name = 'test.pdf', string $mimeType = 'application/pdf')
    {
        return \Illuminate\Http\UploadedFile::fake()->create($name, 1000, $mimeType);
    }
}
