<?php

namespace Modules\Institution\Entities;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Institution\Database\factories\InstitutionFactory;
use Modules\Student\Entities\Student;
use Modules\Teacher\Entities\Teacher;
use Modules\Institution\Entities\Course;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Institution extends Model implements HasMedia
{

    use HasFactory, InteractsWithMedia;

    protected $guarded = [];

    protected $with = ['media'];


    public function promotions()
    {
        return $this->hasMany(Promotion::class, 'institution_id', 'id');
    }

    public function departments()
    {
        return $this->hasMany(Department::class, 'institution_id', 'id');
    }

    public function faculties()
    {
        return $this->hasMany(Faculty::class, 'institution_id', 'id');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'institution_id', 'id');
    }

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'institution_teacher');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'institution_user');
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }

    public function programs()
    {
        return $this->hasMany(Program::class);
    }
}
