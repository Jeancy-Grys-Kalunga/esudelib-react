<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Database\factories\JuryFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Teacher\Entities\Teacher;

class Jury extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Modules\Institution\Database\Factories\JuryFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'president_id',
        'secretary_id',
        'member_id',
        'observation',
        'institution_id',
        'promotion_id',
        'academic_year_id',
    ];

    public function promotion()
    {
        return $this->belongsTo(Promotion::class, 'promotion_id', 'id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id', 'id');
    }

    public function president(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'president_id');
    }

    public function secretary(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'secretary_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'member_id');
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class, 'institution_id', 'id');
    }
}
