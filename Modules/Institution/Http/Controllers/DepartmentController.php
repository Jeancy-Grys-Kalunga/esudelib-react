<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Modules\Institution\Entities\Department;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Http\Requests\DepartmentRequest;
use RealRashid\SweetAlert\Facades\Alert;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        abort_if(Gate::denies('access_departements'), 403);
        $departments = Department::orderBy('id', 'desc')->get();
        return view('institution::departments.index', [
            'departments' => $departments
        ]);
    
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('institution::departments.form', [
            'department' => new Department(),
            'institutions' => Institution::select('id', 'name')->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DepartmentRequest $request)
    {
        abort_if(Gate::denies('create_departements'), 403);


        $department = Department::create([
            'title' => $request->title,
            'institution_id' => $request->institution_id
        ]);

        if($department)
        {
              Alert::toast('Enseignant enregistré avec succès !', 'success');

        }else{
              Alert::toast("Une erreur survenue lors de l'enregistrement du départment", 'error');
        }
    
        return redirect()->route('departments.index');
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
    public function edit(Department $department)
    {
        abort_if(Gate::denies('edit_departements'), 403);

        $institutions = Institution::select('id', 'name')->get();

        return view('institution::departments.form', [
            'department' => $department,
            'institutions' => $institutions
        ]);
    }
   

    /**
     * Update the specified resource in storage.
     */
    public function update(DepartmentRequest $request, Department $department)
    {
        abort_if(Gate::denies('edit_departements'), 403);

        $department = Department::findOrFail($department->id);
        $department->update([
            'title' => $request->title,
            'institution_id' => $request->institution_id
        ]);

        if($department)
        {
              Alert::toast('Les infos du département modifié  avec succès !', 'success');

        }else{
              Alert::toast("Une erreur survenue lors de la modification des infos du départment", 'error');
        }
    
        return redirect()->route('departments.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Department $department)
    {
        abort_if(Gate::denies('delete_departements'), 403);

        $department = Department::findOrFail($department->id);
        $department->delete();

        if($department)
        {
              Alert::toast('Le département supprimé avec succès !', 'success');

        }else{
              Alert::toast("Une erreur survenue lors de la suppression du départment", 'error');
        }
    
        return redirect()->route('departments.index');
    }
}
