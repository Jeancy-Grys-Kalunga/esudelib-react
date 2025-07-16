<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Database\factories\SemestreFactory;

class Semestre extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [];
    

    public function courseProgramDetails()
    {
        return $this->hasMany(CourseProgramDetail::class);
    }

}
