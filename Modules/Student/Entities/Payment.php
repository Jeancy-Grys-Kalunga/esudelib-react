<?php

namespace Modules\Student\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Student\Database\factories\PaymentFactory;

class Payment extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Modules\Student\Database\Factories\PaymentFactory::new();
    }

    protected $table = 'payments';

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = [];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id', 'id');
    }
}
