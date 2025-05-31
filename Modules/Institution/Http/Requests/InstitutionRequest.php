<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class InstitutionRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $rules = [
            'description' => ['nullable', 'string', 'min:10', 'max:1000'],
            'address' => ['nullable', 'string', 'min:8', 'max:255'],
            'phone' => ['required', 'string', 'min:10'],
            'active' => ['nullable', 'boolean'],
            'document' => ['nullable', 'array'],
            'document.*' => ['string']
        ];

        // Règle pour le nom - unique seulement à la création
        $nameRules = ['required', 'string', 'max:255'];
        
        if ($this->isMethod('post')) {
            $nameRules[] = Rule::unique('institutions', 'name');
        }

        $rules['name'] = $nameRules;

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de l\'institution est obligatoire',
            'name.unique' => 'Ce nom d\'institution est déjà utilisé',
            'phone.required' => 'Le numéro de téléphone est obligatoire',
            'phone.min' => 'Le numéro de téléphone doit avoir au moins :min caractères',
            'description.min' => 'La description doit avoir au moins :min caractères',
            'address.min' => 'L\'adresse doit avoir au moins :min caractères',
            'document.*.string' => 'Les documents doivent être des chaînes valides'
        ];
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if ($this->route('institutions')) {
            return Gate::allows('edit_institutions');
        }
        return Gate::allows('create_institutions');
    }
}