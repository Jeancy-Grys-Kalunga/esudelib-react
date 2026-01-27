<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Institution\Database\Factories\CourseCategoryFactory;

class CourseCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description'
    ];

    public function courses()
    {
        return $this->hasMany(Course::class);
    }


    // protected static function newFactory(): CourseCategoryFactory
    // {
    //     // return CourseCategoryFactory::new();
    // }
}
