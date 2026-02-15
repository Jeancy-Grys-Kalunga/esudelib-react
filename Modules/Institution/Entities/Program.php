<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Database\Factories\ProgramFactory;

class Program extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Modules\Institution\Database\Factories\ProgramFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [];


    // public $preventsLazyLoading = true;

    // protected $with = ['courses', 'institution', 'department', 'faculty', 'courseDetails'];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

    public function courses()
    {
        return $this->belongsToMany(Course::class);
    }

    public function courseDetails()
    {
        return $this->hasMany(CourseProgramDetail::class);
    }

    // Charger les relations uniquement quand nécessaire
    public function loadDetails()
    {
        return $this->load([
            'courseDetails' => function ($query) {
                $query->with([
                    'course:id,title',
                    'promotion:id,title',
                    'unitsTeaching:id,title',
                    'category:id,name'
                ]);
            }
        ]);
    }
}
