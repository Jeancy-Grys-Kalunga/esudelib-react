<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Jury;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\AcademicYear;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        $institutions = Institution::all();
        $academicYears = AcademicYear::all();
        $promotions = Promotion::all();

        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'institutions' => $institutions,
            'academicYears' => $academicYears,
            'promotions' => $promotions,
            'flash' => [
                'message' => session('flash.message'),
                'type' => session('flash.type')
            ]
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'institution_id' => 'nullable|exists:institutions,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'promotion_id' => 'nullable|exists:promotions,id',
            'is_jury' => 'boolean'
        ]);

        $credentials = $request->only('email', 'password');
        $user = User::where('email', $credentials['email'])->first();

        if (!$user) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Identifiants incorrects'
                ]
            ])->withInput();
        }

        if (!Auth::validate(['email' => $credentials['email'], 'password' => $credentials['password'], 'is_active' => 1])) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Identifiants incorrects ou compte inactif'
                ]
            ])->withInput();
        }

        // Super Admin: Pas de vérification d'institution
        if ($user->hasRole('Super Admin')) {
            Auth::login($user, $request->remember);
            $request->session()->regenerate();
            return redirect()->intended(route('dashboard'))->with([
                'flash' => [
                    'type' => 'success',
                    'message' => 'Bienvenue Administrateur'
                ]
            ]);
        }

        // Jury: Vérification des champs spécifiques
        if ($request->is_jury) {
            return $this->handleJuryLogin($request, $user);
        }

        // Utilisateur normal: Vérification minimale
        return $this->handleNormalUserLogin($request, $user);
    }

    protected function handleJuryLogin(Request $request, User $user): RedirectResponse
    {
        // Vérification des champs obligatoires pour les jurys
        if (!$request->institution_id || !$request->academic_year_id || !$request->promotion_id) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Pour les jurys, l\'institution, l\'année académique et la promotion sont obligatoires'
                ]
            ])->withInput();
        }

        // Vérification de l'appartenance au jury
        $jury = Jury::where('institution_id', $request->institution_id)
            ->where('academic_year_id', $request->academic_year_id)
            ->where('promotion_id', $request->promotion_id)
            ->where(function ($query) use ($user) {
                $query->where('president_id', $user->id)
                    ->orWhere('secretary_id', $user->id)
                    ->orWhere('member_id', $user->id);
            })
            ->first();

        if (!$jury) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Vous ne faites pas partie du jury pour cette sélection'
                ]
            ])->withInput();
        }

        Auth::login($user, $request->remember);
        $request->session()->put('jury_context', [
            'institution_id' => $request->institution_id,
            'academic_year_id' => $request->academic_year_id,
            'promotion_id' => $request->promotion_id,
            'jury_id' => $jury->id
        ]);

        $request->session()->regenerate();
        return redirect()->intended(route('jury.dashboard'))->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Bienvenue dans l\'espace Jury'
            ]
        ]);
    }

    protected function handleNormalUserLogin(Request $request, User $user): RedirectResponse
    {
        // Vérification institution uniquement
        if (!$request->institution_id) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Veuillez sélectionner une institution'
                ]
            ])->withInput();
        }

        $user->load('institutions');
        if (!$user->institutions->contains('id', $request->institution_id)) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Vous n\'avez pas accès à cette institution'
                ]
            ])->withInput();
        }

        Auth::login($user, $request->remember);
        $request->session()->regenerate();
        return redirect()->intended(route('dashboard'))->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Bienvenue'
            ]
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Vous êtes déconnecté avec succès'
            ]
        ]);
    }
}
