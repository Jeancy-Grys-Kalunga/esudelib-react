<?php

namespace Modules\Student\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Palmares;
use Modules\RegistrationDesk\Entities\Inscription;
use Modules\Student\Database\factories\StudentFactory;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;


class Student extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [];

    protected $with = ['media'];

    public function institution() {
        return $this->belongsTo(Institution::class, 'institution_id', 'id');
    }

    public function notes() {
        return $this->hasMany(Note::class, 'student_id', 'id');
    }

    public function appeals() {
        return $this->hasMany(Appeal::class, 'student_id', 'id');
    }

    public function payments() {
        return $this->hasMany(Payment::class, 'student_id', 'id');
    }

    public function inscriptions() {
        return $this->hasMany(Inscription::class, 'student_id', 'id');
    }

    public function palmares() {
        return $this->hasMany(Palmares::class, 'student_id', 'id');
    }


}
