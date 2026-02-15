<?php

namespace Modules\Institution\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Department extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Modules\Institution\Database\Factories\DepartmentFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [];

    public $preventsLazyLoading = true;

    protected $with = ['institution'];

    public function institution()
    {
        return $this->belongsTo(Institution::class, 'institution_id', 'id');
    }
}
