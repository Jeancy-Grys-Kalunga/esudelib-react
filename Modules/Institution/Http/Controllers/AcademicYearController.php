<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Institution\Entities\AcademicYear;

class AcademicYearController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = AcademicYear::query();

        if ($request->input('search')) {
            $query->where('title', 'like', '%' . $request->input('search') . '%');
        }

        $academicYears = $query->latest()->get();

        return Inertia::render('academic-year/index', [
            'academicYears' => $academicYears,
            'filters' => $request->only(['search']),
            'can' => [
                'create' => true,
                'edit' => true,
                'delete' => true,
                'access' => true,
            ],
            'flash' => [
                'type' => session('type'),
                'message' => session('message'),
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'title' => 'required|string|max:255|unique:academic_years,title',
        ]);

        AcademicYear::create([
            'title' => $request->title
        ]);

        return redirect()->back()->with([
            'type' => 'success',
            'message' => 'Année académique créée avec succès.'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id): RedirectResponse
    {
        $academicYear = AcademicYear::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255|unique:academic_years,title,' . $id,
        ]);

        $academicYear->update([
            'title' => $request->title
        ]);

        return redirect()->back()->with([
            'type' => 'success',
            'message' => 'Année académique mise à jour avec succès.'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id): RedirectResponse
    {
        $academicYear = AcademicYear::findOrFail($id);
        $academicYear->delete();

        return redirect()->back()->with([
            'type' => 'success',
            'message' => 'Année académique supprimée avec succès.'
        ]);
    }
}
