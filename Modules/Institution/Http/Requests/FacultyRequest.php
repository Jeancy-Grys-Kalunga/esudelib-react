<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FacultyRequest extends FormRequest
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
                Rule::unique('faculties')->where(function ($query) {
                    return $query->where('institution_id', $this->institution_id);
                })->ignore($this->faculty)
            ],
            'institution_id' => [
                'required',
                'exists:institutions,id'
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Le nom de la faculté est obligatoire.',
            'title.max' => 'Le nom de la faculté ne doit pas dépasser :max caractères.',
            'title.unique' => 'Une faculté avec ce nom existe déjà pour cette institution.',
            
            'institution_id.required' => 'L\'institution est obligatoire.',
            'institution_id.exists' => 'L\'institution sélectionnée est invalide.',
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