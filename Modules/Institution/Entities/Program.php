<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Database\factories\ProgramFactory;

class Program extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
   protected $guarded = [];


    public $preventsLazyLoading = true;

    protected $with = ['courses'];

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
}
