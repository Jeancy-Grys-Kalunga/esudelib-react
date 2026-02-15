<?php

namespace Tests\Unit\Modules\Institution;

use Tests\TestCase;
use Modules\Institution\Entities\{Course, Program, Department, Institution, Promotion};
use Modules\Teacher\Entities\Teacher;
use Modules\Student\Entities\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

class CourseControllerTest extends TestCase
{
    public function test_index_displays_courses_list(): void
    {
        // Arrange
        $admin = $this->authenticateAsAdmin();
        Course::factory()->count(10)->create();

        // Act
        $response = $this->get(route('courses.index'));

        // Assert
        $response->assertStatus(200);
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('course/index')
                ->has('courses')
        );
    }

    public function test_store_creates_new_course(): void
    {
        // Arrange
        $admin = $this->authenticateAsAdmin();

        // Act
        $response = $this->postJson(route('courses.store'), [
            'title' => 'Mathematics 101',
            'orientation' => 'General'
        ]);

        // Assert
        $response->assertRedirect(route('courses.index'));
        $this->assertDatabaseHas('courses', [
            'title' => 'Mathematics 101'
        ]);
    }

    public function test_update_modifies_course_data(): void
    {
        // Arrange
        $admin = $this->authenticateAsAdmin();
        $course = Course::factory()->create(['title' => 'Old Title']);

        // Act
        $response = $this->putJson(route('courses.update', $course->id), [
            'title' => 'New Title',
            'orientation' => 'Updated'
        ]);

        // Assert
        $response->assertRedirect(route('courses.index'));
        $this->assertDatabaseHas('courses', [
            'id' => $course->id,
            'title' => 'New Title'
        ]);
    }

    public function test_destroy_deletes_course(): void
    {
        // Arrange
        $admin = $this->authenticateAsAdmin();
        $course = Course::factory()->create();

        // Act
        $response = $this->deleteJson(route('courses.destroy', $course->id));

        // Assert
        $response->assertRedirect(route('courses.index'));
        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
    }

    public function test_unauthorized_user_cannot_create_course(): void
    {
        // Arrange
        ['user' => $user] = $this->authenticateAsStudent();

        // Act
        $response = $this->postJson(route('courses.store'), [
            'title' => 'Test Course',
            'orientation' => 'General'
        ]);

        // Assert
        $response->assertStatus(403);
    }
}
