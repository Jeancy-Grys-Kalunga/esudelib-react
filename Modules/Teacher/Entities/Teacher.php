<?php

namespace Modules\Teacher\Entities;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Entities\Assignment;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Jury;
use Modules\Teacher\Database\factories\TeacherFactory;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Teacher extends Model implements HasMedia
{

    use HasFactory, InteractsWithMedia;

    protected $guarded = [];
    public $preventsLazyLoading = true;

    protected $with = ['media', 'institutions'];


    public function institutions()
    {
        return $this->belongsToMany(Institution::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class);
    }

    public function holderAssignments()
    {
        return $this->hasMany(Assignment::class, 'holder_id');
    }

    public function collaboratorAssignments()
    {
        return $this->hasMany(Assignment::class, 'collaborator_id');
    }

    public function presidents()
    {
        return $this->hasMany(Jury::class, 'president_id');
    }
    public function secretaries()
    {
        return $this->hasMany(Jury::class, 'secretary_id');
    }
    public function members()
    {
        return $this->hasMany(Jury::class, 'member_id');
    }

    // Modules\Teacher\Entities\Teacher.php
    public function courses()
    {
        return $this->belongsToMany(Course::class, 'assignments', 'holder_id')
            ->orWhere('collaborator_id', $this->id)
            ->distinct();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
