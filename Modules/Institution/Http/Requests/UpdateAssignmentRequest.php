<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Institution\Entities\Assignment;

class UpdateAssignmentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $assignment = $this->route('assignment');
        
        return [
            'institution_id' => [
                'required',
                Rule::exists('institutions', 'id')
            ],
            'teaching_unit_id' => [
                'required',
                Rule::exists('units_teachings', 'id')
            ],
           'academic_year_id' => [
                'required',
                Rule::exists('academic_years', 'id'),
                Rule::unique('assignments')
                    ->where('institution_id', $this->institution_id)
                    ->where('teaching_unit_id', $this->teaching_unit_id)
                    ->ignore($this->route('assignments')) 
            ],
            'holder_id' => [
                'required',
                Rule::exists('teachers', 'id')
            ],
            'collaborator_id' => [
                'nullable',
                Rule::exists('teachers', 'id')
            ],
            'observation' => 'nullable|string|max:500',
        ];
    }

    public function messages()
    {
        return [
            'institution_id.required' => 'L\'institution est obligatoire',
            'institution_id.exists' => 'L\'institution sélectionnée est invalide',
            
            'teaching_unit_id.required' => 'L\'unité d\'enseignement est obligatoire',
            'teaching_unit_id.exists' => 'L\'unité d\'enseignement sélectionnée est invalide',
            
            'academic_year_id.required' => 'L\'année académique est obligatoire',
            'academic_year_id.exists' => 'L\'année académique sélectionnée est invalide',
            'academic_year_id.unique' => 'Cette unité est déjà attribuée pour cette institution et année académique',
            
            'holder_id.required' => 'Le titulaire est obligatoire',
            'holder_id.exists' => 'Le titulaire sélectionné est invalide',
            
            'collaborator_id.exists' => 'Le collaborateur sélectionné est invalide',
        ];
    }
}