<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UnitsTeachingRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
         return [
            'title' => 'required|string|min:3|max:255',
            'cm' => 'required|integer|min:0',
            'tp' => 'required|integer|min:0',
            'td' => 'required|integer|min:0',
            'course_id' => 'required|exists:courses,id',
            'promotion_id' => 'required|exists:promotions,id'
        ];
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

     /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Le titre de l\'unité est requis',
            'title.min' => 'Le titre doit contenir au moins 3 caractères',
            'title.max' => 'Le titre ne doit pas dépasser 255 caractères',
            'cm.required' => 'Le nombre d\'heures CM est requis',
            'cm.min' => 'Le nombre d\'heures CM ne peut pas être négatif',
            'tp.required' => 'Le nombre d\'heures TP est requis',
            'tp.min' => 'Le nombre d\'heures TP ne peut pas être négatif',
            'td.required' => 'Le nombre d\'heures TD est requis',
            'td.min' => 'Le nombre d\'heures TD ne peut pas être négatif',
            'course_id.required' => 'Veuillez sélectionner un cours',
            'course_id.exists' => 'Le cours sélectionné n\'existe pas',
            'promotion_id.required' => 'Veuillez sélectionner une promotion',
            'promotion_id.exists' => 'La promotion sélectionnée n\'existe pas'
        ];
    }
}
