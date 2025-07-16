<?php

namespace Modules\Student\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Course;
use Modules\Student\Database\factories\NoteFactory;

class Note extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [];

    public function student() {
        return $this->belongsTo(Student::class, 'student_id', 'id');
    }

    public function course() {
        return $this->belongsTo(Course::class, 'course_id', 'id');
    }

    public function academicYear() {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id', 'id');
    }
}
