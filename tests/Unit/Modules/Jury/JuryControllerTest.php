<?php

namespace Tests\Unit\Modules\Jury;

use Tests\TestCase;
use Modules\Institution\Entities\{Jury, Course, Promotion, AcademicYear, Institution, UnitsTeaching, CourseCategory, Program, Semestre};
use Modules\Student\Entities\{Student, Note, Appeal};
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Mockery;
use Modules\Jury\Services\MasterPredictionService;
use App\Services\TwilioService;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Jury\Exports\ResultsExport;
use Modules\RegistrationDesk\Entities\Inscription;

class JuryControllerTest extends TestCase
{
    protected function setJuryContext($academicYear, $promotion)
    {
        $context = [
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
        ];
        session(['jury_context' => $context]);
        session()->save();
        return $context;
    }

    private function createCourseProgramDetail($course, $promotion)
    {
        $unit = UnitsTeaching::factory()->create(['promotion_id' => $promotion->id]);
        $category = CourseCategory::factory()->create();
        $program = Program::factory()->create(['institution_id' => $promotion->institution_id]);

        return DB::table('course_program_details')->insertGetId([
            'course_id' => $course->id,
            'promotion_id' => $promotion->id,
            'program_id' => $program->id,
            'units_teaching_id' => $unit->id,
            'course_category_id' => $category->id,
            'credits' => 3,
            'cm' => 10,
            'td' => 5,
            'tp' => 5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    // ==================== JURY DASHBOARD TESTS ====================

    public function test_dashboard_displays_jury_statistics(): void
    {
        $user = $this->authenticateAs('Jury'); // Utilise la méthode du parent
        $academicYear = AcademicYear::factory()->create();
        $promotion = Promotion::factory()->create();
        $this->setJuryContext($academicYear, $promotion);

        $course = Course::factory()->create();
        $this->createCourseProgramDetail($course, $promotion);

        $student = Student::factory()->create();
        $student->inscriptions()->create([
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
            'institution_id' => $promotion->institution_id,
        ]);

        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
            'cote' => 12,
            'is_submitted' => true,
        ]);

        $context = $this->setJuryContext($academicYear, $promotion);
        $response = $this->withSession(['jury_context' => $context])->get(route('jury.dashboard'));

        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('jury/dashboard')
                ->has('courses')
                ->has('successRates')
        );
    }

    public function test_dashboard_requires_context(): void
    {
        $user = $this->authenticateAs('Jury');
        $response = $this->withSession([])->get(route('jury.dashboard'));
        $response->assertStatus(403);
    }


    public function test_results_displays_students_list(): void
    {
        $user = $this->authenticateAs('Jury');
        $academicYear = AcademicYear::factory()->create();
        $promotion = Promotion::factory()->create();
        $this->setJuryContext($academicYear, $promotion);

        Student::factory()->count(3)->create()->each(function ($student) use ($academicYear, $promotion) {
            $student->inscriptions()->create([
                'academic_year_id' => $academicYear->id,
                'promotion_id' => $promotion->id,
                'institution_id' => $promotion->institution_id,
            ]);
        });

        $context = $this->setJuryContext($academicYear, $promotion);
        $response = $this->withSession(['jury_context' => $context])->get(route('jury.results'));

        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('jury/results')
                ->has('students.data', 3)
        );
    }

    public function test_save_grades_updates_student_notes(): void
    {
        $user = $this->authenticateAs('Jury');
        $academicYear = AcademicYear::factory()->create();
        $promotion = Promotion::factory()->create();
        $course = Course::factory()->create();
        $student = Student::factory()->create();

        $this->setJuryContext($academicYear, $promotion);

        $response = $this->postJson(route('jury.save-grades'), [
            'changes' => [
                [
                    'isNew' => true,
                    'studentId' => $student->id,
                    'courseId' => $course->id,
                    'value' => 16,
                ],
            ],
            'massChanges' => [],
        ]);

        $response->assertJson(['success' => true]);
        $this->assertDatabaseHas('notes', [
            'student_id' => $student->id,
            'course_id' => $course->id,
            'cote' => 16,
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
        ]);
    }

    public function test_publish_results_sends_sms(): void
    {
        $user = $this->authenticateAs('Jury');
        $academicYear = AcademicYear::factory()->create();
        $promotion = Promotion::factory()->create();
        $this->setJuryContext($academicYear, $promotion);

        $student = Student::factory()->create(['phone' => '+237600000000']);
        $student->inscriptions()->create([
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
            'institution_id' => $promotion->institution_id,
        ]);

        $course = Course::factory()->create();
        $this->createCourseProgramDetail($course, $promotion);

        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
            'cote' => 14,
        ]);

        $mockTwilio = Mockery::mock(TwilioService::class);
        $mockTwilio->shouldReceive('sendTwilioSms')->once();
        $this->app->instance(TwilioService::class, $mockTwilio);

        $context = $this->setJuryContext($academicYear, $promotion);
        $response = $this->withSession(['jury_context' => $context])->post(route('jury.publish-results'));

        $response->assertSessionHas('flash.type', 'success');
    }

    public function test_export_results_downloads_excel(): void
    {
        Excel::fake();

        $user = $this->authenticateAs('Jury');
        $academicYear = AcademicYear::factory()->create();
        $promotion = Promotion::factory()->create();
        $this->setJuryContext($academicYear, $promotion);

        $context = $this->setJuryContext($academicYear, $promotion);
        $response = $this->withSession(['jury_context' => $context])->get(route('jury.export-results'));

        Excel::assertDownloaded('resultats_jury.xlsx', function (ResultsExport $export) use ($academicYear, $promotion) {
            return $export->academicYearId === $academicYear->id && $export->promotionId === $promotion->id;
        });
    }

    public function test_add_points_to_course(): void
    {
        $user = $this->authenticateAs('Jury');
        $academicYear = AcademicYear::factory()->create();
        $promotion = Promotion::factory()->create();
        $this->setJuryContext($academicYear, $promotion);

        $course = Course::factory()->create();
        $student1 = Student::factory()->create();
        $student2 = Student::factory()->create();

        Note::factory()->create([
            'student_id' => $student1->id,
            'course_id' => $course->id,
            'cote' => 12,
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
        ]);
        Note::factory()->create([
            'student_id' => $student2->id,
            'course_id' => $course->id,
            'cote' => 18,
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
        ]);

        $response = $this->post(route('jury.add-points'), [
            'course_id' => $course->id,
            'points' => 2,
        ]);

        $response->assertSessionHas('flash.type', 'success');
        $this->assertDatabaseHas('notes', [
            'student_id' => $student1->id,
            'course_id' => $course->id,
            'cote' => 14,
        ]);
        $this->assertDatabaseHas('notes', [
            'student_id' => $student2->id,
            'course_id' => $course->id,
            'cote' => 20,
        ]);
    }

    public function test_update_note(): void
    {
        $user = $this->authenticateAs('Jury');
        $academicYear = AcademicYear::factory()->create();
        $promotion = Promotion::factory()->create();
        $this->setJuryContext($academicYear, $promotion);

        $note = Note::factory()->create(['cote' => 10]);

        $response = $this->post(route('jury.update-note'), [
            'note_id' => $note->id,
            'cote' => 15,
        ]);

        $response->assertSessionHas('flash.type', 'success');
        $this->assertDatabaseHas('notes', ['id' => $note->id, 'cote' => 15]);
    }

    public function test_get_student_academic_history(): void
    {
        $user = $this->authenticateAs('Jury');
        $academicYear1 = AcademicYear::factory()->create(['title' => '2023-2024']);
        $academicYear2 = AcademicYear::factory()->create(['title' => '2024-2025']);
        $promotion = Promotion::factory()->create();
        $institution = Institution::factory()->create();
        $student = Student::factory()->create();

        $inscription1 = Inscription::factory()->create([
            'student_id' => $student->id,
            'academic_year_id' => $academicYear1->id,
            'promotion_id' => $promotion->id,
            'institution_id' => $institution->id,
        ]);
        $inscription2 = Inscription::factory()->create([
            'student_id' => $student->id,
            'academic_year_id' => $academicYear2->id,
            'promotion_id' => $promotion->id,
            'institution_id' => $institution->id,
        ]);

        $course1 = Course::factory()->create(['title' => 'Maths']);
        $course2 = Course::factory()->create(['title' => 'Physique']);
        $this->createCourseProgramDetail($course1, $promotion);
        $this->createCourseProgramDetail($course2, $promotion);

        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course1->id,
            'academic_year_id' => $academicYear1->id,
            'promotion_id' => $promotion->id,
            'cote' => 12,
        ]);
        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course2->id,
            'academic_year_id' => $academicYear2->id,
            'promotion_id' => $promotion->id,
            'cote' => 8,
        ]);

        $response = $this->getJson(route('jury.student-history', $student->id));

        $response->assertJsonStructure([
            'history' => [
                '*' => ['academic_year', 'promotion', 'courses' => ['*' => ['id', 'title', 'note', 'passed']]],
            ],
            'complementary_courses',
        ]);

        $this->assertCount(2, $response->json('history'));
        $this->assertCount(1, $response->json('complementary_courses')); // cours avec note < 10
    }

    public function test_apply_global_equalization(): void
    {
        $user = $this->authenticateAs('Jury');
        $academicYear = AcademicYear::factory()->create();
        $promotion = Promotion::factory()->create();
        $this->setJuryContext($academicYear, $promotion);

        $student = Student::factory()->create();
        $course1 = Course::factory()->create();
        $course2 = Course::factory()->create();
        $course3 = Course::factory()->create();

        $this->createCourseProgramDetail($course1, $promotion);
        $this->createCourseProgramDetail($course2, $promotion);
        $this->createCourseProgramDetail($course3, $promotion);

        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course1->id,
            'cote' => 12,
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
        ]);
        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course2->id,
            'cote' => 8,
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
        ]);
        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course3->id,
            'cote' => 7,
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
        ]);

        $response = $this->postJson(route('jury.apply-equalization'), [
            'student_id' => $student->id,
            'type' => 'global',
        ]);

        $response->assertJson(['success' => true]);
        // Vérifier que les notes basses ont augmenté sans dépasser 10
        $note2 = Note::where('student_id', $student->id)->where('course_id', $course2->id)->first();
        $this->assertTrue($note2->cote > 8, "Note for course 2 should be > 8, got {$note2->cote}");

        $note3 = Note::where('student_id', $student->id)->where('course_id', $course3->id)->first();
        $this->assertTrue($note3->cote > 7, "Note for course 3 should be > 7, got {$note3->cote}");
    }

    public function test_update_course_details(): void
    {
        $user = $this->authenticateAs('Jury');
        $academicYear = AcademicYear::factory()->create();
        $promotion = Promotion::factory()->create();
        $this->setJuryContext($academicYear, $promotion);

        $course = Course::factory()->create();
        $unit = UnitsTeaching::factory()->create();
        $category = CourseCategory::factory()->create();
        $semestre = Semestre::create(['title' => 'Semestre 1']);
        $program = Program::factory()->create();

        DB::table('course_program_details')->insert([
            'course_id' => $course->id,
            'promotion_id' => $promotion->id,
            'program_id' => $program->id,
            'units_teaching_id' => $unit->id,
            'course_category_id' => $category->id,
            'credits' => 2,
            'cm' => 10,
            'td' => 5,
            'tp' => 5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $detail = DB::table('course_program_details')->where('course_id', $course->id)->first();

        $response = $this->postJson(route('jury.update-course-details'), [
            'program_detail_id' => $detail->id,
            'credits' => 4,
            'cm' => 15,
            'td' => 10,
            'tp' => 10,
        ]);

        $response->assertJson(['message' => 'Détails du cours mis à jour avec succès.']);
        $this->assertDatabaseHas('course_program_details', [
            'id' => $detail->id,
            'credits' => 4,
            'cm' => 15,
        ]);
    }

    public function test_update_course_details_without_program_detail_id(): void
    {
        $user = $this->authenticateAs('Jury');
        $academicYear = AcademicYear::factory()->create();
        $promotion = Promotion::factory()->create(['title' => 'GENIE LOGICIEL']);
        $this->setJuryContext($academicYear, $promotion);

        $course = Course::factory()->create();
        $unit = UnitsTeaching::factory()->create();

        $response = $this->postJson(route('jury.update-course-details'), [
            'course_id' => $course->id,
            'unit_teaching_id' => $unit->id,
            'credits' => 3,
            'cm' => 12,
            'td' => 6,
            'tp' => 6,
        ]);

        $response->assertJson(['message' => 'Détails du cours mis à jour avec succès.']);
        $this->assertDatabaseHas('course_program_details', [
            'course_id' => $course->id,
            'promotion_id' => $promotion->id,
            'credits' => 3,
        ]);
    }

    // ==================== ORIENTATION PREDICTION CONTROLLER TESTS ====================

    public function test_show_prediction_interface(): void
    {
        $user = $this->authenticateAs('Jury');
        $academicYear = AcademicYear::factory()->create();
        $promotion = Promotion::factory()->create();
        $this->setJuryContext($academicYear, $promotion);

        $student = Student::factory()->create();
        $student->inscriptions()->create([
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
            'institution_id' => $promotion->institution_id,
        ]);

        $course = Course::factory()->create();
        $this->createCourseProgramDetail($course, $promotion);

        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
            'cote' => 14,
        ]);

        $response = $this->get(route('jury.prediction.interface'));

        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('jury/orientation-prediction')
                ->has('academicYear')
                ->has('promotion')
                ->has('students.data')
                ->has('stats')
        );
    }

    public function test_train_model(): void
    {
        $user = $this->authenticateAs('Jury');

        $mockService = Mockery::mock(MasterPredictionService::class);
        $mockService->shouldReceive('trainModel')->once()->andReturn(['accuracy' => 0.85]);
        $this->app->instance(MasterPredictionService::class, $mockService);

        $response = $this->postJson(route('jury.prediction.train'));

        $response->assertJson([
            'success' => true,
            'message' => 'Modèle XGBoost entraîné avec succès',
        ]);
    }

    public function test_predict_orientation_for_student(): void
    {
        $user = $this->authenticateAs('Jury');
        $student = Student::factory()->create();

        $mockService = Mockery::mock(MasterPredictionService::class);
        $mockService->shouldReceive('predictForStudent')
            ->once()
            ->with(Mockery::on(fn($s) => $s->id === $student->id))
            ->andReturn([
                'prediction' => ['predicted_master' => 'IA', 'confidence_score' => 0.9],
            ]);
        $this->app->instance(MasterPredictionService::class, $mockService);

        $response = $this->getJson(route('jury.prediction.student', $student->id));

        $response->assertJson([
            'success' => true,
            'data' => ['prediction' => ['predicted_master' => 'IA', 'confidence_score' => 0.9]],
        ]);
    }

    public function test_predict_batch(): void
    {
        $user = $this->authenticateAs('Jury');
        $academicYear = AcademicYear::factory()->create();
        $promotion = Promotion::factory()->create();
        $this->setJuryContext($academicYear, $promotion);

        $student = Student::factory()->create();
        $student->inscriptions()->create([
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
            'institution_id' => $promotion->institution_id,
        ]);

        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => Course::factory()->create()->id,
            'academic_year_id' => $academicYear->id,
            'promotion_id' => $promotion->id,
            'cote' => 14,
        ]);

        $mockService = Mockery::mock(MasterPredictionService::class);
        $mockService->shouldReceive('predictBatch')
            ->once()
            ->andReturn([
                'successful' => 1,
                'failed' => 0,
                'total' => 1,
                'details' => [
                    [
                        'student_id' => $student->id,
                        'student_name' => $student->name,
                        'success' => true,
                        'prediction' => 'IA',
                        'confidence' => 0.9
                    ]
                ]
            ]);
        $this->app->instance(MasterPredictionService::class, $mockService);

        // Simuler que le modèle existe
        Storage::fake('local');
        Storage::disk('local')->put('ml/xgboost_filiere_model.pkl', 'dummy');

        $response = $this->postJson(route('jury.prediction.batch'));

        $response->assertJson([
            'success' => true,
            'data' => [
                'total' => 1,
                'successful' => 1,
                'failed' => 0,
            ],
        ]);
    }

    public function test_student_prediction_interface(): void
    {
        $studentUser = User::factory()->create();
        $studentUser->assignRole('Etudiant');
        $student = Student::factory()->create(['user_id' => $studentUser->id]);

        $this->actingAs($studentUser);

        $mockService = Mockery::mock(MasterPredictionService::class);
        $mockService->shouldReceive('getPrediction')
            ->once()
            ->with(Mockery::on(fn($s) => $s->id === $student->id))
            ->andReturn(['prediction' => 'IA', 'confidence' => 0.9]);
        $this->app->instance(MasterPredictionService::class, $mockService);

        $response = $this->withSession([])->get(route('student.prediction'));

        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('student/master-prediction')
                ->has('student')
                ->has('prediction')
        );
    }

    public function test_get_model_status(): void
    {
        $user = $this->authenticateAs('Jury');

        Storage::fake('local');
        Storage::disk('local')->put('ml/xgboost_filiere_model.pkl', 'dummy');

        $response = $this->getJson(route('jury.prediction.model-status'));

        $response->assertJson([
            'success' => true,
            'data' => ['model_exists' => true],
        ]);
    }

    // ==================== ACCESS CONTROL TESTS ====================

    public function test_non_jury_member_cannot_access_jury_dashboard(): void
    {
        ['user' => $user] = $this->authenticateAsStudent();
        $response = $this->withSession([])->get(route('jury.dashboard'));
        $response->assertStatus(403);
    }

    public function test_non_jury_member_cannot_access_orientation_prediction(): void
    {
        ['user' => $user] = $this->authenticateAsStudent();
        $response = $this->get(route('jury.prediction.interface'));
        $response->assertStatus(403);
    }

    public function test_non_jury_member_cannot_access_results(): void
    {
        ['user' => $user] = $this->authenticateAsStudent();
        $response = $this->withSession([])->get(route('jury.results'));
        $response->assertStatus(403);
    }

    // ==================== BASIC JURY CONTROLLER (Blade views) ====================

    public function test_jury_index_returns_view()
    {
        $user = $this->authenticateAs('Jury');
        $response = $this->get(route('jury.index'));
        $response->assertViewIs('jury::index');
    }

    public function test_jury_create_returns_view()
    {
        $user = $this->authenticateAs('Jury');
        $response = $this->get(route('jury.create'));
        $response->assertViewIs('jury::create');
    }

    public function test_jury_show_returns_view()
    {
        $user = $this->authenticateAs('Jury');
        $jury = Jury::factory()->create();
        $response = $this->get(route('jury.show', $jury->id));
        $response->assertViewIs('jury::show');
    }

    public function test_jury_edit_returns_view()
    {
        $user = $this->authenticateAs('Jury');
        $jury = Jury::factory()->create();
        $response = $this->get(route('jury.edit', $jury->id));
        $response->assertViewIs('jury::edit');
    }
}
