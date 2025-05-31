<?php
namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Institution\Entities\Course;

class MassCourseRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'institution_id' => 'required|exists:institutions,id',
            'ids'            => 'sometimes|array',
            'ids.*'          => 'sometimes|exists:courses,id',
            'titles'         => 'required|array|min:1',
            'titles.*'       => 'required|string|min:3|max:255',
            'credits'        => 'required|array|min:1',
            'credits.*'      => 'required|integer|min:1|max:10',
            'contents'       => 'required|array|min:1',
            'contents.*'     => 'required|string|min:10',
        ];
    }

    public function messages()
    {
        return [
            'institution_id.required' => 'L\'institution est requise.',
            'institution_id.exists'   => 'L\'institution sélectionnée n\'existe pas.',
            'titles.required'         => 'Au moins un titre de cours est requis.',
            'titles.*.required'       => 'Le titre du cours est requis.',
            'titles.*.min'            => 'Le titre du cours doit contenir au moins :min caractères.',
            'titles.*.max'            => 'Le titre du cours ne peut excéder :max caractères.',
            'credits.required'        => 'Au moins un nombre de crédits est requis.',
            'credits.*.required'      => 'Le nombre de crédits est requis.',
            'credits.*.integer'       => 'Le nombre de crédits doit être un entier.',
            'credits.*.min'           => 'Le nombre de crédits doit être d\'au moins :min.',
            'credits.*.max'           => 'Le nombre de crédits ne peut excéder :max.',
            'contents.required'       => 'Au moins un contenu de cours est requis.',
            'contents.*.required'     => 'Le contenu du cours est requis.',
            'contents.*.min'          => 'Le contenu du cours doit contenir au moins :min caractères.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $user = auth()->user();

            // Vérification pour le Secrétaire Académique
            if ($user->hasRole('Secrétaire Académique')) {
                $institutionIds = $user->institutions()->pluck('institutions.id');

                // Vérification de l'institution sélectionnée
                if (! $institutionIds->contains($this->institution_id)) {
                    $validator->errors()->add('institution_id', 'Vous n\'êtes pas autorisé à modifier des cours pour cette institution.');
                }

                // Vérification des institutions des cours existants
                if ($this->ids) {
                    $unauthorizedCourses = Course::whereIn('id', $this->ids)
                        ->whereNotIn('institution_id', $institutionIds)
                        ->count();

                    if ($unauthorizedCourses > 0) {
                        $validator->errors()->add('ids', 'Vous n\'êtes pas autorisé à modifier certains des cours sélectionnés.');
                    }
                }
            }
        });
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }
}
