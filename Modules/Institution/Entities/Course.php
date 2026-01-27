<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Database\factories\CourseFactory;
use Modules\Student\Entities\Appeal;
use Modules\Student\Entities\Note;
use Modules\Student\Entities\Student;

class Course extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [];


    public $preventsLazyLoading = true;

    protected $with = ['unitsTeaching', 'assignments', 'students', 'notes', 'appeals'];




    public function notes()
    {
        return $this->hasMany(Note::class, 'course_id', 'id');
    }


    public function unitsTeaching()
    {
        return $this->belongsToMany(UnitsTeaching::class, 'course_units_teaching', 'course_id', 'units_teaching_id');
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class, 'course_id', 'id');
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'course_student');
    }

    public function appeals()
    {
        return $this->hasMany(Appeal::class, 'course_id', 'id');
    }

    // Dans app/Models/Course.php
    public function courseProgramDetails()
    {
        return $this->hasMany(CourseProgramDetail::class);
    }

    public function studentCourse()
    {
        return $this->belongsToMany(Student::class)
            ->using(CourseProgramDetail::class)
            ->withPivot(['promotion_id', 'academic_year_id']);
    }

    public function promotions()
    {
        return $this->belongsToMany(Promotion::class, 'course_program_details', 'course_id', 'promotion_id');
    }
}
