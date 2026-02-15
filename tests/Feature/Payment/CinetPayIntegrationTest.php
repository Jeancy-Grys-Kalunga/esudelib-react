<?php

namespace Tests\Feature\Payment;

use App\Models\User;
use App\Services\CinetPayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Modules\Institution\Entities\Institution;
use Modules\Student\Entities\Payment;
use Modules\Student\Entities\Student;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CinetPayIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup basic data
        if (!Role::where('name', 'Super Admin')->exists()) {
            Role::create(['name' => 'Super Admin', 'guard_name' => 'web']);
        }

        // Mock CinetPay config
        config([
            'services.cinetpay.api_key' => 'test-api-key',
            'services.cinetpay.site_id' => 'test-site-id',
            'services.cinetpay.payment_url' => 'https://api-checkout.cinetpay.com/v2/payment',
            'services.cinetpay.check_url' => 'https://api-checkout.cinetpay.com/v2/payment/check',
        ]);
    }

    public function test_payment_initialization_workflow()
    {
        // Arrange
        $user = User::factory()->create();
        /** @var User $user */
        $user->assignRole('Super Admin');
        $institution = Institution::factory()->create();
        $student = Student::factory()->create([
            'user_id' => $user->id,
            'institution_id' => $institution->id,
            'name' => 'Test Student'
        ]);

        $this->actingAs($user);

        // Mock CinetPay API
        Http::fake([
            'https://api-checkout.cinetpay.com/v2/payment' => Http::response([
                'code' => '00',
                'message' => 'SUCCESS',
                'data' => [
                    'payment_url' => 'https://cinetpay.com/payment/test-token',
                    'payment_token' => 'test-token'
                ]
            ], 200)
        ]);

        // Act
        $response = $this->postJson(route('payments.create'), [
            'amount' => 5000,
            'currency' => 'XOF',
            'description' => 'Test Payment'
        ]);

        // Assert
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'payment_url' => 'https://cinetpay.com/payment/test-token'
            ]);

        $this->assertDatabaseHas('payments', [
            'student_id' => $student->id,
            'amount' => 5000,
            'status' => 'pending'
        ]);
    }

    public function test_payment_verification_workflow()
    {
        // Arrange
        $user = User::factory()->create();
        /** @var User $user */
        $user->assignRole('Super Admin');
        $student = Student::factory()->create(['user_id' => $user->id]);
        $payment = Payment::create([
            'student_id' => $student->id,
            'amount' => 5000,
            'status' => 'pending',
            'metadata' => json_encode(['transaction_id' => 'TRANS-123'])
        ]);

        $this->actingAs($user);

        // Mock CinetPay API check
        Http::fake([
            'https://api-checkout.cinetpay.com/v2/payment/check' => Http::response([
                'code' => '00',
                'message' => 'SUCCESS',
                'data' => [
                    'status' => 'ACCEPTED',
                    'amount' => 5000,
                    'transaction_id' => 'TRANS-123'
                ]
            ], 200)
        ]);

        // Act
        $response = $this->getJson(route('payments.status', ['id' => $payment->id]));

        // Assert
        $response->assertStatus(200)
            ->assertJson(['success' => true, 'status' => 'ACCEPTED']);

        $this->assertEquals('paid', $payment->fresh()->status);
    }

    public function test_processes_payment_webhook()
    {
        // Arrange
        $student = Student::factory()->create();
        $payment = Payment::create([
            'student_id' => $student->id,
            'amount' => 5000,
            'status' => 'pending',
            'metadata' => json_encode(['transaction_id' => 'TRANS-456'])
        ]);

        // Act
        $response = $this->postJson(route('payments.webhook'), [
            'cpm_trans_id' => 'TRANS-456',
            'cpm_site_id' => '123',
            'cpm_amount' => '5000'
        ]);

        // Assert
        $response->assertStatus(200)
            ->assertJson(['status' => 'received']);

        $this->assertEquals('paid', $payment->fresh()->status);
    }

    public function test_retrieves_payment_history()
    {
        // Arrange
        $user = User::factory()->create();
        /** @var User $user */
        $user->assignRole('Super Admin');
        $student = Student::factory()->create(['user_id' => $user->id]);
        Payment::create([
            'student_id' => $student->id,
            'amount' => 1000,
            'status' => 'paid'
        ]);

        $this->actingAs($user);

        // Act
        $response = $this->getJson(route('payments.history'));

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure(['payments']);
    }

    public function test_generates_payment_receipt()
    {
        // Arrange
        $user = User::factory()->create();
        /** @var User $user */
        $user->assignRole('Super Admin');
        $student = Student::factory()->create(['user_id' => $user->id]);
        $payment = Payment::create([
            'student_id' => $student->id,
            'amount' => 1000,
            'status' => 'paid'
        ]);

        $this->actingAs($user);

        // Act
        $response = $this->get(route('payments.receipt', ['id' => $payment->id]));

        // Assert
        $response->assertStatus(200)
            ->assertHeader('Content-Type', 'application/pdf');
    }
}
