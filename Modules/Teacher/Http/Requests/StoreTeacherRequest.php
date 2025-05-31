<?php

namespace Modules\Teacher\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTeacherRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'matricule' => ['required', 'unique:teachers', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'gendre' => ['required', 'in:Féminin,Masculin'],
            'date_of_birth' => ['required', 'date'],
            'phone' => ['required', 'string', 'min:10', 'unique:teachers,phone'],
            'grade' => ['required', 'in:Gradué(e),Licencié(e),Master,Doctorat,PhD',],
            'academic_level' => ['required', 'in:CPP,Chargé(e) de cours,Assistant(e),Chef de travaux,Professeur associé,Professeur,Professeur ordinaire,Professeur émerite'],
            'date_of_hire' => ['nullable', 'date'],
            'specialty' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'institutions' => ['required', 'exists:institutions,id']

        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     */
    public function messages(): array
    {
        return [
            'matricule.required' => 'Le matricule est obligatoire.',
            'matricule.unique' => 'Ce matricule est déjà utilisé.',
            'matricule.max' => 'Le matricule ne doit pas dépasser 255 caractères.',

            'name.required' => 'Le nom est obligatoire.',
            'name.string' => 'Le nom doit être une chaîne de caractères.',
            'name.max' => 'Le nom ne doit pas dépasser 255 caractères.',

            'gendre.required' => 'Le genre est obligatoire.',
            'gendre.in' => 'Le genre sélectionné est invalide. Veuillez choisir entre "Féminin" ou "Masculin".',
            'gendre.string' => 'Le genre doit être une chaîne de caractères.',

            'date_of_birth.required' => 'La date de naissance est obligatoire.',
            'date_of_birth.date' => 'La date de naissance doit être une date valide.',

            'phone.required' => 'Le numéro de téléphone est obligatoire.',
            'phone.string' => 'Le numéro de téléphone doit être une chaîne de caractères.',
            'phone.min' => 'Le numéro de téléphone doit contenir au moins 10 caractères.',
            'phone.unique' => 'Ce numéro de téléphone est déjà utilisé.',

            'grade.required' => 'Le grade est obligatoire.',
            'grade.in' => 'Le grade sélectionné est invalide.',

            'academic_level.required' => 'Le niveau académique est obligatoire.',
            'academic_level.in' => 'Le niveau académique sélectionné est invalide.',


            'date_of_hire.date' => 'La date d\'embauche doit être une date valide.',

            'specialty.required' => 'La spécialité est obligatoire.',
            'specialty.string' => 'La spécialité doit être une chaîne de caractères.',
            'specialty.max' => 'La spécialité ne doit pas dépasser 255 caractères.',
            'address.string' => 'L\'adresse doit être une chaîne de caractères.',
            'address.max' => 'L\'adresse ne doit pas dépasser 500 caractères.',

            'institutions.required' => 'L\'institution est obligatoire.',
            'institutions.exists' => 'L\'institution sélectionnée est invalide.',
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
