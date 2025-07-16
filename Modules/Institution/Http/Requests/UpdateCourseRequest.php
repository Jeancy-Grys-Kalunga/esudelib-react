<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Institution\Entities\Course;

class UpdateCourseRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $courseId = $this->route('course'); 
        
        return [
            'title' => [
                'required',
                'string',
                'max:255',
                Rule::unique('courses', 'title')->ignore($courseId),
            ],
            'orientation' => 'nullable|string|max:255',
        ];
    }

    public function messages()
    {
        return [
            'title.required' => 'Le titre du cours est obligatoire',
            'title.unique' => 'Ce cours existe déjà dans cette institution',
            'title.string' => 'Le titre doit être une chaîne de caractères',
            'title.max' => 'Le titre ne doit pas dépasser 255 caractères',
            'orientation.string' => 'L\'orientation doit être une chaîne de caractères',
            'orientation.max' => 'L\'orientation ne doit pas dépasser 255 caractères',
        ];
    }
}