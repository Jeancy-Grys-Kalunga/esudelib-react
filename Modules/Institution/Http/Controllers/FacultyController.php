<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Modules\Institution\Entities\Faculty;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Http\Requests\FacultyRequest;
use RealRashid\SweetAlert\Facades\Alert;

class FacultyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        abort_if(Gate::denies('access_faculties'), 403);
        $faculties = Faculty::orderBy('id', 'desc')->get();
        return view('institution::faculties.index', [
            'faculties' => $faculties
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        abort_if(Gate::denies('create_faculties'), 403);
        return view('institution::faculties.form', [
            'faculty' => new Faculty(),
            'institutions' => Institution::select('id', 'name')->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(FacultyRequest $request)
    {
        abort_if(Gate::denies('create_faculties'), 403);

        $faculty = Faculty::create($request->validated());

        if ($faculty) {
              Alert::toast('Faculté enregistrée avec succès !', 'success');
        } else {
              Alert::toast("Une erreur survenue lors de l'enregistrement de la faculté", 'error');
        }

        return redirect()->route('faculties.index');
    }

    /**
     * Show the specified resource.
     */
    public function show($id)
    {
        return view('institution::show');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Faculty $faculty)
    {
        abort_if(Gate::denies('edit_faculties'), 403);
        $faculty = Faculty::findOrFail($faculty->id);
        return view('institution::faculties.form', [
            'faculty' => $faculty,
            'institutions' => Institution::select('id', 'name')->get()
        ]); 
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(FacultyRequest $request, Faculty $faculty)
    {
        abort_if(Gate::denies('edit_faculties'), 403);

        $faculty = Faculty::findOrFail($faculty->id);
        $faculty->update($request->validated());

        if($faculty)
        {
              Alert::toast('Les infos de la faculté modifié  avec succès !', 'success');

        }else{
              Alert::toast("Une erreur survenue lors de la modification des infos de la faculté", 'error');
        }
    
        return redirect()->route('faculties.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Faculty $faculty)
    {
        abort_if(Gate::denies('delete_faculties'), 403);

        $faculty = Faculty::findOrFail($faculty);
        $faculty->delete();

        if($faculty)
        {
              Alert::toast('Faculté supprimée avec succès !', 'success');

        }else{
              Alert::toast("Une erreur survenue lors de la suppression de la faculté", 'error');
        }
    
        return redirect()->route('faculties.index');
    }
}
