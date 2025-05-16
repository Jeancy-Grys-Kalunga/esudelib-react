<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Imports\InstitutionImport;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\Request;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Http\Requests\InstitutionRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class InstitutionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
      
        if (!auth()->check()) {
        abort(403, 'Non authentifié');
    }

    $user = auth()->user();
    $permissions = $user->getAllPermissionsWithFallback()->toArray();

    // Liste des permissions à vérifier
    $requiredPermissions = [
        'create' => 'create_institutions',
        'edit' => 'edit_institutions',
        'delete' => 'delete_institutions'
    ];

    // Génération dynamique du tableau can
    $can = array_map(
        fn($permission) => in_array($permission, $permissions),
        $requiredPermissions
    );
    
        return Inertia::render('institution/index', [
            'institutions' => Institution::orderBy('id', 'desc')
                ->get()
                ->map(function ($institution) {
                    return [
                        'id' => $institution->id,
                        'name' => $institution->name,
                        'phone' => $institution->phone,
                        'address' => $institution->address,
                        'description' => $institution->description,
                        'image' => $institution->getFirstMediaUrl('images', 'thumb') ?: null,
                        'created_at' => $institution->created_at ? $institution->created_at->format('d/m/Y') : null,
                    ];
                }),
           'can' => $can,
        'permissions' => $permissions,
            'flash' => [
                'message' => session('flash.message'),
                'type' => session('flash.type')
            ]
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(InstitutionRequest $request)
    {
        // abort_if(Gate::denies('create_institutions'), 403);

        $institution = Institution::create($request->validated());

        if ($request->has('document')) {
            foreach ($request->input('document', []) as $file) {
                $institution->addMedia(Storage::path('temp/dropzone/' . $file))->toMediaCollection('images');
            }
        }

        return redirect()->route('institutions.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Institution enregistrée avec succès !'
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(InstitutionRequest $request, Institution $institution)
    {
        // abort_if(Gate::denies('edit_institutions'), 403);

        $institution->update($request->validated());

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

        return redirect()->route('institutions.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => 'Les informations de l\'institution sont modifiées avec succès !'
            ]
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Institution $institution)
    {
        abort_if(Gate::denies('delete_institutions'), 403);

        $institution->delete();

        return redirect()->route('institutions.index')->with([
            'flash' => [
                'type' => 'warning',
                'message' => 'Institution supprimée avec succès !'
            ]
        ]);
    }

    public function importDataToExcel(Request $request)
    {
        Excel::import(new InstitutionImport, $request->file('excel_file'));

        return redirect()->route('institutions.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Importation des institutions via Excel réussie !'
            ]
        ]);
    }
}
