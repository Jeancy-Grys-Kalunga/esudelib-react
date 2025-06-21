<?php

namespace Modules\Calendar\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Promotion;

class CalendarEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
        'location',
        'type',
        'institution_id',
        'promotion_id'
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class);
    }

    protected static function newFactory()
    {
        return \Modules\Calendar\Database\factories\CalendarEventFactory::new();
    }
}