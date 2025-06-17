<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Institution\Entities\Program;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\UnitsTeaching;
use Modules\Institution\Entities\CourseCategory;
use Modules\Institution\Entities\CourseProgramDetail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

class ProgramController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('access_programs')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();
        $user->load('permissions', 'roles.permissions');

        // Gestion des permissions
        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_programs',
            'edit'   => 'edit_programs',
            'delete' => 'delete_programs',
            'access' => 'access_programs',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        // Construction de la requête
        $query = Program::with(['institution', 'courseDetails']);

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereIn('institution_id', $institutionIds);
        }

        // Formatage des données pour Inertia
        $programs = $query->get()->map(function ($program) {
            return [
                'id' => $program->id,
                'institution_id' => $program->institution_id,
                'institution' => $program->institution?->name ?? 'Institution inconnue',
                'courses_count' => $program->courseDetails->count(),
                'created_at' => $program->created_at->format('d/m/Y'),
            ];
        });

        // Récupération des institutions basée sur le rôle
        $institutions = $this->getUserInstitutions($user);

        return Inertia::render('program/index', [
            'programs' => $programs,
            'can' => $can,
            'institutions' => $institutions,
            'flash' => $this->getFlashMessages(),
        ]);
    }

    public function create()
    {
        if (!auth()->user()->hasPermissionTo('create_programs')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();
        
        return Inertia::render('program/form', [
            'institutions' => $this->getUserInstitutions($user),
            'promotions' => Promotion::all(['id', 'title as name']),
            'units' => UnitsTeaching::all(['id', 'title as name']),
            'categories' => CourseCategory::all(['id', 'title as name']),
            'courses' => Course::all(['id', 'title as name']),
        ]);
    }

    public function store(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('create_programs')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();

        // Vérification des permissions institutionnelles
        if (
            $user->hasRole('Secrétaire Académique') &&
            !$user->institutions()->where('id', $request->institution_id)->exists()
        ) {
            abort(403);
        }

        try {
            DB::beginTransaction();

            // Création du programme
            $program = Program::create([
                'institution_id' => $request->institution_id,
            ]);

            DB::commit();

            return redirect()->route('programs.details.create', $program->id);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => "Erreur lors de la création : " . $e->getMessage()]);
        }
    }

    public function showDetailsForm(Program $program)
    {
        if (!auth()->user()->hasPermissionTo('edit_programs')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();
        if ($user->hasRole('Secrétaire Académique') && !$user->institutions->contains($program->institution_id)) {
            abort(403);
        }

        return Inertia::render('program/details-form', [
            'program' => [
                'id' => $program->id,
                'institution' => $program->institution?->name,
            ],
            'promotions' => Promotion::all(['id', 'title as name']),
            'units' => UnitsTeaching::all(['id', 'title as name']),
            'categories' => CourseCategory::all(['id', 'title as name']),
            'courses' => Course::all(['id', 'title as name']),
        ]);
    }

    public function storeDetails(Request $request, Program $program)
    {
        if (!auth()->user()->hasPermissionTo('edit_programs')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();
        if ($user->hasRole('Secrétaire Académique') && !$user->institutions->contains($program->institution_id)) {
            abort(403);
        }

        try {
            DB::beginTransaction();

            // Création des détails des cours
            foreach ($request->course_details as $detail) {
                CourseProgramDetail::create([
                    'program_id' => $program->id,
                    'course_id' => $detail['course_id'],
                    'promotion_id' => $detail['promotion_id'],
                    'units_teaching_id' => $detail['units_teaching_id'],
                    'course_category_id' => $detail['course_category_id'],
                    'cm' => $detail['cm'],
                    'td' => $detail['td'],
                    'tp' => $detail['tp'],
                    'credits' => $detail['credits'],
                ]);
            }

            DB::commit();

            return redirect()->route('programs.index')->with([
                'flash' => [
                    'type' => 'success',
                    'message' => 'Détails du programme ajoutés avec succès !',
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => "Erreur lors de l'ajout des détails : " . $e->getMessage()]);
        }
    }

    public function edit(Program $program)
    {
        if (!auth()->user()->hasPermissionTo('edit_programs')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();
        if ($user->hasRole('Secrétaire Académique') && !$user->institutions->contains($program->institution_id)) {
            abort(403);
        }

        // Charger les détails avec les relations
        $program->load(['courseDetails' => function ($query) {
            $query->with(['course', 'promotion', 'unitsTeaching', 'courseCategory']);
        }]);

        return Inertia::render('program/details-form', [
            'program' => [
                'id' => $program->id,
                'institution' => $program->institution?->name,
                'course_details' => $program->courseDetails->map(function ($detail) {
                    return [
                        'id' => $detail->id,
                        'course_id' => $detail->course_id,
                        'course' => $detail->course?->title,
                        'promotion_id' => $detail->promotion_id,
                        'promotion' => $detail->promotion?->title,
                        'units_teaching_id' => $detail->units_teaching_id,
                        'units_teaching' => $detail->unitsTeaching?->title,
                        'course_category_id' => $detail->course_category_id,
                        'course_category' => $detail->courseCategory?->title,
                        'cm' => $detail->cm,
                        'td' => $detail->td,
                        'tp' => $detail->tp,
                        'credits' => $detail->credits,
                    ];
                })
            ],
            'promotions' => Promotion::all(['id', 'title as name']),
            'units' => UnitsTeaching::all(['id', 'title as name']),
            'categories' => CourseCategory::all(['id', 'title as name']),
            'courses' => Course::all(['id', 'title as name']),
        ]);
    }

    public function updateDetails(Request $request, Program $program)
    {
        if (!auth()->user()->hasPermissionTo('edit_programs')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();
        if ($user->hasRole('Secrétaire Académique') && !$user->institutions->contains($program->institution_id)) {
            abort(403);
        }

        try {
            DB::beginTransaction();

            // Synchronisation des détails des cours
            $currentDetails = $program->courseDetails->pluck('id')->toArray();
            $updatedDetails = [];

            foreach ($request->course_details as $detail) {
                if (isset($detail['id'])) {
                    // Mise à jour d'un détail existant
                    CourseProgramDetail::where('id', $detail['id'])
                        ->update([
                            'course_id' => $detail['course_id'],
                            'promotion_id' => $detail['promotion_id'],
                            'units_teaching_id' => $detail['units_teaching_id'],
                            'course_category_id' => $detail['course_category_id'],
                            'cm' => $detail['cm'],
                            'td' => $detail['td'],
                            'tp' => $detail['tp'],
                            'credits' => $detail['credits'],
                        ]);
                    $updatedDetails[] = $detail['id'];
                } else {
                    // Création d'un nouveau détail
                    $newDetail = CourseProgramDetail::create([
                        'program_id' => $program->id,
                        'course_id' => $detail['course_id'],
                        'promotion_id' => $detail['promotion_id'],
                        'units_teaching_id' => $detail['units_teaching_id'],
                        'course_category_id' => $detail['course_category_id'],
                        'cm' => $detail['cm'],
                        'td' => $detail['td'],
                        'tp' => $detail['tp'],
                        'credits' => $detail['credits'],
                    ]);
                    $updatedDetails[] = $newDetail->id;
                }
            }

            // Suppression des détails non présents dans la requête
            $toDelete = array_diff($currentDetails, $updatedDetails);
            if (!empty($toDelete)) {
                CourseProgramDetail::whereIn('id', $toDelete)->delete();
            }

            DB::commit();

            return redirect()->route('programs.index')->with([
                'flash' => [
                    'type' => 'success',
                    'message' => 'Détails du programme mis à jour avec succès !',
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => "Erreur lors de la mise à jour : " . $e->getMessage()]);
        }
    }

    public function destroy(Program $program)
    {
        if (!auth()->user()->hasPermissionTo('delete_programs')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();
        if ($user->hasRole('Secrétaire Académique') && !$user->institutions->contains($program->institution_id)) {
            abort(403);
        }

        $program->delete();

        return redirect()->route('programs.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Programme supprimé avec succès !',
            ],
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

    private function getFlashMessages()
    {
        return [
            'message' => session('flash.message'),
            'type' => session('flash.type'),
        ];
    }
}