<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CourseCategory extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Modules\Institution\Database\Factories\CourseCategoryFactory::new();
    }

    protected $fillable = [
        'name',
        'slug',
        'description'
    ];

    public function courses()
    {
        return $this->hasMany(Course::class);
    }
}
