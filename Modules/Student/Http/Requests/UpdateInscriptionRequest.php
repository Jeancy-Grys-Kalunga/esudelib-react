<?php

namespace Modules\RegistrationDesk\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInscriptionRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'gendre' => 'required|in:Masculin,Féminin',
            'date_of_birth' => 'required|date',
            'phone' => 'required|string|max:20',
            'institution_id' => [
                'required',
                Rule::exists('institutions', 'id')->where(function ($query) {
                    if (auth()->user()->hasRole('Bureau Inscription')) {
                        $query->whereIn('id', auth()->user()->institutions()->pluck('id'));
                    }
                })
            ],
            'academic_year_id' => 'required|exists:academic_years,id',
            'promotion_id' => 'required|exists:promotions,id'
        ];
    }

    public function messages()
    {
        return [
            'institution_id.exists' => 'Institution non autorisée pour cet utilisateur',
            '*.required' => 'Ce champ est obligatoire'
        ];
    }
}
