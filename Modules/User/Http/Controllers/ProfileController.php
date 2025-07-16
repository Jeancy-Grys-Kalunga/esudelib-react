<?php

namespace Modules\User\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Upload\Entities\Upload;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Contracts\Support\Renderable;
use Modules\User\Rules\MatchCurrentPassword;

class ProfileController extends Controller
{

    public function edit()
    {
        return view('user::profile');
    }


    public function update(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . auth()->id()
        ]);

        auth()->user()->update([
            'name'  => $request->name,
            'email' => $request->email
        ]);


        $user = auth()->user();


        if ($request->has('document')) {
            if (count($user->getMedia('avatars')) > 0) {
                foreach ($user->getMedia('avatars') as $media) {
                    if (!in_array($media->file_name, $request->input('document', []))) {
                        $media->delete();
                    }
                }
            }
        }

        $media = $user->getMedia('avatars')->pluck('file_name')->toArray();

        foreach ($request->input('document', []) as $file) {
            if (count($media) === 0 || !in_array($file, $media)) {
                $user->addMedia(Storage::path('temp/dropzone/' . $file))->toMediaCollection('avatars');
            }
        }

        toast('Profil de l\'utilisateur modifié avec succès!', 'success');

        return back();
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password'  => ['required', 'max:255', new MatchCurrentPassword()],
            'password' => 'required|min:8|max:255|confirmed'
        ]);

        auth()->user()->update([
            'password' => Hash::make($request->password)
        ]);

        toast('Mot de Passe Modifié avec succès!', 'success');

        return back();
    }
}
