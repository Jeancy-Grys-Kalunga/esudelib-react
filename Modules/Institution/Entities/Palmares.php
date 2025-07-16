<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Database\factories\PalmaresFactory;
use Modules\Student\Entities\Student;

class Palmares extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [];
    
    public function student() {
        return $this->belongsTo(Student::class, 'student_id', 'id');
    }

    public function promotion() {
        return $this->belongsTo(Promotion::class, 'promotion_id', 'id');
    }

    public function academicYear() {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id', 'id');
    }
}
