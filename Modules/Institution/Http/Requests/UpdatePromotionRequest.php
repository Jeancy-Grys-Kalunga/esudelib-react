<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePromotionRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => [
                'required',
                'string',
                'max:255',
                Rule::unique('promotions')->where(function ($query) {
                    return $query->where('institution_id', $this->institution_id);
                })->ignore($this->route('promotion'))
            ],
            'institution_id' => [
                'required',
                'exists:institutions,id'
            ],
            'faculty_id' => [
                'required',
                'exists:faculties,id',
                Rule::exists('faculties', 'id')->where('institution_id', $this->institution_id)
            ],    
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Le nom de la promotion est obligatoire.',
            'title.max' => 'Le nom de la promotion ne doit pas dépasser :max caractères.',
            'title.unique' => 'Une promotion avec ce nom existe déjà pour cette institution.',
            
            'institution_id.required' => 'L\'institution est obligatoire.',
            'institution_id.exists' => 'L\'institution sélectionnée est invalide.',
            
            'faculty_id.required' => 'La faculté est obligatoire.',
            'faculty_id.exists' => 'La faculté sélectionnée est invalide ou n\'appartient pas à l\'institution choisie.',
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