<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkJuryRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'juries.*.president_id' => [  // Changé de 'president' à 'president_id'
                'required',
                'integer',
                Rule::exists('teachers', 'id')
            ],
            'juries.*.secretary_id' => [  // Changé de 'secretary' à 'secretary_id'
                'required',
                'integer',
                Rule::exists('teachers', 'id')
            ],
            'juries.*.member_id' => [  // Changé de 'member' à 'member_id'
                'required',
                'integer',
                Rule::exists('teachers', 'id')
            ],
            'juries.*.observation' => 'nullable|string|max:500',
            'juries.*.academic_year_id' => [
                'required',
                'integer',
                Rule::exists('academic_years', 'id')
            ],
            'juries.*.promotion_id' => [
                'required',
                'integer',
                Rule::exists('promotions', 'id')
            ],
            
            // Pour les mises à jour
            'juries.*.id' => 'nullable|integer|exists:juries,id',
        ];
    }

    public function messages()
    {
        return [
            'juries.*.president_id.required' => 'Le président est obligatoire',
            'juries.*.president_id.integer' => 'L\'ID du président doit être un entier',
            'juries.*.president_id.exists' => 'Le président sélectionné est invalide',
            
            'juries.*.secretary_id.required' => 'Le secrétaire est obligatoire',
            'juries.*.secretary_id.integer' => 'L\'ID du secrétaire doit être un entier',
            'juries.*.secretary_id.exists' => 'Le secrétaire sélectionné est invalide',
            
            'juries.*.member_id.required' => 'Le membre est obligatoire',
            'juries.*.member_id.integer' => 'L\'ID du membre doit être un entier',
            'juries.*.member_id.exists' => 'Le membre sélectionné est invalide',
            
            'juries.*.academic_year_id.required' => 'L\'année académique est obligatoire',
            'juries.*.academic_year_id.integer' => 'L\'ID de l\'année académique doit être un entier',
            'juries.*.academic_year_id.exists' => 'L\'année académique sélectionnée est invalide',
            
            'juries.*.promotion_id.required' => 'La promotion est obligatoire',
            'juries.*.promotion_id.integer' => 'L\'ID de la promotion doit être un entier',
            'juries.*.promotion_id.exists' => 'La promotion sélectionnée est invalide',
            
            'juries.*.id.integer' => 'L\'ID du jury doit être un entier',
            'juries.*.id.exists' => 'Le jury à mettre à jour est invalide',
        ];
    }
}
