<?php

namespace Modules\Jury\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Student\Entities\Student;

class MasterPrediction extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'age',
        'provenance',
        'intention_expressed',
        'optional_courses',
        'internships',
        'predicted_master',
        'confidence_score',
        'prediction_details',
        'predicted_at',
    ];

    protected $casts = [
        'optional_courses' => 'array',
        'internships' => 'array',
        'prediction_details' => 'array', // Ensures automatic json_encode/decode
        'predicted_at' => 'datetime',
        'confidence_score' => 'float',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
