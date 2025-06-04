<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUnitTeachingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'cm' => 'required|integer|min:0',
            'tp' => 'required|integer|min:0',
            'td' => 'required|integer|min:0',
            'promotion_id' => [
                'required',
                Rule::exists('promotions', 'id'),
            ],
            'course_ids' => [ // Changé de 'course_id' à 'course_ids'
                'required',
                'array',
                'min:1'
            ],
            'course_ids.*' => [ // Validation pour chaque élément du tableau
                Rule::exists('courses', 'id')
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Le titre est obligatoire.',
            'title.max' => 'Le titre ne doit pas dépasser :max caractères.',
            'cm.required' => 'Le nombre d\'heures de CM est obligatoire.',
            'cm.integer' => 'Le nombre d\'heures de CM doit être un entier.',
            'cm.min' => 'Le nombre d\'heures de CM ne peut pas être négatif.',
            'tp.required' => 'Le nombre d\'heures de TP est obligatoire.',
            'tp.integer' => 'Le nombre d\'heures de TP doit être un entier.',
            'tp.min' => 'Le nombre d\'heures de TP ne peut pas être négatif.',
            'td.required' => 'Le nombre d\'heures de TD est obligatoire.',
            'td.integer' => 'Le nombre d\'heures de TD doit être un entier.',
            'td.min' => 'Le nombre d\'heures de TD ne peut pas être négatif.',
            'promotion_id.required' => 'La promotion est obligatoire.',
            'promotion_id.exists' => 'La promotion sélectionnée est invalide.',
            'course_ids.required' => 'Les cours sont obligatoires.', // Message modifié
            'course_ids.min' => 'Au moins un cours doit être sélectionné.', // Nouveau message
            'course_ids.*.exists' => 'Un des cours sélectionnés est invalide.', // Nouveau message
        ];
    }
}