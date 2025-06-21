<?php

namespace Modules\Student\Entities;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia; 

class AppealDocument extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [];

    protected $with = ['media'];

    public function appeal() {
        return $this->belongsTo(Appeal::class, 'appeal_id', 'id');
    }
}