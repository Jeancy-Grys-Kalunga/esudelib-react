<?php

namespace Modules\Institution\Http\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Modules\Institution\Entities\ExamSession;
use Modules\Institution\Entities\Institution;
use Spatie\Permission\Models\Permission;

class ExamSessionController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('access_exam_sessions')) {
            abort(403, 'Action non autorisée');
        }

        $user = auth()->user();
        $user->load('permissions', 'roles.permissions');

        // Gestion des permissions
        $permissions = $user->hasRole('Super Admin')
            ? Permission::pluck('name')->toArray()
            : $user->getAllPermissions()->pluck('name')->toArray();

        $requiredPermissions = [
            'create' => 'create_exam_sessions',
            'edit'   => 'edit_exam_sessions',
            'delete' => 'delete_exam_sessions',
            'access' => 'access_exam_sessions',
        ];

        $can = array_map(
            fn($permission) => in_array($permission, $permissions),
            $requiredPermissions
        );

        // Construction de la requête
        $query = ExamSession::with(['institution'])
            ->orderByDesc('id');

        if ($user->hasRole('Secrétaire Académique')) {
            $institutionIds = $user->institutions()->pluck('id');
            $query->whereIn('institution_id', $institutionIds);
        }

        // Formatage des données pour Inertia
        $examSessions = $query->get()->map(function ($session) {
            return [
                'id' => $session->id,
                'title' => $session->title,
                'status' => $session->status,
                'acceptance_rate' => $session->acceptance_rate,
                'institution' => $session->institution->name,
                'institution_id' => $session->institution_id,
                'created_at' => $session->created_at->translatedFormat('d F Y'),
            ];
        });


        $userInstitution = null;
        if (auth()->user()->hasRole('Secrétaire Académique')) {
            $userInstitution = auth()->user()->institutions()->first();
        }

        return Inertia::render('examSession/index', [
            'examSessions' => $examSessions,
            'can' => $can,
            'filters' => $request->only(['search']),
            'flash' => $this->getFlashMessages(),
            'institutions' => Institution::when(
                $user->hasRole('Secrétaire Académique'),
                fn($q) => $q->whereIn('id', $user->institutions()->pluck('id'))
            )->get(['id', 'name']),
            'userInstitution' => $userInstitution ? [
                'id' => $userInstitution->id,
                'name' => $userInstitution->name
            ] : null,
        ]);
    }


    
    public function store(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('create_exam_sessions')) {
            abort(403, 'Action non autorisée');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'status' => 'required|in:open,closed',
            'acceptance_rate' => 'required|integer|min:0|max:100',
            'institution_id' => 'required|exists:institutions,id',
        ]);

        // Vérification si une session est déjà ouverte pour cette institution
        if ($request->status === 'open') {
            $existingOpenSession = ExamSession::where('institution_id', $request->institution_id)
                ->where('status', 'open')
                ->exists();

            if ($existingOpenSession) {
                return redirect()->back()->with([
                    'flash' => [
                        'type' => 'error',
                        'message' => 'Une session ouverte existe déjà pour cette institution. Fermez-la avant de créer une nouvelle session.',
                    ],
                ]);
            }
        }

        ExamSession::create($request->all());

        return redirect()->route('exam-sessions.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Session d\'examen enregistrée avec succès !',
            ],
        ]);
    }

    public function update(Request $request, ExamSession $examSession)
    {
        if (!auth()->user()->hasPermissionTo('edit_exam_sessions')) {
            abort(403, 'Action non autorisée');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'status' => 'required|in:open,closed',
            'acceptance_rate' => 'required|integer|min:0|max:100',
            'institution_id' => 'required|exists:institutions,id',
        ]);

        // Vérification si une session est déjà ouverte pour cette institution
        if ($request->status === 'open') {
            $existingOpenSession = ExamSession::where('institution_id', $request->institution_id)
                ->where('status', 'open')
                ->where('id', '!=', $examSession->id)
                ->exists();

            if ($existingOpenSession) {
                return redirect()->back()->with([
                    'flash' => [
                        'type' => 'error',
                        'message' => 'Une session ouverte existe déjà pour cette institution. Fermez-la avant d\'ouvrir cette session.',
                    ],
                ]);
            }
        }

        $examSession->update($request->all());

        return redirect()->route('exam-sessions.index')->with([
            'flash' => [
                'type' => 'info',
                'message' => 'Session d\'examen modifiée avec succès !',
            ],
        ]);
    }

    public function destroy(ExamSession $examSession)
    {
        if (!auth()->user()->hasPermissionTo('delete_exam_sessions')) {
            abort(403, 'Action non autorisée');
        }

        $examSession->delete();

        return redirect()->route('exam-sessions.index')->with([
            'flash' => [
                'type' => 'warning',
                'message' => 'Session d\'examen supprimée avec succès !',
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
