<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Database\factories\JuryFactory;

class Jury extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [];

    public function promotion() {
        return $this->belongsTo(Promotion::class, 'promotion_id', 'id');
    }

    public function academicYear() {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id', 'id');
    }
}
