<?php

namespace Modules\Jury\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MasterTrainingDataset extends Model
{
    use HasFactory;

    protected $table = 'master_training_dataset';

    protected $fillable = [
        'age',
        'provenance',
        'intention_expressed',
        'optional_courses',
        'internships',
        'average_grade',
        'grades_by_subject',
        'actual_master',
        'is_synthetic',
    ];

    protected $casts = [
        'optional_courses' => 'array',
        'internships' => 'array',
        'grades_by_subject' => 'array',
        'is_synthetic' => 'boolean',
        'average_grade' => 'float',
    ];
}
