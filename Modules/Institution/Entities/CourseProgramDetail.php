<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Database\factories\CourseProgramDetailFactory;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Program;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\UnitsTeaching;
use Modules\Institution\Entities\CourseCategory;
class CourseProgramDetail extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [];

    public $preventsLazyLoading = true;

    protected $with = ['course', 'program', 'promotion', 'unitsTeaching', 'category'];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function program()
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class, 'promotion_id');
    }

    public function unitsTeaching()
    {
        return $this->belongsTo(UnitsTeaching::class, 'units_teaching_id');
    }

    public function category()
    {
        return $this->belongsTo(CourseCategory::class, 'course_category_id');
    }
}


