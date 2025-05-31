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
            'gendre' => ['required'],
            'date_of_birth' => ['required', 'date'],
            'phone' => ['required', 'string', 'min:10', 'unique:teachers,phone'],
            'grade'=> ['required', 'in:Gradué(e),Licencié(e),Master,Doctorat,PhD'],
            'academic_level' => ['required', 'in:CPP,Chargé(e) de cours,Assistant(e),Chef de travaux,Professeur associé, Professeur, Professeur ordinaire,Professeur émerite'],
            'date_of_hire' => ['nullable', 'date'],
            'specialty' => ['required'],
            'address' => ['nullable'],
            'institutions' => ['required','exists:institutions,id']

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
