<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
// use Devrabiul\AlertMagic\Facades\Alert;
use Modules\Institution\Entities\Program;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Department;
use Modules\Institution\Entities\Faculty;
use Modules\Institution\Entities\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Modules\Institution\Http\Requests\ProgramRequest;
use RealRashid\SweetAlert\Facades\Alert;

class ProgramController extends Controller
{
    public function index()
    {
        // abort_if(Gate::denies('access_programs'), 403);

        $user = auth()->user();

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            $programs = Program::whereIn('institution_id', $institutionIds)
                ->with(['institution', 'department', 'faculty', 'courses'])
                ->latest()
                ->get();
        } else {
            $programs = Program::with(['institution', 'department', 'faculty', 'courses'])->latest()->get();
        }

        return view('institution::programs.index', ['programs' => $programs]);
    }

    public function create()
    {
        abort_if(Gate::denies('create_programs'), 403);

        $user = auth()->user();
        $institutions = $user->hasRole('Secrétaire Académique') ?
            $user->institutions()->get() :
            Institution::all();

        return view('institution::programs.create', ['institutions' => $institutions]);
    }

    public function store(ProgramRequest $request)
    {
        abort_if(Gate::denies('create_programs'), 403);

        $user = auth()->user();

        // Vérification des permissions
        if (
            $user->hasRole('Secrétaire Académique') &&
            !$user->institutions()->where('id', $request->institution_id)->exists()
        ) {
            abort(403);
        }

        try {
            DB::beginTransaction();

            // Création du programme
            $program = Program::create([
                'content' => $request->content,
                'institution_id' => $request->institution_id,
                'department_id' => $request->department_id,
                'faculty_id' => $request->faculty_id,
            ]);

            // Association des cours
            if ($request->has('courses')) {
                $program->courses()->sync($request->courses);
            }

            DB::commit();

              Alert::toast('Programme créé avec succès!', 'success');
            return redirect()->route('programs.index');
        } catch (\Exception $e) {
            DB::rollBack();
              Alert::toast("Erreur lors de la création du programme: " . $e->getMessage(), 'error');
            return redirect()->back()->withInput();
        }
    }

    public function edit(Program $program)
    {
        abort_if(Gate::denies('edit_programs'), 403);

        $user = auth()->user();
        if ($user->hasRole('Secrétaire Académique') && !$user->institutions->contains($program->institution_id)) {
            abort(403);
        }

        $institutions = $user->hasRole('Secrétaire Académique') ?
            $user->institutions()->get() :
            Institution::all();

        $departments = Department::where('institution_id', $program->institution_id)->get();
        $faculties = Faculty::where('department_id', $program->department_id)->get();
        $courses = Course::where('faculty_id', $program->faculty_id)->get();

        return view('institution::programs.edit', compact(
            'program',
            'institutions',
            'departments',
            'faculties',
            'courses'
        ));
    }

    public function update(ProgramRequest $request, Program $program)
    {
        if (
            Gate::denies('edit_programs') ||
            (auth()->user()->hasRole('Secrétaire Académique') &&
                !auth()->user()->institutions->contains($request->institution_id))
        ) {
            abort(403);
        }

        $program->update($request->validated());
        $program->courses()->sync($request->courses);

          Alert::toast('Programme mis à jour avec succès!', 'success');
        return redirect()->route('programs.index');
    }

    public function destroy(Program $program)
    {
        abort_if(Gate::denies('delete_programs'), 403);

        if (
            auth()->user()->hasRole('Secrétaire Académique') &&
            !auth()->user()->institutions->contains($program->institution_id)
        ) {
            abort(403);
        }

        $program->delete();
          Alert::toast('Programme supprimé avec succès!', 'success');
        return redirect()->route('programs.index');
    }


    public function getDepartments(Institution $institution)
    {
        return response()->json($institution->departments()->get(['id', 'title as name']));
    }

    public function getFaculties(Institution $institution)
    {
        return response()->json($institution->faculties()->get(['id', 'title as name']));
    }

    public function getCourses(Institution $institution)
    {
        return response()->json($institution->courses()->get(['id', 'title as name']));
    }
}
