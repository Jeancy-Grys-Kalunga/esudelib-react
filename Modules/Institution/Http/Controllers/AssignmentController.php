<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

use Modules\Institution\Entities\Assignment;

use Modules\Institution\Entities\Institution;
use Modules\Institution\Http\Requests\BulkAssignmentRequest;
use Modules\Institution\Http\Requests\StoreAssignmentRequest;
use Modules\Institution\Http\Requests\UpdateAssignmentRequest;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Collection;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\UnitsTeaching;
use Modules\Teacher\Entities\Teacher;

class AssignmentController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('access_assignments')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();
        $user->load('permissions', 'roles.permissions');

        // Gestion des permissions
        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_assignments',
            'edit' => 'edit_assignments',
            'delete' => 'delete_assignments',
            'access' => 'access_assignments',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        // Construction de la requête avec filtres
        $query = Assignment::with([
            'holder',
            'collaborator',
            'teachingUnit',
            'academicYear',
            'institution'
        ]);

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereIn('institution_id', $institutionIds);
        }

        // Filtrage par institution (avec conversion numérique)
        if ($request->has('institution') && $request->institution) {
            $query->where('institution_id', (int)$request->institution);
        }

        // Filtrage par année académique (avec conversion numérique)
        if ($request->has('academic_year') && $request->academic_year) {
            $query->where('academic_year_id', (int)$request->academic_year);
        }

        // Filtrage par recherche texte
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->whereHas('holder', function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', "%$searchTerm%");
                })
                    ->orWhereHas('collaborator', function ($q) use ($searchTerm) {
                        $q->where('name', 'LIKE', "%$searchTerm%");
                    })
                    ->orWhereHas('teachingUnit', function ($q) use ($searchTerm) {
                        $q->where('title', 'LIKE', "%$searchTerm%");
                    })
                    ->orWhereHas('institution', function ($q) use ($searchTerm) {
                        $q->where('name', 'LIKE', "%$searchTerm%");
                    });
            });
        }

        $assignments = $query->orderByDesc('id')->get();

        // Formatage des données pour Inertia (avec gestion null et clés manquantes)
        $formattedAssignments = $assignments->map(function ($assignment) {
            return [
                'id' => $assignment->id,
                'holder_id' => $assignment->holder_id,
                'holder' => $assignment->holder?->name ?? 'Non assigné',
                'collaborator_id' => $assignment->collaborator_id,
                'collaborator' => $assignment->collaborator?->name ?? 'Aucun',
                'teaching_unit_id' => $assignment->teaching_unit_id,
                'teaching_unit' => $assignment->teachingUnit?->title ?? 'Unité inconnue',
                'academic_year_id' => $assignment->academic_year_id,
                'academic_year' => $assignment->academicYear?->title ?? 'Année non définie',
                'observation' => $assignment->observation,
                'institution_id' => $assignment->institution_id,
                'institution' => $assignment->institution?->name ?? 'Institution inconnue',
            ];
        });

        // Filtres disponibles pour l'utilisateur
        $institutions = $user->hasRole('Secrétaire Académique')
            ? $user->institutions()->get(['id', 'name'])
            : Institution::get(['id', 'name']);

        // Formatage avec alias cohérents
        $formattedTeachingUnits = UnitsTeaching::all(['id', 'title'])->map(function ($unit) {
            return ['id' => $unit->id, 'name' => $unit->title];
        });

        $formattedAcademicYears = AcademicYear::all(['id', 'title'])->map(function ($year) {
            return ['id' => $year->id, 'name' => $year->title];
        });

        return Inertia::render('assignment/index', [
            'assignments' => $formattedAssignments,
            'can' => $can,
            'filters' => $request->only(['search', 'institution', 'academic_year']),
            'institutions' => $institutions,
            'teachers' => Teacher::all(['id', 'name']),
            'teaching_units' => $formattedTeachingUnits,
            'academic_years' => $formattedAcademicYears,
        ]);
    }


    public function store(BulkAssignmentRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('edit_assignments')) {
            abort(403, 'Action non autorisée');
        }

        $assignmentsData = $request->validated();
        $results = ['created' => 0, 'updated' => 0];

        foreach ($assignmentsData as $data) {
            $data['institution_id'] = (int)$data['institution_id'];
            $data['academic_year_id'] = (int)$data['academic_year_id'];
            $data['teaching_unit_id'] = (int)$data['teaching_unit_id'];
            $data['holder_id'] = (int)$data['holder_id'];

            // Conversion simplifiée
            $data['collaborator_id'] = $data['collaborator_id'] ? (int)$data['collaborator_id'] : null;

            if (isset($data['id'])) {
                $assignment = Assignment::find($data['id']);
                if ($assignment) {
                    $assignment->update($data);
                    $results['updated']++;
                }
            } else {
                Assignment::create($data);
                $results['created']++;
            }
        }

        $message = sprintf(
            "Opération réussie : %d créations, %d mises à jour",
            $results['created'],
            $results['updated']
        );

        return redirect()->route('assignments.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => $message,
            ],
        ]);
    }

    public function update(UpdateAssignmentRequest $request, Assignment $assignment)
    {
        if (!auth()->user()->hasPermissionTo('edit_assignments')) {
            abort(403, 'Action non autorisée');
        }

        $assignment->update($request->validated());

        return redirect()->route('assignments.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => 'Attribution mise à jour avec succès !',
            ],
        ]);
    }

    public function destroy(Assignment $assignment)
    {
        if (!auth()->user()->hasPermissionTo('delete_assignments')) {
            abort(403, 'Action non autorisée');
        }

        $assignment->delete();

        return redirect()->route('assignments.index')->with([
            'flash' => [
                'type' => 'warning',
                'message' => 'Attribution supprimée avec succès !',
            ],
        ]);
    }

    public function bulkStore(BulkAssignmentRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('edit_assignments')) {
            abort(403, 'Action non autorisée');
        }


        $assignmentsData = $request->validated()['assignments'];
        $results = ['created' => 0, 'updated' => 0];

        foreach ($assignmentsData as $data) {
            $data['institution_id'] = (int)$data['institution_id'];
            $data['academic_year_id'] = (int)$data['academic_year_id'];
            $data['teaching_unit_id'] = (int)$data['teaching_unit_id'];
            $data['holder_id'] = (int)$data['holder_id'];

            // Conversion simplifiée
            $data['collaborator_id'] = $data['collaborator_id'] ? (int)$data['collaborator_id'] : null;

            if (isset($data['id'])) {
                $assignment = Assignment::find($data['id']);
                if ($assignment) {
                    $assignment->update($data);
                    $results['updated']++;
                }
            } else {
                Assignment::create($data);
                $results['created']++;
            }
        }

        $message = sprintf(
            "Opération réussie : %d créations, %d mises à jour",
            $results['created'],
            $results['updated']
        );

        return redirect()->route('assignments.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => $message,
            ],
        ]);
    }
}
