<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Modules\Institution\Entities\Institution;
use Modules\Student\Entities\Student;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\File;
use Spatie\Permission\Traits\HasRoles;
use Modules\Teacher\Entities\Teacher;
use Spatie\Permission\Models\Permission;


class User extends Authenticatable implements HasMedia
{
    use HasFactory, Notifiable, HasRoles, InteractsWithMedia;

    public $preventsLazyLoading = true;


    protected $with = ['institutions', 'media', 'roles', 'permissions', 'teacher'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active'
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];


    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatars')
            ->useFallbackUrl('https://www.gravatar.com/avatar/' . md5("test@mail.com"));
    }

    public function scopeIsActive(Builder $builder)
    {
        return $builder->where('is_active', 1);
    }

    public function institutions()
    {
        return $this->belongsToMany(Institution::class, 'institution_user');
    }

    public function student()
    {
        return $this->hasOne(Student::class, 'user_id');
    }

    public function teacher()
    {
        return $this->hasOne(Teacher::class); 
    }


    public function getAllPermissionsWithFallback()
    {
        return $this->getAllPermissions()->pluck('name');
    }


    public function hasPermissionTo($permission, $guardName = null)
    {
        if ($this->hasRole('Super Admin')) {
            return true;
        }

        return $this->getAllPermissions()->contains('name', $permission);
    }

    
}
