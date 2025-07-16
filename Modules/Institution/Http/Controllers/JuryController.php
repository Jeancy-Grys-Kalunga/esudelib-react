<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Modules\Institution\Entities\Jury;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Http\Requests\BulkJuryRequest;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Collection;
use App\Services\InfoBipService;
use Illuminate\Support\Facades\Log;

use Modules\Teacher\Entities\Teacher;

class JuryController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('access_juries')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();
        $user->load('permissions', 'roles.permissions');

        // Gestion des permissions
        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_juries',
            'edit' => 'edit_juries',
            'delete' => 'delete_juries',
            'access' => 'access_juries',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        // Construction de la requête avec filtres
        $query = Jury::with([
            'institution',
            'promotion',
            'academicYear',
            'president',
            'secretary',
            'member'
        ]);

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereIn('institution_id', $institutionIds);
        }

        // Filtrage par année académique
        if ($request->has('academic_year') && $request->academic_year) {
            $query->where('academic_year_id', (int)$request->academic_year);
        }

        // Filtrage par promotion
        if ($request->has('promotion') && $request->promotion) {
            $query->where('promotion_id', (int)$request->promotion);
        }

        // Filtrage par recherche texte
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->whereHas('president', function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', "%$searchTerm%");
                })
                ->orWhereHas('secretary', function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', "%$searchTerm%");
                })
                ->orWhereHas('member', function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', "%$searchTerm%");
                })
                ->orWhereHas('institution', function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', "%$searchTerm%");
                })
                ->orWhereHas('promotion', function ($q) use ($searchTerm) {
                    $q->where('title', 'LIKE', "%$searchTerm%");
                });
            });
        }

        $juries = $query->orderByDesc('id')->get();

        // Formatage des données pour Inertia
        $formattedJuries = $juries->map(function ($jury) {
            return [
                'id' => $jury->id,
                'president_id' => $jury->president_id,
                'president' => $jury->president->name ?? 'Enseignant inconnu',
                'secretary_id' => $jury->secretary_id,
                'secretary' => $jury->secretary->name ?? 'Enseignant inconnu',
                'member_id' => $jury->member_id,
                'member' => $jury->member->name ?? 'Enseignant inconnu',
                'observation' => $jury->observation,
                'institution_id' => $jury->institution_id,
                'institution' => $jury->institution?->name ?? 'Institution inconnue',
                'promotion_id' => $jury->promotion_id,
                'promotion' => $jury->promotion?->title ?? 'Promotion inconnue',
                'academic_year_id' => $jury->academic_year_id,
                'academic_year' => $jury->academicYear?->title ?? 'Année non définie',
            ];
        });

        // Récupération des données pour les filtres
        $institutions = $this->getUserInstitutions($user);
        $promotions = Promotion::all(['id', 'title']);
        $academicYears = AcademicYear::all(['id', 'title']);
        $teachers = Teacher::all(['id', 'name']); // Pour les sélecteurs

        return Inertia::render('jury/index', [
            'juries' => $formattedJuries,
            'can' => $can,
            'filters' => $request->only(['search', 'academic_year', 'promotion']),
            'institutions' => $institutions,
            'promotions' => $promotions,
            'academic_years' => $academicYears,
            'teachers' => $teachers, // Nouveau
        ]);
    }

    // Helper pour récupérer les institutions
    private function getUserInstitutions($user)
    {
        if ($user->hasRole('Super Admin')) {
            return Institution::all(['id', 'name']);
        }

        return $user->institutions()->get(['id', 'name']);
    }

    public function store(BulkJuryRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('edit_juries')) {
            abort(403, 'Action non autorisée');
        }

        $newJuries = [];
        $validated = $request->validated();
        $juriesData = $validated['juries'] ?? [$validated];

        $results = ['created' => 0, 'updated' => 0];

        foreach ($juriesData as $data) {
            $data['institution_id'] = $this->getUserInstitutionId();
            $data['academic_year_id'] = (int)$data['academic_year_id'];
            $data['promotion_id'] = (int)$data['promotion_id'];

            if (isset($data['id']) && $data['id']) {
                $jury = Jury::find($data['id']);
                if ($jury) {
                    $jury->update($data);
                    $results['updated']++;
                }
            } else {
                $jury = Jury::create($data);
                $newJuries[] = $jury;
                $results['created']++;
            }
        }

        $message = sprintf(
            "Opération réussie : %d créations, %d mises à jour",
            $results['created'],
            $results['updated']
        );

        return redirect()->route('juries.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => $message,
            ],
        ]);
    }

    // Helper pour obtenir l'ID d'institution
    private function getUserInstitutionId()
    {
        $user = auth()->user();

        if ($user->hasRole('Super Admin')) {
            return Institution::first()->id ?? null;
        }

        return $user->institutions()->first()->id ?? null;
    }

    public function update(Request $request, Jury $jury)
    {
        if (!auth()->user()->hasPermissionTo('edit_juries')) {
            abort(403, 'Action non autorisée');
        }

        $jury->update($request->validated());

        return redirect()->route('juries.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => 'Jury mis à jour avec succès !',
            ],
        ]);
    }

    public function destroy(Jury $jury)
    {
        if (!auth()->user()->hasPermissionTo('delete_juries')) {
            abort(403, 'Action non autorisée');
        }

        $jury->delete();

        return redirect()->route('juries.index')->with([
            'flash' => [
                'type' => 'warning',
                'message' => 'Jury supprimé avec succès !',
            ],
        ]);
    }

    public function storeBulk(BulkJuryRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('edit_juries')) {
            abort(403, 'Action non autorisée');
        }

        $validated = $request->validated();
        $juriesData = $validated['juries'];
        $created = 0;
        $newJuries = [];

        foreach ($juriesData as $data) {
            $data['institution_id'] = $this->getUserInstitutionId();
            $data['academic_year_id'] = (int)$data['academic_year_id'];
            $data['promotion_id'] = (int)$data['promotion_id'];

            $jury = Jury::create($data);
            $newJuries[] = $jury;
            $created++;
        }

        return redirect()->back()->with([
            'flash' => [
                'type' => 'success',
                'message' => "{$created} jurys créés avec succès"
            ]
        ]);
    }
}
