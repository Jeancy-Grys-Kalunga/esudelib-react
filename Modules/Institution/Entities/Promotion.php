<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Database\Factories\PromotionFactory;
use Modules\RegistrationDesk\Entities\Inscription;

class Promotion extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Modules\Institution\Database\Factories\PromotionFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [];


    public $preventsLazyLoading = true;

    protected $with = ['institution', 'faculty'];

    public function institution()
    {
        return $this->belongsTo(Institution::class, 'institution_id', 'id');
    }

    public function faculty()
    {
        return $this->belongsTo(Faculty::class, 'faculty_id', 'id');
    }

    public function inscriptions()
    {
        return $this->hasMany(Inscription::class, 'promotion_id', 'id');
    }

    public function palmares()
    {
        return $this->hasMany(Palmares::class, 'promotion_id', 'id');
    }

    public function unitsTeachings()
    {
        return $this->hasMany(UnitsTeaching::class, 'promotion_id', 'id');
    }

    public function juries()
    {
        return $this->hasMany(Jury::class, 'promotion_id', 'id');
    }
}
