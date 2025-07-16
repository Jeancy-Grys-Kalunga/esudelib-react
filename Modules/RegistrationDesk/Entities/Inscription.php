<?php

namespace Modules\RegistrationDesk\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Promotion;
use Modules\Student\Entities\Student;

// use Modules\RegistrationDesk\Database\Factories\InscriptionFactory;

class Inscription extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [];

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class);
    }
    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
