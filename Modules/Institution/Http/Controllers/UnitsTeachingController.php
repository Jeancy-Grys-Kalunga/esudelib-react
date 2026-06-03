<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\UnitsTeaching;
use Modules\Institution\Http\Requests\StoreUnitTeachingRequest;
use Modules\Institution\Http\Requests\UpdateUnitTeachingRequest;
use Spatie\Permission\Models\Permission;

class UnitsTeachingController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('access_unit_teachings')) {
            abort(403, 'Action non autorisée');
        }

        $user = auth()->user();
        $user->load('permissions', 'roles.permissions');

        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_unit_teachings',
            'edit'   => 'edit_unit_teachings',
            'delete' => 'delete_unit_teachings',
            'access' => 'access_unit_teachings',
            'import' => 'create_unit_teachings',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        $query = UnitsTeaching::with(['promotion', 'courses'])
            ->orderByDesc('id');

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereHas('promotion', function($q) use ($institutionIds) {
                $q->whereIn('institution_id', $institutionIds);
            });
        }

        $units = $query->get()->map(function ($unit) {
            return [
                'id' => $unit->id,
                'title' => $unit->title,
                'cm' => $unit->cm,
                'tp' => $unit->tp,
                'td' => $unit->td,
                'promotion' => $unit->promotion->title,
                'courses' => $unit->courses->pluck('title')->join(', '), // Liste des cours séparés par des virgules
                'created_at' => $unit->created_at->translatedFormat('d F Y'),
                'promotion_id' => $unit->promotion_id,
                'course_ids' => $unit->courses->pluck('id')->toArray(), // IDs des cours pour le formulaire
            ];
        });

        $promotions = Promotion::when(
            $user->hasRole('Secrétaire Académique'),
            fn($q) => $q->whereIn('institution_id', $user->institutions()->pluck('id'))
        )->get(['id', 'title']);

        $courses = Course::all(['id', 'title']);

        return Inertia::render('unit-teaching/index', [
            'units' => $units,
            'can' => $can,
            'filters' => $request->only(['search']),
            'flash' => $this->getFlashMessages(),
            'promotions' => $promotions,
            'courses' => $courses,
        ]);
    }

    public function store(StoreUnitTeachingRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('create_unit_teachings')) {
            abort(403, 'Action non autorisée');
        }

        // Création de l'unité d'enseignement
        $unit = UnitsTeaching::create([
            'title' => $request->title,
            'cm' => $request->cm,
            'tp' => $request->tp,
            'td' => $request->td,
            'promotion_id' => $request->promotion_id,
        ]);

        // Attacher les cours sélectionnés
        if ($request->has('course_ids')) {
            $unit->courses()->sync($request->course_ids);
        }

        return redirect()->route('units-teachings.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Unité d\'enseignement créée avec succès !',
            ],
        ]);
    }

    public function storeQuick(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('create_unit_teachings')) {
            abort(403, 'Action non autorisée');
        }

        $request->validate([
            'title' => 'required|string|max:255',
        ]);

        try {
            $unit = UnitsTeaching::create([
                'title' => $request->title,
            ]);

            return response()->json([
                'message' => 'Unité créée avec succès',
                'unit' => [
                    'id' => $unit->id,
                    'name' => $unit->title,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur SQL: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(UpdateUnitTeachingRequest $request, UnitsTeaching $unit)
    {
        if (!auth()->user()->hasPermissionTo('edit_unit_teachings')) {
            abort(403, 'Action non autorisée');
        }

        // Mise à jour de l'unité d'enseignement
        $unit->update([
            'title' => $request->title,
            'cm' => $request->cm,
            'tp' => $request->tp,
            'td' => $request->td,
            'promotion_id' => $request->promotion_id,
        ]);

        // Synchroniser les cours sélectionnés
        $unit->courses()->sync($request->course_ids ?? []);

        return redirect()->route('units-teachings.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => 'Unité d\'enseignement modifiée avec succès !',
            ],
        ]);
    }

    public function destroy(UnitsTeaching $unit)
    {
        if (!auth()->user()->hasPermissionTo('delete_unit_teachings')) {
            abort(403, 'Action non autorisée');
        }

        // Détacher tous les cours avant suppression
        $unit->courses()->detach();
        $unit->delete();

        return redirect()->route('units-teachings.index')->with([
            'flash' => [
                'type' => 'warning',
                'message' => 'Unité d\'enseignement supprimée avec succès !',
            ],
        ]);
    }

    private function getFlashMessages()
    {
        return [
            'message' => session('flash.message'),
            'type' => session('flash.type'),
        ];
    }
}