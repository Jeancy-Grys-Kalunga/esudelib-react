<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CourseRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255|unique:courses,title,' . $this->route('course') . ',id',
            'content' => 'required|string',
        ];
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the custom messages for the validation rules.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Le titre du cours est obligatoire',
            'title.string' => 'Le titre doit être une chaîne de caractères',
            'title.max' => 'Le titre ne doit pas dépasser 255 caractères',
            'title.unique' => 'Un cours avec ce titre existe déjà'
        ];
    }
    /**
     * Prepare the data for validation.
     */
}
