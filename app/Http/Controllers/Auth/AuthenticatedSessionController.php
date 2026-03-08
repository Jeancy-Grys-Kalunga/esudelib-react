<?php


namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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

        // Récupérer l'utilisateur par email
        $user = User::where('email', $credentials['email'])->first();

        // Vérifier si l'utilisateur existe
        if (!$user) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Identifiants incorrects'
                ]
            ])->withInput($request->except('password'));
        }

        // Vérifier si le compte est actif
        if (!$user->is_active) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Votre compte est inactif. Veuillez contacter l\'administrateur.'
                ]
            ])->withInput($request->except('password'));
        }

        // Vérifier le mot de passe
        if (!Hash::check($credentials['password'], $user->password)) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Mot de passe incorrect'
                ]
            ])->withInput($request->except('password'));
        }

        // VALIDER LES PERMISSIONS AVANT L'AUTHENTIFICATION

        // Super Admin: Pas de vérification d'institution
        if ($user->hasRole('Super Admin')) {
            Auth::login($user, $request->boolean('remember'));

            return redirect()->intended(route('dashboard'))->with([
                'flash' => [
                    'type' => 'success',
                    'message' => 'Bienvenue Administrateur'
                ]
            ]);
        }

        // Jury: Vérification des champs spécifiques AVANT authentification
        if ($request->boolean('is_jury')) {
            // Vérifier les champs obligatoires (Retiré institution_id car masqué en front)
            if (!$request->academic_year_id || !$request->promotion_id) {
                return back()->with([
                    'flash' => [
                        'type' => 'error',
                        'message' => 'Pour les jurys, l\'année académique et la promotion sont obligatoires'
                    ]
                ])->withInput();
            }

            // Récupérer le profil enseignant (avec fallback par email comme dans le projet de référence)
            $teacher = $user->teacher ?? \Modules\Teacher\Entities\Teacher::where('email', $user->email)->first();

            if (!$teacher) {
                return back()->with([
                    'flash' => [
                        'type' => 'error',
                        'message' => 'Aucun profil enseignant associé à ce compte.'
                    ]
                ])->withInput();
            }

            // Vérifier l'appartenance au jury
            $juryQuery = Jury::where('academic_year_id', $request->academic_year_id)
                ->where('promotion_id', $request->promotion_id)
                ->where(function ($query) use ($teacher) {
                    $query->where('president_id', $teacher->id)
                        ->orWhere('secretary_id', $teacher->id)
                        ->orWhere('member_id', $teacher->id);
                });

            // Si une institution est fournie, on l'utilise pour filtrer davantage
            if ($request->institution_id) {
                $juryQuery->where('institution_id', $request->institution_id);
            }

            $jury = $juryQuery->first();

            if (!$jury) {
                return back()->with([
                    'flash' => [
                        'type' => 'error',
                        'message' => 'Vous ne faites pas partie du jury pour cette sélection'
                    ]
                ])->withInput();
            }

            // Tout est OK, authentifier
            Auth::login($user, $request->boolean('remember'));
            $request->session()->put('jury_context', [
                'institution_id' => $jury->institution_id, // Utiliser l'id du jury trouvé
                'academic_year_id' => $request->academic_year_id,
                'promotion_id' => $request->promotion_id,
                'jury_id' => $jury->id,
                'teacher_id' => $teacher->id // Ajout pour usage ultérieur
            ]);

            return redirect()->route('jury.dashboard')->with([
                'flash' => [
                    'type' => 'success',
                    'message' => 'Bienvenue dans l\'espace Jury'
                ]
            ]);
        }

        // Utilisateur normal: Vérification institution AVANT authentification
        if (!$request->institution_id) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Veuillez sélectionner une institution'
                ]
            ])->withInput();
        }

        // Vérifier l'accès à l'institution
        $hasAccess = false;

        // 1. Vérification via la table pivot
        if ($user->institutions()->where('institutions.id', $request->institution_id)->exists()) {
            $hasAccess = true;
        }

        // 2. Vérification pour les étudiants
        if (!$hasAccess && $user->hasRole('Etudiant')) {
            $student = \Modules\Student\Entities\Student::where('user_id', $user->id)
                ->where('institution_id', $request->institution_id)
                ->first();
            if ($student) {
                $hasAccess = true;
            }
        }

        // 3. Vérification pour les enseignants
        if (!$hasAccess && $user->hasRole('Enseignant')) {
            $teacher = \Modules\Teacher\Entities\Teacher::where('user_id', $user->id)->first();
            if ($teacher && $teacher->institutions()->where('institutions.id', $request->institution_id)->exists()) {
                $hasAccess = true;
            }
        }

        if (!$hasAccess) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Vous n\'avez pas accès à cette institution'
                ]
            ])->withInput();
        }

        // Tout est OK, authentifier
        Auth::login($user, $request->boolean('remember'));

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

        // Force a full page reload to get fresh CSRF token
        return redirect('/login')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Vous êtes déconnecté avec succès'
            ]
        ])->header('X-Inertia-Location', url('/login'));
    }
}
