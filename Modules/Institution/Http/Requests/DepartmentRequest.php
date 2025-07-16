<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => [
                'required',
                'string',
                'max:255',
                // Mise à jour du nom de la table
                Rule::unique('departments')->where(function ($query) {
                    return $query->where('institution_id', $this->institution_id);
                })->ignore($this->department)
            ],
            'institution_id' => [
                'required',
                'exists:institutions,id'
            ],
        ];
    }

    public function messages(): array
    {
        // Mise à jour des messages pour "département"
        return [
            'title.required' => 'Le nom du département est obligatoire.',
            'title.max' => 'Le nom du département ne doit pas dépasser :max caractères.',
            'title.unique' => 'Un département avec ce nom existe déjà pour cette institution.',
            
            'institution_id.required' => 'L\'institution est obligatoire.',
            'institution_id.exists' => 'L\'institution sélectionnée est invalide.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}