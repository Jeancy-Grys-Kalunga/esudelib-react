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
use Modules\Institution\Entities\Semestre; // Ajouté
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
            'import' => 'create_programs', // Ajout de la permission import
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        $can['selectInstitution'] = $user->hasRole('Super Admin');

        // Construction de la requête optimisée
        $query = Program::with('institution')->withCount('courseDetails');

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereIn('institution_id', $institutionIds);
        }

        // Formatage des données pour Inertia
        $programs = $query->get()->map(function ($program) {
            return [
                'id' => $program->id,
                'name' => $program->name,
                'institution_id' => $program->institution_id,
                'institution' => $program->institution?->name ?? 'Institution inconnue',
                'courses_count' => $program->course_details_count,
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

    public function import(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('create_programs')) {
            abort(403, 'Action non autorisée');
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
            'institution_id' => 'required|exists:institutions,id',
        ]);

        try {
            $import = new \App\Imports\ProgramsImport($request->institution_id);
            \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));

            $stats = $import->getStats();

            $message = "Importation terminée : {$stats['imported']} détails ajoutés/mis à jour";
            if ($stats['programs_created'] > 0) {
                $message .= ", {$stats['programs_created']} programmes créés";
            }
            if ($stats['skipped'] > 0) {
                $message .= ". {$stats['skipped']} lignes ignorées.";
            }

            return redirect()->back()->with([
                'flash' => [
                    'type' => 'success',
                    'message' => $message,
                ],
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => "Erreur lors de l'importation : " . $e->getMessage(),
                ],
            ]);
        }
    }

    public function create()
    {
        if (!auth()->user()->hasPermissionTo('create_programs')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();
        $institutions = $this->getUserInstitutions($user);

        // Pour les secrétaires académiques, on prend leur institution par défaut
        $defaultInstitution = null;
        if ($user->hasRole('Secrétaire Académique') && $institutions->count() > 0) {
            $defaultInstitution = $institutions->first()->id;
        }

        return Inertia::render('program/form', [
            'institutions' => $institutions,
            'defaultInstitution' => $defaultInstitution,
            'promotions' => Promotion::all(['id', 'title as name']),
            'units' => UnitsTeaching::all(['id', 'title as name']),
            'categories' => CourseCategory::all(['id', 'name']),
            'courses' => Course::all(['id', 'title as name']),
            'semestres' => Semestre::all(['id', 'title']), // Ajouté
        ]);
    }

    public function store(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('create_programs')) {
            abort(403, 'Action non autorisée');
        }

        $user = Auth::user();
        $institutionId = $request->institution_id;

        // Vérification des permissions institutionnelles
        if ($user->hasRole('Secrétaire Académique')) {
            $userInstitutions = $user->institutions()->pluck('id');

            // Si l'utilisateur n'a qu'une institution, on l'utilise automatiquement
            if ($userInstitutions->count() === 1) {
                $institutionId = $userInstitutions->first();
            }
            // Si l'utilisateur a plusieurs institutions, on vérifie qu'il a le droit sur celle sélectionnée
            elseif (!$userInstitutions->contains($institutionId)) {
                abort(403, "Vous n'avez pas accès à cette institution");
            }
        }

        try {
            DB::beginTransaction();

            // Validation des données
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'institution_id' => 'required|exists:institutions,id'
            ]);

            // Création du programme
            $program = Program::create([
                'name' => $validated['name'],
                'institution_id' => $institutionId,
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

        // Charger la relation institution pour éviter le lazy loading
        $program->load('institution');

        return Inertia::render('program/details', [
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
                'institution' => $program->institution?->name,
            ],
            'promotions' => Promotion::all(['id', 'title as name']),
            'units' => UnitsTeaching::all(['id', 'title as name']),
            'categories' => CourseCategory::all(['id', 'name']),
            'courses' => Course::all(['id', 'title as name']),
            'semestres' => Semestre::all(['id', 'title']), // Ajouté
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

            // Validation des données avec conversion numérique
            $validated = $request->validate([
                'course_details' => 'required|array|min:1',
                'course_details.*.course_id' => 'required|exists:courses,id',
                'course_details.*.promotion_id' => 'required|exists:promotions,id',
                'course_details.*.units_teaching_id' => 'nullable|exists:units_teachings,id',
                'course_details.*.course_category_id' => 'nullable|exists:course_categories,id',
                'course_details.*.semestre_id' => 'required|exists:semestres,id', // Ajouté
                'course_details.*.cm' => 'required|numeric|min:0',
                'course_details.*.td' => 'required|numeric|min:0',
                'course_details.*.tp' => 'required|numeric|min:0',
                'course_details.*.credits' => 'required|numeric|min:0',
            ]);

            $details = [];
            foreach ($validated['course_details'] as $detail) {
                $details[] = [
                    'program_id' => $program->id,
                    'course_id' => $detail['course_id'],
                    'promotion_id' => $detail['promotion_id'],
                    'units_teaching_id' => $detail['units_teaching_id'],
                    'course_category_id' => $detail['course_category_id'],
                    'semestre_id' => $detail['semestre_id'], // Ajouté
                    'cm' => (float)$detail['cm'],
                    'td' => (float)$detail['td'],
                    'tp' => (float)$detail['tp'],
                    'credits' => (float)$detail['credits'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            CourseProgramDetail::insert($details);

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

        // Charger les détails avec la méthode optimisée
        $program->load(['institution', 'courseDetails' => function ($query) {
            $query->with(['course', 'promotion', 'unitsTeaching', 'category', 'semestre']);
        }]);

        return Inertia::render('program/details', [
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
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
                        'course_category' => $detail->category?->name,
                        'semestre_id' => $detail->semestre_id, // Ajouté
                        'semestre' => $detail->semestre?->title, // Ajouté
                        'cm' => $detail->cm,
                        'td' => $detail->td,
                        'tp' => $detail->tp,
                        'credits' => $detail->credits,
                    ];
                })
            ],
            'promotions' => Promotion::all(['id', 'title as name']),
            'units' => UnitsTeaching::all(['id', 'title as name']),
            'categories' => CourseCategory::all(['id', 'name']),
            'courses' => Course::all(['id', 'title as name']),
            'semestres' => Semestre::all(['id', 'title']), // Ajouté
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

            $validated = $request->validate([
                'course_details' => 'required|array|min:1',
                'course_details.*.id' => 'sometimes|exists:course_program_details,id',
                'course_details.*.course_id' => 'required|exists:courses,id',
                'course_details.*.promotion_id' => 'required|exists:promotions,id',
                'course_details.*.units_teaching_id' => 'nullable|exists:units_teachings,id',
                'course_details.*.course_category_id' => 'nullable|exists:course_categories,id',
                'course_details.*.semestre_id' => 'required|exists:semestres,id', // Ajouté
                'course_details.*.cm' => 'required|numeric|min:0',
                'course_details.*.td' => 'required|numeric|min:0',
                'course_details.*.tp' => 'required|numeric|min:0',
                'course_details.*.credits' => 'required|numeric|min:0',
            ]);

            $existingIds = [];
            foreach ($validated['course_details'] as $detail) {
                $data = [
                    'course_id' => $detail['course_id'],
                    'promotion_id' => $detail['promotion_id'],
                    'units_teaching_id' => $detail['units_teaching_id'],
                    'course_category_id' => $detail['course_category_id'],
                    'semestre_id' => $detail['semestre_id'], // Ajouté
                    'cm' => (float)$detail['cm'],
                    'td' => (float)$detail['td'],
                    'tp' => (float)$detail['tp'],
                    'credits' => (float)$detail['credits'],
                ];

                if (isset($detail['id']) && $detail['id']) {
                    // Mise à jour du détail existant
                    CourseProgramDetail::where('id', $detail['id'])->update($data);
                    $existingIds[] = $detail['id'];
                } else {
                    // Création d'un nouveau détail
                    $newDetail = CourseProgramDetail::create(array_merge($data, ['program_id' => $program->id]));
                    $existingIds[] = $newDetail->id;
                }
            }

            // Supprimer les détails qui ne sont plus dans la liste
            CourseProgramDetail::where('program_id', $program->id)
                ->whereNotIn('id', $existingIds)
                ->delete();

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

    private function toFloat($value)
    {
        if (is_float($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (float)$value;
        }

        return 0.0;
    }
}
