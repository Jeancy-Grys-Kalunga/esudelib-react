<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Institution\Entities\UnitsTeaching;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Modules\Institution\Http\Requests\UnitsTeachingRequest;
use Modules\Institution\Http\Requests\MassUnitsTeachingRequest;
use RealRashid\SweetAlert\Facades\Alert;

class UnitsTeachingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        abort_if(Gate::denies('access_unit_teachings'), 403);

        $user = auth()->user();

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');

            $units = UnitsTeaching::whereHas('course', function($query) use ($institutionIds) {
                    $query->whereIn('institution_id', $institutionIds);
                })
                ->with(['course', 'promotion'])
                ->orderBy('id', 'desc')
                ->get();
        } else {
            $units = UnitsTeaching::with(['course', 'promotion'])->orderBy('id', 'desc')->get();
        }

        return view('institution::units-teachings.index', [
            'units' => $units
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        abort_if(Gate::denies('create_unit_teachings'), 403);

        $user = auth()->user();
        $courses = [];
        $promotions = [];

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            $courses = Course::whereIn('institution_id', $institutionIds)->get();
            $promotions = Promotion::whereIn('institution_id', $institutionIds)->get();
        } else {
            $courses = Course::all();
            $promotions = Promotion::all();
        }

        return view('institution::units-teachings.create', [
            'courses' => $courses,
            'promotions' => $promotions
        ]);
    }

    public function mass_create()
    {
        abort_if(Gate::denies('create_unit_teachings'), 403);

        $user = auth()->user();
        $courses = [];
        $promotions = [];

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            $courses = Course::whereIn('institution_id', $institutionIds)->get();
            $promotions = Promotion::whereIn('institution_id', $institutionIds)->get();
        } else {
            $courses = Course::all();
            $promotions = Promotion::all();
        }

        return view('institution::units-teachings.mass-create', [
            'courses' => $courses,
            'promotions' => $promotions
        ]);
    }

    /**
     * Store multiple units in storage.
     */
    public function massStore(Request $request)
    {
        abort_if(Gate::denies('create_unit_teachings'), 403);

        $validator = Validator::make($request->all(), [
            'course_id' => 'required|exists:courses,id',
            'promotion_id' => 'required|exists:promotions,id',
            'titles' => 'required|array|min:1',
            'titles.*' => 'required|string|min:3|max:255',
            'cms' => 'required|array|min:1',
            'cms.*' => 'required|integer|min:0',
            'tps' => 'required|array|min:1',
            'tps.*' => 'required|integer|min:0',
            'tds' => 'required|array|min:1',
            'tds.*' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = auth()->user();
        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            
            $course = Course::find($request->course_id);
            $promotion = Promotion::find($request->promotion_id);
            
            if (!$institutionIds->contains($course->institution_id) || 
                !$institutionIds->contains($promotion->institution_id)) {
                abort(403, 'Unauthorized action.');
            }
        }

        $successCount = 0;
        $errors = [];

        foreach ($request->titles as $index => $title) {
            try {
                $unit = UnitsTeaching::create([
                    'title' => $title,
                    'cm' => $request->cms[$index],
                    'tp' => $request->tps[$index],
                    'td' => $request->tds[$index],
                    'course_id' => $request->course_id,
                    'promotion_id' => $request->promotion_id
                ]);

                if ($unit) {
                    $successCount++;
                }
            } catch (\Exception $e) {
                $errors[] = "Erreur lors de la création de l'unité '{$title}': " . $e->getMessage();
            }
        }

        if ($successCount > 0) {
            $message = $successCount . ' unités ont été créées avec succès.';
            if (!empty($errors)) {
                $message .= ' ' . count($errors) . ' erreurs sont survenues.';
            }
            Alert::toast($message, 'success');
        } else {
            Alert::toast('Aucune unité n\'a pu être créée. Veuillez vérifier les données.', 'error');
        }

        if (!empty($errors)) {
            return redirect()->back()->with('errors', $errors);
        }

        return redirect()->route('units-teaching.index');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UnitsTeachingRequest $request)
    {
        abort_if(Gate::denies('create_unit_teachings'), 403);

        $user = auth()->user();
        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            
            $course = Course::find($request->course_id);
            $promotion = Promotion::find($request->promotion_id);
            
            if (!$institutionIds->contains($course->institution_id) || 
                !$institutionIds->contains($promotion->institution_id)) {
                abort(403, 'Unauthorized action.');
            }
        }

        $unit = UnitsTeaching::create([
            'title' => $request->title,
            'cm' => $request->cm,
            'tp' => $request->tp,
            'td' => $request->td,
            'course_id' => $request->course_id,
            'promotion_id' => $request->promotion_id
        ]);

        if ($unit) {
            Alert::toast('Unité d\'enseignement enregistrée avec succès !', 'success');
        } else {
            Alert::toast("Une erreur est survenue lors de l'enregistrement", 'error');
        }

        return redirect()->route('units-teaching.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(UnitsTeaching $unitTeaching)
    {
        $user = auth()->user();
        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            if (!$institutionIds->contains($unitTeaching->course->institution_id) ||
                !$institutionIds->contains($unitTeaching->promotion->institution_id)) {
                abort(403, 'Unauthorized action.');
            }
        }

        return view('institution::units-teaching.show', compact('unitTeaching'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(UnitsTeaching $unitTeaching)
    {
        abort_if(Gate::denies('edit_unit_teachings'), 403);

        $user = auth()->user();
        $courses = [];
        $promotions = [];

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            
            if (!$institutionIds->contains($unitTeaching->course->institution_id) ||
                !$institutionIds->contains($unitTeaching->promotion->institution_id)) {
                abort(403, 'Unauthorized action.');
            }
            
            $courses = Course::whereIn('institution_id', $institutionIds)->get();
            $promotions = Promotion::whereIn('institution_id', $institutionIds)->get();
        } else {
            $courses = Course::all();
            $promotions = Promotion::all();
        }

        return view('institution::units-teaching.edit', [
            'unit' => $unitTeaching,
            'courses' => $courses,
            'promotions' => $promotions
        ]);
    }

    public function massEdit(Request $request)
    {
        $unitIds = explode(',', $request->units);
        $units = UnitsTeaching::whereIn('id', $unitIds)->get();

        if ($units->isEmpty()) {
            return redirect()->route('units-teaching.index')->with('error', 'Aucune unité sélectionnée.');
        }

        $courses = Course::all();
        $promotions = Promotion::all();
        return view('institution::units-teaching.mass-edit', compact('units', 'courses', 'promotions'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UnitsTeachingRequest $request, UnitsTeaching $unitTeaching)
    {
        abort_if(Gate::denies('edit_unit_teachings'), 403);

        $user = auth()->user();
        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            
            $course = Course::find($request->course_id);
            $promotion = Promotion::find($request->promotion_id);
            
            if (!$institutionIds->contains($course->institution_id) || 
                !$institutionIds->contains($promotion->institution_id) ||
                !$institutionIds->contains($unitTeaching->course->institution_id) ||
                !$institutionIds->contains($unitTeaching->promotion->institution_id)) {
                abort(403, 'Unauthorized action.');
            }
        }

        $updated = $unitTeaching->update([
            'title' => $request->title,
            'cm' => $request->cm,
            'tp' => $request->tp,
            'td' => $request->td,
            'course_id' => $request->course_id,
            'promotion_id' => $request->promotion_id
        ]);

        if ($updated) {
            Alert::toast('Unité d\'enseignement modifiée avec succès !', 'success');
        } else {
            Alert::toast("Une erreur est survenue lors de la modification", 'error');
        }

        return redirect()->route('units-teaching.index');
    }

    public function massUpdate(MassUnitsTeachingRequest $request)
    {
        abort_if(Gate::denies('edit_unit_teachings'), 403);
        $user = auth()->user();
        $validated = $request->validated();

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            
            $course = Course::find($validated['course_id']);
            $promotion = Promotion::find($validated['promotion_id']);
            
            if (!$institutionIds->contains($course->institution_id) || 
                !$institutionIds->contains($promotion->institution_id)) {
                abort(403, 'Unauthorized action.');
            }
        }

        foreach ($validated['ids'] as $index => $id) {
            $unit = UnitsTeaching::find($id);

            if ($unit) {
                if ($user->hasRole('Secrétaire Académique') && 
                    (!$institutionIds->contains($unit->course->institution_id) ||
                     !$institutionIds->contains($unit->promotion->institution_id))) {
                    continue;
                }

                $unit->update([
                    'title' => $validated['titles'][$index],
                    'cm' => $validated['cms'][$index],
                    'tp' => $validated['tps'][$index],
                    'td' => $validated['tds'][$index],
                    'course_id' => $validated['course_id'],
                    'promotion_id' => $validated['promotion_id']
                ]);
            }
        }

        $newUnitsCount = count($validated['titles']) - count($validated['ids']);
        if ($newUnitsCount > 0) {
            for ($i = count($validated['ids']); $i < count($validated['titles']); $i++) {
                UnitsTeaching::create([
                    'title' => $validated['titles'][$i],
                    'cm' => $validated['cms'][$i],
                    'tp' => $validated['tps'][$i],
                    'td' => $validated['tds'][$i],
                    'course_id' => $validated['course_id'],
                    'promotion_id' => $validated['promotion_id']
                ]);
            }
        }

        Alert::toast('Unités mises à jour avec succès.', 'success');
        return redirect()->route('units-teaching.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(UnitsTeaching $unitTeaching)
    {
        abort_if(Gate::denies('delete_unit_teachings'), 403);

        $user = auth()->user();
        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('institutions.id');
            if (!$institutionIds->contains($unitTeaching->course->institution_id) ||
                !$institutionIds->contains($unitTeaching->promotion->institution_id)) {
                abort(403, 'Unauthorized action.');
            }
        }

        $unitTeaching->delete();

        if ($unitTeaching) {
            Alert::toast('Unité d\'enseignement supprimée avec succès !', 'success');
        } else {
            Alert::toast("Une erreur est survenue lors de la suppression", 'error');
        }

        return redirect()->route('units-teaching.index');
    }
}