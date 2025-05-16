<?php

namespace Modules\Institution\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProgramRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'content' => 'nullable|string',
            'institution_id' => 'required|exists:institutions,id',
            'department_id' => 'required|exists:departments,id',
            'faculty_id' => 'required|exists:faculties,id',
            'courses' => 'array|exists:courses,id'
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
