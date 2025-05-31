<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Imports\InstitutionImport;
use Carbon\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\Request;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Http\Requests\InstitutionRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Validator;
use Modules\Institution\Http\Requests\UpdateInstitutionRequest;

class InstitutionController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('access_institutions')) {
            abort(403, 'Action non autorisée');
        }

        $user = auth()->user();
        $user->load('permissions', 'roles.permissions');

        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_institutions',
            'edit' => 'edit_institutions',
            'delete' => 'delete_institutions',
            'access' => 'access_institutions',
            'import' => 'create_institutions'
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        // Récupérer TOUTES les institutions (pour la recherche côté client)
        $allInstitutions = Institution::orderBy('created_at', 'desc')->get()
            ->map(function ($institution) {
                return [
                    'id' => $institution->id,
                    'name' => $institution->name,
                    'phone' => $institution->phone,
                    'address' => $institution->address,
                    'description' => $institution->description,
                    'image' => $institution->getFirstMediaUrl('images', 'thumb') ?: null,
                    'created_at' => Carbon::parse($institution->created_at)->translatedFormat('d F Y'),
                    'active' => $institution->active ?? true
                ];
            });

        return Inertia::render('institution/index', [
            'allInstitutions' => $allInstitutions,
            'paginatedInstitutions' => $allInstitutions->take(10), // Pour compatibilité initiale
            'can' => $can,
            'permissions' => $permissions,
            'filters' => $request->only(['search']),
            'flash' => [
                'message' => session('flash.message'),
                'type' => session('flash.type')
            ]
        ]);
    }

    public function store(InstitutionRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('create_institutions')) {
            abort(403, 'Action non autorisée');
        }



        $institution = Institution::create($request->except('document', 'search'));

        // Gestion des fichiers uploadés
        if ($request->has('document')) {
            foreach ($request->input('document', []) as $file) {
                $institution->addMedia(storage_path('app/public/temp/dropzone/' . $file))
                    ->toMediaCollection('images');
            }
        }

        return redirect()->route('institutions.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Institution créée avec succès !'
            ]
        ]);
    }

    public function update(InstitutionRequest $request, Institution $institution)
    {
        if (!auth()->user()->hasPermissionTo('edit_institutions')) {
            abort(403, 'Action non autorisée');
        }

        $institution->update($request->validated());

        // Gestion des médias
        if ($request->has('document')) {
            $media = $institution->getMedia('images')->pluck('file_name')->toArray();

            // Supprimer les fichiers retirés
            foreach ($institution->getMedia('images') as $mediaItem) {
                if (!in_array($mediaItem->file_name, $request->input('document', []))) {
                    $mediaItem->delete();
                }
            }

            // Ajouter les nouveaux fichiers
            foreach ($request->input('document', []) as $file) {
                if (!in_array($file, $media)) {
                    $institution->addMedia(storage_path('app/public/temp/dropzone/' . $file))
                        ->toMediaCollection('images');
                }
            }
        }

        return redirect()->route('institutions.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => 'Institution mise à jour avec succès !'
            ]
        ]);
    }

    public function destroy(Institution $institution)
    {
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
        if (!auth()->user()->hasPermissionTo('create_institutions')) {
            abort(403, 'Action non autorisée');
        }

        $validator = Validator::make($request->all(), [
            'excel_file' => 'required|file|mimes:xls,xlsx|max:2048'
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->with('flash', [
                    'type' => 'error',
                    'message' => 'Le fichier doit être un Excel valide (max 2MB)'
                ]);
        }

        try {
            Excel::import(new InstitutionImport, $request->file('excel_file'));
            
            return redirect()->route('institutions.index')->with([
                'flash' => [
                    'type' => 'success',
                    'message' => '📊 Importation Excel réussie ! ' . count($request->imported_rows) . ' institutions ajoutées'
                ]
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Erreur lors de l\'import: ' . $e->getMessage()
                ]
            ]);
        }
    }

 
}