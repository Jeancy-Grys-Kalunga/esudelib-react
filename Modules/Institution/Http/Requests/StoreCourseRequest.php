<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Institution\Entities\Course;

class StoreCourseRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'title' => [
                'required',
                'string',
                'max:255',
                Rule::unique('courses')->where(function ($query) {
                    return $query->where('institution_id', $this->institution_id);
                })
            ],
            'credits' => 'required|integer|min:1|max:10',
            'institution_id' => [
                'required',
                'exists:institutions,id',
                Rule::when(
                    auth()->user()->hasRole('Secrétaire Académique'),
                    Rule::in(auth()->user()->institutions()->pluck('id')->toArray())
                ),
            ],
            'course_category_id' => 'required|exists:course_categories,id',
        ];
    }

    public function messages()
    {
        return [
            'title.required' => 'Le titre du cours est obligatoire',
            'title.unique' => 'Ce cours existe déjà dans cette institution',
            'credits.required' => 'Le nombre de crédits est obligatoire',
            'credits.integer' => 'Les crédits doivent être un nombre entier',
            'credits.min' => 'Le cours doit avoir au moins 1 crédit',
            'credits.max' => 'Le cours ne peut pas avoir plus de 10 crédits',
            'institution_id.required' => 'L\'institution est obligatoire',
            'institution_id.exists' => 'L\'institution sélectionnée est invalide',
            'course_category_id.required' => 'La catégorie du cours est obligatoire',
            'course_category_id.exists' => 'La catégorie sélectionnée est invalide',
        ];
    }
}