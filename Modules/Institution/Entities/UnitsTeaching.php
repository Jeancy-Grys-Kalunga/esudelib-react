<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UnitsTeaching extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Modules\Institution\Database\Factories\UnitsTeachingFactory::new();
    }

    protected $guarded = [];

    public function courses()
    {
        return $this->belongsToMany(Course::class);
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class, 'promotion_id', 'id');
    }
}
