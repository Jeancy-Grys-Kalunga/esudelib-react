<?php

namespace Modules\Student\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AppealItem extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function appeal()
    {
        return $this->belongsTo(Appeal::class);
    }

    public function documents()
    {
        return $this->hasMany(AppealDocument::class);
    }
}
