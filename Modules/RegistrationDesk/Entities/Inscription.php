<?php

namespace Modules\RegistrationDesk\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\RegistrationDesk\Database\Factories\InscriptionFactory;

class Inscription extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [];

    // protected static function newFactory(): InscriptionFactory
    // {
    //     // return InscriptionFactory::new();
    // }
}
