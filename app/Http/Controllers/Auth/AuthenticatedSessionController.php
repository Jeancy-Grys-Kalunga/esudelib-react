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

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        $institutions = Institution::all();
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'institutions' => $institutions,
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
        ]);

        $credentials = $request->only('email', 'password');
        $user = User::with('institutions')->where('email', $credentials['email'])->first();

        if (!$user) {
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Identifiants incorrects'
                ]
            ]);
        }

        if (!Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password'], 'is_active' => 1])) {
            return back()->with([
                'flash' => [
                    'type' => 'error', 
                    'message' => 'Identifiants incorrects ou compte inactif'
                ]
            ]);
        }

        if ($user->hasRole('Super Admin')) {
            $request->session()->regenerate();
            return redirect()->intended(route('dashboard'))->with([
                'flash' => [
                    'type' => 'success',
                    'message' => 'Bienvenue Administrateur'
                ]
            ]);
        }

        if (!$request->institution_id) {
            Auth::logout();
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Veuillez sélectionner une institution'
                ]
            ]);
        }

        if (!$user->institutions()->where('institutions.id', $request->institution_id)->exists()) {
            Auth::logout();
            return back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Vous n\'avez pas accès à cette institution'
                ]
            ]);
        }

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