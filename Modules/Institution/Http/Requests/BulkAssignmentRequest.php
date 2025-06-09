<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkAssignmentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'assignments.*.institution_id' => [
                'required',
                Rule::exists('institutions', 'id')
            ],
            'assignments.*.teaching_unit_id' => [
                'required',
                Rule::exists('units_teachings', 'id')
            ],
            'assignments.*.academic_year_id' => [
                'required',
                Rule::exists('academic_years', 'id')
            ],
            'assignments.*.holder_id' => [
                'required',
                Rule::exists('teachers', 'id')
            ],
            'assignments.*.collaborator_id' => [
                'nullable',
                Rule::exists('teachers', 'id'),
                'different:assignments.*.holder_id'
            ],
            'assignments.*.observation' => 'nullable|string|max:500',
            
            // Pour les mises à jour
            'assignments.*.id' => 'nullable|exists:assignments,id',
        ];
    }

    public function messages()
    {
        return [
            'assignments.*.institution_id.required' => 'L\'institution est obligatoire',
            'assignments.*.institution_id.exists' => 'L\'institution sélectionnée est invalide',
            
            'assignments.*.teaching_unit_id.required' => 'L\'unité d\'enseignement est obligatoire',
            'assignments.*.teaching_unit_id.exists' => 'L\'unité d\'enseignement sélectionnée est invalide',
            
            'assignments.*.academic_year_id.required' => 'L\'année académique est obligatoire',
            'assignments.*.academic_year_id.exists' => 'L\'année académique sélectionnée est invalide',
            
            'assignments.*.holder_id.required' => 'Le titulaire est obligatoire',
            'assignments.*.holder_id.exists' => 'Le titulaire sélectionné est invalide',
            
            'assignments.*.collaborator_id.exists' => 'Le collaborateur sélectionné est invalide',
            'assignments.*.collaborator_id.different' => 'Le collaborateur ne peut pas être le même que le titulaire',
            
            'assignments.*.id.exists' => 'L\'attribution à mettre à jour est invalide',
        ];
    }
}
