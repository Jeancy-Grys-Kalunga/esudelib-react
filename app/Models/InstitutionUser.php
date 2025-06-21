<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstitutionUser extends Model
{
    protected $table = 'institution_user';
    protected $fillable = ['institution_id', 'user_id'];
}
