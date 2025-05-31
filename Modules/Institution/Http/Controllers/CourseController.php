<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Institution;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Modules\Institution\Http\Requests\CourseRequest;
use Modules\Institution\Http\Requests\MassCourseRequest;
use RealRashid\SweetAlert\Facades\Alert;

class CourseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        abort_if(Gate::denies('access_courses'), 403);

        $user = auth()->user();

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');

            $courses = Course::whereIn('institution_id', $institutionIds)
                ->orderBy('id', 'desc')
                ->get();
        } else {
            $courses = Course::orderBy('id', 'desc')->get();
        }

        return view('institution::courses.index', [
            'courses' => $courses
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

        abort_if(Gate::denies('create_courses'), 403);

        $user = auth()->user();
        $institutions = [];

        if ($user->hasRole('Secrétaire Académique')) {
            $institutions = $user->institutions()->get();
        } else {
            $institutions = Institution::all();
        }

        return view('institution::courses.create', [
            'institutions' => $institutions
        ]);
    }

    public function mass_create()
    {
        abort_if(Gate::denies('create_courses'), 403);

        $user = auth()->user();
        $institutions = [];

        if ($user->hasRole('Secrétaire Académique')) {
            $institutions = $user->institutions()->get();
        } else {
            $institutions = Institution::all();
        }

        return view('institution::courses.mass-create', [
            'institutions' => $institutions
        ]);
    }


    /**
     * Store multiple courses in storage.
     */
    public function massStore(Request $request)
    {
        abort_if(Gate::denies('create_courses'), 403);

        // Validation des données
        $validator = Validator::make($request->all(), [
            'institution_id' => 'required|exists:institutions,id',
            'titles' => 'required|array|min:1',
            'titles.*' => 'required|string|min:3|max:255',
            'credits' => 'required|array|min:1',
            'credits.*' => 'required|integer|min:1|max:10',
            'contents' => 'required|array|min:1',
            'contents.*' => 'required|string|min:10',
            'statuses' => 'sometimes|array',
            'statuses.*' => 'sometimes|in:active,inactive'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        // Vérification des permissions
        $user = auth()->user();
        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            if (!$institutionIds->contains($request->institution_id)) {
                abort(403, 'Unauthorized action.');
            }
        }

        // Enregistrement des cours
        $successCount = 0;
        $errors = [];

        foreach ($request->titles as $index => $title) {
            try {
                $course = Course::create([
                    'title' => $title,
                    'content' => $request->contents[$index],
                    'credits' => $request->credits[$index],
                    'institution_id' => $request->institution_id
                ]);

                if ($course) {
                    $successCount++;
                }
            } catch (\Exception $e) {
                $errors[] = "Erreur lors de la création du cours '{$title}': " . $e->getMessage();
            }
        }

        // Retour des résultats
        if ($successCount > 0) {
            $message = $successCount . ' cours ont été créés avec succès.';
            if (!empty($errors)) {
                $message .= ' ' . count($errors) . ' erreurs sont survenues.';
            }
              Alert::toast($message, 'success');
        } else {
              Alert::toast('Aucun cours n\'a pu être créé. Veuillez vérifier les données.', 'error');
        }

        if (!empty($errors)) {
            return redirect()->back()->with('errors', $errors);
        }

        return redirect()->route('courses.index');
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(CourseRequest $request)
    {
        abort_if(Gate::denies('create_courses'), 403);

        // Vérification que l'institution est bien celle du secrétaire académique
        $user = auth()->user();
        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            if (!$institutionIds->contains($request->institution_id)) {
                abort(403, 'Unauthorized action.');
            }
        }

        $course = Course::create([
            'title' => $request->title,
            'content' => $request->content,
            'credits' => $request->credits,
            'institution_id' => $request->institution_id
        ]);

        if ($course) {
              Alert::toast('Cours enregistrée avec succès !', 'success');
        } else {
              Alert::toast("Une erreur survenue lors de l'enregistrement du cours", 'error');
        }

        return redirect()->route('courses.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(Course $course)
    {
        // Vérification que le cours appartient à une institution gérée par le secrétaire
        $user = auth()->user();
        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            if (!$institutionIds->contains($course->institution_id)) {
                abort(403, 'Unauthorized action.');
            }
        }

        return view('course::courses.show', compact('course'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Course $course)
    {
        abort_if(Gate::denies('edit_courses'), 403);

        $user = auth()->user();

        // Vérification des permissions
        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            if (!$institutionIds->contains($course->institution_id)) {
                abort(403, 'Unauthorized action.');
            }
            $institutions = $user->institutions()->get();
        } else {
            $institutions = Institution::all();
        }

        return view('institution::courses.edit', [
            'course' => $course,
            'institutions' => $institutions
        ]);
    }


    public function massEdit(Request $request)
    {
        $courseIds = explode(',', $request->courses);
        $courses = Course::whereIn('id', $courseIds)->get();

        if ($courses->isEmpty()) {
            return redirect()->route('courses.index')->with('error', 'Aucun cours sélectionné.');
        }

        $institutions = Institution::all();
        return view('courses.mass-edit', compact('courses', 'institutions'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CourseRequest $request, Course $course)
    {
        abort_if(Gate::denies('edit_courses'), 403);
        // Vérification des permissions
        $user = auth()->user();
        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            if (
                !$institutionIds->contains($request->institution_id) ||
                !$institutionIds->contains($course->institution_id)
            ) {
                abort(403, 'Unauthorized action.');
            }
        }

       $updatedCourse = $course->update([
            'title' => $request->title,
            'content' => $request->content,
            'credits' => $request->credits,
            'institution_id' => $request->institution_id
        ]);

        if ($updatedCourse) {
              Alert::toast('Cours modifié avec succès !', 'success');
        } else {
              Alert::toast("Une erreur survenue lors de la modification du cours", 'error');
        }

        return redirect()->route('courses.index');
    }


    public function massUpdate(MassCourseRequest $request)
    {
        abort_if(Gate::denies('edit_courses'), 403);
        $user = auth()->user();
        $validated = $request->validated();

        // Vérification supplémentaire pour le Secrétaire Académique
        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');

            // Vérification finale pour prévenir toute modification non autorisée malgré la validation
            if (!$institutionIds->contains($validated['institution_id'])) {
                abort(403, 'Unauthorized action.');
            }
        }

        // Mise à jour des cours existants
        foreach ($validated['ids'] as $index => $id) {
            $course = Course::find($id);

            if ($course) {
                // Vérification supplémentaire pour le Secrétaire Académique
                if ($user->hasRole('Secrétaire Académique') && !$institutionIds->contains($course->institution_id)) {
                    continue; // On saute ce cours non autorisé
                }

                $course->update([
                    'title' => $validated['titles'][$index],
                    'credits' => $validated['credits'][$index],
                    'content' => $validated['contents'][$index],
                    'institution_id' => $validated['institution_id']
                ]);
            }
        }

        // Création des nouveaux cours
        $newCoursesCount = count($validated['titles']) - count($validated['ids']);
        if ($newCoursesCount > 0) {
            for ($i = count($validated['ids']); $i < count($validated['titles']); $i++) {
                Course::create([
                    'title' => $validated['titles'][$i],
                    'credits' => $validated['credits'][$i],
                    'content' => $validated['contents'][$i],
                    'institution_id' => $validated['institution_id']
                ]);
            }
        }

          Alert::toast('Cours mis à jour avec succès.', 'success');

        return redirect()->route('courses.index');
    }




    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Course $course)
    {
        abort_if(Gate::denies('delete_courses'), 403);
        // Vérification des permissions
        $user = auth()->user();
        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            if (!$institutionIds->contains($course->institution_id)) {
                abort(403, 'Unauthorized action.');
            }
        }

        $course->delete();

        if ($course) {
              Alert::toast('Cours supprimée avec succès !', 'success');
        } else {
              Alert::toast("Une erreur survenue lors de la suppression du cours", 'error');
        }

        return redirect()->route('courses.index');
    }
}
