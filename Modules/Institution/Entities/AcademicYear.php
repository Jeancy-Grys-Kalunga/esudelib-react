<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Entities\Assignment;
use Modules\Student\Entities\Note;

class AcademicYear extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Modules\Institution\Database\Factories\AcademicYearFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = ['title'];

    // public function inscriptions()
    // {
    //     return $this->hasMany(Inscription::class, 'academic_year_id', 'id');
    // }

    public function palmares()
    {
        return $this->hasMany(Palmares::class, 'academic_year_id', 'id');
    }

    public function notes()
    {
        return $this->hasMany(Note::class, 'academic_year_id', 'id');
    }

    public function juries()
    {
        return $this->hasMany(Jury::class, 'academic_year_id', 'id');
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class, 'academic_year_id', 'id');
    }


    // Dans Modules\Institution\Entities\AcademicYear.php
    public static function current()
    {
        return self::latest()->first();
    }
}
