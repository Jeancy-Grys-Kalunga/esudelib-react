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
use Spatie\Permission\Models\Permission;

class InstitutionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        if (!auth()->user()->hasPermissionTo('access_institutions')) {
            abort(403, 'Action non autorisée');
        }

        $user = auth()->user();
        
        // Chargement explicite des relations de permissions
        $user->load('permissions', 'roles.permissions');
        
        // Récupération des permissions avec fallback pour Super Admin
        $permissions = $user->hasRole('Super Admin') 
            ? Permission::pluck('name')->toArray() 
            : $user->getAllPermissions()->pluck('name')->toArray();

        // Liste des permissions à vérifier
        $requiredPermissions = [
            'create' => 'create_institutions',
            'edit' => 'edit_institutions',
            'delete' => 'delete_institutions',
            'access' => 'access_institutions'
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
        // Vérification de permission avec Gate et fallback
        if (!auth()->user()->hasPermissionTo('create_institutions')) {
            abort(403, 'Action non autorisée');
        }

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
        // Vérification de permission avec Gate et fallback
        if (!auth()->user()->hasPermissionTo('edit_institutions')) {
            abort(403, 'Action non autorisée');
        }

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
        // Vérification de permission avec Gate et fallback
        if (!auth()->user()->hasPermissionTo('delete_institutions')) {
            abort(403, 'Action non autorisée');
        }

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
        // Vérification de permission avec Gate et fallback
        if (!auth()->user()->hasPermissionTo('create_institutions')) {
            abort(403, 'Action non autorisée');
        }

        $request->validate([
            'excel_file' => 'required|file|mimes:xls,xlsx'
        ]);

        Excel::import(new InstitutionImport, $request->file('excel_file'));

        return redirect()->route('institutions.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Importation des institutions via Excel réussie !'
            ]
        ]);
    }
}