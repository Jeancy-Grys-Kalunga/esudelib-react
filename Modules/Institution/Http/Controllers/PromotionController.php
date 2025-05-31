<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Faculty;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Http\Requests\PromotionRequest;
use Spatie\Permission\Models\Permission;

class PromotionController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('access_promotions')) {
            abort(403, 'Action non autorisée');
        }

        $user = auth()->user();
        $user->load('permissions', 'roles.permissions');

        // Gestion des permissions
        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_promotions',
            'edit'   => 'edit_promotions',
            'delete' => 'delete_promotions',
            'access' => 'access_promotions',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        // Construction de la requête
        $query = Promotion::with(['institution', 'faculty'])
            ->orderByDesc('id');

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereIn('institution_id', $institutionIds);
        }

        $institutions = $user->hasRole('Secrétaire Académique')
            ? $user->institutions()->pluck('id')
            : Institution::pluck('id');

        // Formatage des données pour Inertia
        $promotions = $query->get()->map(function ($promotion) {
            return [
                'id' => $promotion->id,
                'title' => $promotion->title,
                'institution' => $promotion->institution->name,
                'faculty' => $promotion->faculty->title,
                'created_at' => $promotion->created_at->translatedFormat('d F Y'),
            ];
        });

        return Inertia::render('promotion/index', [
            'promotions' => $promotions,
            'can' => $can,
            'filters' => $request->only(['search']),
            'flash' => $this->getFlashMessages(),
            'institutions' => Institution::whereIn('id', $institutions)->get(['id', 'name']),
            'faculties' => Faculty::all(['id', 'title']),
        ]);
    }

    public function create()
    {
        $user = auth()->user();

        $institutions = Institution::when(
            $user->hasRole('Secrétaire Académique'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        $faculties = Faculty::all(['id', 'title']);

        return Inertia::render('Institution/Promotions/Form', [
            'promotion' => new Promotion(),
            'institutions' => $institutions,
            'faculties' => $faculties,
            'isEditing' => false,
        ]);
    }

    public function store(PromotionRequest $request)
    {
        if (!auth()->user()->hasPermissionTo('create_promotions')) {
            abort(403, 'Action non autorisée');
        }

        Promotion::create([
            'title' => $request->title,
            'institution_id' => $request->institution_id,
            'faculty_id' => $request->faculty_id,
        ]);

        return redirect()->route('promotions.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Promotion enregistrée avec succès !',
            ],
        ]);
    }

    public function edit(Promotion $promotion)
    {
        $user = auth()->user();

        $institutions = Institution::when(
            $user->hasRole('Secrétaire Académique'),
            fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
        )->get(['id', 'name']);

        $faculties = Faculty::all(['id', 'title']);

        return Inertia::render('Institution/Promotions/Form', [
            'promotion' => $promotion,
            'institutions' => $institutions,
            'faculties' => $faculties,
            'isEditing' => true,
        ]);
    }

    public function update(PromotionRequest $request, Promotion $promotion)
    {
        if (!auth()->user()->hasPermissionTo('edit_promotions')) {
            abort(403, 'Action non autorisée');
        }

        $promotion->update([
            'title' => $request->title,
            'institution_id' => $request->institution_id,
            'faculty_id' => $request->faculty_id,
        ]);

        return redirect()->route('promotions.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => 'Promotion modifiée avec succès !',
            ],
        ]);
    }

    public function destroy(Promotion $promotion)
    {
        if (!auth()->user()->hasPermissionTo('delete_promotions')) {
            abort(403, 'Action non autorisée');
        }

        $promotion->delete();

        return redirect()->route('promotions.index')->with([
            'flash' => [
                'type' => 'warning',
                'message' => 'Promotion supprimée avec succès !',
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