<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Teacher\Entities\Teacher;

class Assignment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'holder_id',
        'collaborator_id',
        'teaching_unit_id',
        'academic_year_id',
        'observation',
        'institution_id'
    ];

    /**
     * Relation avec le titulaire (Teacher)
     */
    public function holder()
    {
        return $this->belongsTo(Teacher::class, 'holder_id');
    }

    /**
     * Relation avec le collaborateur (Teacher)
     */
    public function collaborator()
    {
        return $this->belongsTo(Teacher::class, 'collaborator_id');
    }

    /**
     * Relation avec l'unité d'enseignement
     */
    public function teachingUnit()
    {
        return $this->belongsTo(UnitsTeaching::class, 'teaching_unit_id');
    }

    /**
     * Relation avec l'année académique
     */
    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }
}
