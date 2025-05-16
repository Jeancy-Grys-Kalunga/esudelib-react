<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MassUnitsTeachingRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
       return [
            'ids' => 'sometimes|array',
            'ids.*' => 'sometimes|exists:units_teachings,id',
            'titles' => 'required|array|min:1',
            'titles.*' => 'required|string|min:3|max:255',
            'cms' => 'required|array|min:1',
            'cms.*' => 'required|integer|min:0',
            'tps' => 'required|array|min:1',
            'tps.*' => 'required|integer|min:0',
            'tds' => 'required|array|min:1',
            'tds.*' => 'required|integer|min:0',
            'course_id' => 'required|exists:courses,id',
            'promotion_id' => 'required|exists:promotions,id'
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'titles.required' => 'Au moins une unité doit être spécifiée',
            'titles.*.required' => 'Le titre de chaque unité est requis',
            'titles.*.min' => 'Le titre doit contenir au moins 3 caractères',
            'titles.*.max' => 'Le titre ne doit pas dépasser 255 caractères',
            'cms.required' => 'Les heures CM sont requises',
            'cms.*.required' => 'Les heures CM sont requises pour chaque unité',
            'cms.*.min' => 'Les heures CM ne peuvent pas être négatives',
            'tps.required' => 'Les heures TP sont requises',
            'tps.*.required' => 'Les heures TP sont requises pour chaque unité',
            'tps.*.min' => 'Les heures TP ne peuvent pas être négatives',
            'tds.required' => 'Les heures TD sont requises',
            'tds.*.required' => 'Les heures TD sont requises pour chaque unité',
            'tds.*.min' => 'Les heures TD ne peuvent pas être négatives',
            'course_id.required' => 'Veuillez sélectionner un cours',
            'course_id.exists' => 'Le cours sélectionné n\'existe pas',
            'promotion_id.required' => 'Veuillez sélectionner une promotion',
            'promotion_id.exists' => 'La promotion sélectionnée n\'existe pas'
        ];
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }
}
