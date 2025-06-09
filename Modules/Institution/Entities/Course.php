<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Database\factories\CourseFactory;
use Modules\Student\Entities\Note;

class Course extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [];


    public $preventsLazyLoading = true;

    protected $with = ['institution'];


    public function institution()
    {
        return $this->belongsTo(Institution::class, 'institution_id', 'id');
    }

    public function notes()
    {
        return $this->hasMany(Note::class, 'course_id', 'id');
    }

    public function category()
    {
        return $this->belongsTo(CourseCategory::class, 'course_category_id');
    }

    public function programs()
    {
        return $this->belongsToMany(Program::class);
    }
    public function unitsTeaching()
    {
        return $this->belongsToMany(UnitsTeaching::class, 'course_units_teaching', 'course_id', 'units_teaching_id');
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class, 'course_id', 'id');
    }
}
