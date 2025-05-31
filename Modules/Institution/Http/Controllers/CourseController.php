<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\CourseCategory;
use Modules\Institution\Http\Requests\StoreCourseRequest;
use Modules\Institution\Http\Requests\UpdateCourseRequest;
use Spatie\Permission\Models\Permission;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('access_courses')) {
            abort(403, 'Action non autorisée');
        }

        $user = auth()->user();
        $user->load('permissions', 'roles.permissions');

        // Gestion des permissions
        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_courses',
            'edit'   => 'edit_courses',
            'delete' => 'delete_courses',
            'access' => 'access_courses',
            'import' => 'create_courses',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        // Construction de la requête
        $query = Course::with(['institution', 'category'])
            ->orderByDesc('id');

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereIn('institution_id', $institutionIds);
        }

        $institutions = $user->hasRole('Secrétaire Académique')
            ? $user->institutions()->pluck('id')
            : Institution::pluck('id');

        // Formatage des données pour Inertia
        $courses = $query->get()->map(function ($course) {
            return [
                'id' => $course->id,
                'title' => $course->title,
                'credits' => $course->credits,
                'institution' => $course->institution->name,
                'category' => $course->category->name ?? 'Non classé',
                'created_at' => $course->created_at->translatedFormat('d F Y'),
            ];
        });

        return Inertia::render('course/index', [
            'courses' => $courses,
            'can' => $can,
            'filters' => $request->only(['search']),
            'flash' => $this->getFlashMessages(),
            'institutions' => Institution::whereIn('id', $institutions)->get(['id', 'name']),
            'categories' => CourseCategory::all(['id', 'name']),
        ]);
    }

    public function create()
    {
        $user = auth()->user();

        $institutions = Institution::when(
            $user->hasRole('Secrétaire Académique'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        $categories = CourseCategory::all(['id', 'name']);

        return Inertia::render('institution::courses/Form', [
            'course' => new Course(),
            'institutions' => $institutions,
            'categories' => $categories,
        ]);
    }

    public function store(StoreCourseRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('create_courses')) {
            abort(403, 'Action non autorisée');
        }

        Course::create([
            'title' => $request->title,
            'credits' => $request->credits,
            'institution_id' => $request->institution_id,
            'course_category_id' => $request->course_category_id,
        ]);

        return redirect()->route('courses.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Cours enregistré avec succès !',
            ],
        ]);
    }

    public function edit(Course $course)
    {
        $user = auth()->user();

        $institutions = Institution::when(
            $user->hasRole('Secrétaire Académique'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        $categories = CourseCategory::all(['id', 'name']);

        return Inertia::render('course/index', [
            'course' => $course,
            'institutions' => $institutions,
            'categories' => $categories,
        ]);
    }

    public function update(UpdateCourseRequest $request, Course $course)
    {
        if (!auth()->user()->hasPermissionTo('edit_courses')) {
            abort(403, 'Action non autorisée');
        }

        $course->update([
            'title' => $request->title,
            'credits' => $request->credits,
            'institution_id' => $request->institution_id,
            'course_category_id' => $request->course_category_id,
        ]);

        return redirect()->route('courses.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => 'Cours modifié avec succès !',
            ],
        ]);
    }

    public function destroy(Course $course)
    {
        if (!auth()->user()->hasPermissionTo('delete_courses')) {
            abort(403, 'Action non autorisée');
        }

        $course->delete();

        return redirect()->route('courses.index')->with([
            'flash' => [
                'type' => 'warning',
                'message' => 'Cours supprimé avec succès !',
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