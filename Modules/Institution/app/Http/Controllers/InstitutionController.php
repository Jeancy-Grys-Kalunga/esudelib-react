<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Imports\InstitutionImport;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\Request;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Http\Requests\InstitutionRequest;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use RealRashid\SweetAlert\Facades\Alert;

class InstitutionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        abort_if(Gate::denies('access_institutions'), 403);
        $institutions = Institution::orderBy('id', 'desc')->get();
        return view('institution::institutions.index', [
            'institutions' => $institutions
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

        abort_if(Gate::denies('create_institutions'), 403);

        return view('institution::institutions.form', [
            'institution' => new Institution()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(InstitutionRequest $request)
    {
        abort_if(Gate::denies('create_institutions'), 403);

        $institution_data = $request->except('document');
        $institution = Institution::create($institution_data);

        if ($request->has('document')) {
            foreach ($request->input('document', []) as $file) {
                $institution->addMedia(Storage::path('temp/dropzone/' . $file))->toMediaCollection('images');
            }
        }

          Alert::toast('Institution enregistré avec succès !', 'success');
        return redirect()->route('institutions.index');
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
    public function edit(Institution $institution)
    {
        abort_if(Gate::denies('edit_institutions'), 403);

        return view('institution::institutions.form', [
            'institution' => $institution
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(InstitutionRequest $request, Institution $institution)
    {
        abort_if(Gate::denies('edit_institutions'), 403);

        $institution->update($request->except('document'));

        if ($request->has('document')) {
            if (count($institution->getMedia('images')) > 0) {
                foreach ($institution->getMedia('images') as $media) {
                    if (!in_array($media->file_name, $request->input('document', []))) {
                        $media->delete();
                    }
                }
            }

            $media = $institution->getMedia('images')->pluck('file_name')->toArray();

            foreach ($request->input('document', []) as $file) {
                if (count($media) === 0 || !in_array($file, $media)) {
                    $institution->addMedia(Storage::path('temp/dropzone/' . $file))->toMediaCollection('images');
                }
            }
        }

          Alert::toast('Les informations de l\'institution sont modifiés avec succès !', 'info');

        return redirect()->route('institutions.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Institution $institution)
    {
        abort_if(Gate::denies('delete_institutions'), 403);

        $institution->delete();

          Alert::toast('Institution supprimée avec succès !', 'warning');

        return redirect()->route('institutions.index');
    }

    public function importDataToExcel(Request $request)
    {

        Excel::import(new InstitutionImport, $request->file('excel_file'));

          Alert::toast('Vous avez importer les institutions via un fichier Excel avec succès !', 'success');

        return redirect()->route('institutions.index');
    }
}
