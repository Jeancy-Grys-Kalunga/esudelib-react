<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\{Hash, Auth, Password};

/**
 * Integration tests for Authentication Flow
 * 
 * Tests complete authentication workflows including login, registration,
 * logout, and password reset following clean code principles.
 */
class AuthenticationFlowTest extends TestCase
{
    /**
     * Test user can login with valid credentials
     *
     * @return void
     */
    public function test_user_can_login_with_valid_credentials(): void
    {
        // Arrange
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123')
        ]);
        $user->assignRole('Super Admin');

        // Act
        $response = $this->post(route('login'), [
            'email' => 'test@example.com',
            'password' => 'password123'
        ]);

        // Assert
        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($user);
    }

    /**
     * Test user cannot login with invalid credentials
     *
     * @return void
     */
    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        // Arrange
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123')
        ]);

        // Act
        $response = $this->post(route('login'), [
            'email' => 'test@example.com',
            'password' => 'wrongpassword'
        ]);

        // Assert
        $response->assertSessionHas('flash.message', 'Mot de passe incorrect');
        $this->assertGuest();
    }

    /**
     * Test user can register with valid data
     *
     * @return void
     */
    public function test_user_can_register_with_valid_data(): void
    {
        // Act
        $response = $this->post(route('register'), [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ]);

        // Assert
        $response->assertRedirect(route('dashboard'));
        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'name' => 'John Doe'
        ]);
        $this->assertAuthenticated();
    }

    /**
     * Test registration validates email uniqueness
     *
     * @return void
     */
    public function test_registration_validates_email_uniqueness(): void
    {
        // Arrange
        User::factory()->create(['email' => 'existing@example.com']);

        // Act
        $response = $this->post(route('register'), [
            'name' => 'Test User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ]);

        // Assert
        $response->assertSessionHasErrors('email');
    }

    /**
     * Test user can logout
     *
     * @return void
     */
    public function test_user_can_logout(): void
    {
        // Arrange
        $user = User::factory()->create();
        $this->actingAs($user);

        // Act
        $response = $this->post(route('logout'));

        // Assert
        $response->assertRedirect('/login');
        $this->assertGuest();
    }

    /**
     * Test authenticated user is redirected from login page
     *
     * @return void
     */
    public function test_authenticated_user_redirected_from_login(): void
    {
        // Arrange
        $user = User::factory()->create();
        $this->actingAs($user);

        // Act
        $response = $this->get(route('login'));

        // Assert
        $response->assertRedirect(route('dashboard'));
    }

    /**
     * Test password reset link can be requested
     *
     * @return void
     */
    public function test_password_reset_link_can_be_requested(): void
    {
        // Arrange
        $user = User::factory()->create(['email' => 'test@example.com']);

        // Act
        $response = $this->post(route('password.email'), [
            'email' => 'test@example.com'
        ]);

        // Assert
        $response->assertSessionHas('status');
    }

    /**
     * Test password can be reset with valid token
     *
     * @return void
     */
    public function test_password_can_be_reset_with_valid_token(): void
    {
        // Arrange
        $user = User::factory()->create();
        $token = Password::createToken($user);

        // Act
        $response = $this->post(route('password.store'), [
            'token' => $token,
            'email' => $user->email,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123'
        ]);

        // Assert
        $response->assertRedirect(route('login'));
        $this->assertTrue(Hash::check('newpassword123', $user->fresh()->password));
    }

    /**
     * Test session timeout redirects to login
     *
     * @return void
     */
    public function test_session_timeout_redirects_to_login(): void
    {
        // Arrange
        $user = User::factory()->create();
        $this->actingAs($user);

        // Simulate session expiry
        Auth::logout();

        // Act
        $response = $this->get(route('dashboard'));

        // Assert
        $response->assertRedirect(route('login'));
    }

    /**
     * Test remember me functionality
     *
     * @return void
     */
    public function test_remember_me_functionality(): void
    {
        // Arrange
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123')
        ]);
        $user->assignRole('Super Admin');


        $response = $this->post(route('login'), [
            'email' => 'test@example.com',
            'password' => 'password123',
            'remember' => true
        ]);

        // Assert
        $response->assertRedirect(route('dashboard'));
        $this->assertNotNull(Auth::user()->getRememberToken());
    }
}
