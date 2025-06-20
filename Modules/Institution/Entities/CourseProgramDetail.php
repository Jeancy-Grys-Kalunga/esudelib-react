<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CourseProgramDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_id',
        'course_id',
        'promotion_id',
        'units_teaching_id',
        'course_category_id',
        'cm',
        'td',
        'tp',
        'credits'
    ];

    protected $casts = [
        'cm' => 'float',
        'td' => 'float',
        'tp' => 'float',
        'credits' => 'float',
    ];


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
