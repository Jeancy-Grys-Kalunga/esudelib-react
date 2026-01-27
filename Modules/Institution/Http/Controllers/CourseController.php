<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Imports\CoursesImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Institution\Entities\Course;
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
        $query = Course::query()->orderByDesc('id');

        // Formatage des données pour Inertia
        $courses = $query->get()->map(function ($course) {
            return [
                'id' => $course->id,
                'title' => $course->title,
                'orientation' => $course->orientation,
                'created_at' => $course->created_at->translatedFormat('d F Y'),
            ];
        });

        return Inertia::render('course/index', [
            'courses' => $courses,
            'can' => $can,
            'filters' => $request->only(['search']),
            'flash' => $this->getFlashMessages(),
        ]);
    }

    public function store(StoreCourseRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('create_courses')) {
            abort(403, 'Action non autorisée');
        }

        Course::create([
            'title' => $request->title,
            'orientation' => $request->orientation,
        ]);

        return redirect()->route('courses.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Cours enregistré avec succès !',
            ],
        ]);
    }

    public function update(UpdateCourseRequest $request, Course $course)
    {
        if (!auth()->user()->hasPermissionTo('edit_courses')) {
            abort(403, 'Action non autorisée');
        }

        $course->update([
            'title' => $request->title,
            'orientation' => $request->orientation,
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

    public function import(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('create_courses')) {
            abort(403, 'Action non autorisée');
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        try {
            $import = new CoursesImport();

            Excel::import($import, $request->file('file'));

            $imported = $import->getImported();
            $skipped = $import->getSkipped();
            $duplicates = $import->getDuplicates();

            $message = "Importation terminée : {$imported} cours importés";

            if ($skipped > 0) {
                $message .= ", {$skipped} doublons ignorés";
            }

            return redirect()->route('courses.index')->with([
                'flash' => [
                    'type' => 'success',
                    'message' => $message,
                    'duplicates' => $duplicates,
                ],
            ]);
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $errorMessages = [];

            foreach ($failures as $failure) {
                $errorMessages[] = "Ligne {$failure->row()}: " . implode(', ', $failure->errors());
            }

            return redirect()->route('courses.index')->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Erreur de validation: ' . implode(' | ', $errorMessages),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de l\'importation des cours: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());

            return redirect()->route('courses.index')->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Erreur lors de l\'importation: ' . $e->getMessage(),
                ],
            ]);
        }
    }

    private function getFlashMessages()
    {
        return [
            'message' => session('flash.message'),
            'type' => session('flash.type'),
        ];
    }
}
