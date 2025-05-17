<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Modules\Institution\Entities\Institution;
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

    protected $with = ['institutions', 'media', 'roles', 'permissions'];

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

    public function teacher()
    {
        return $this->belongsToMany(Teacher::class);
    }

    public function getAllPermissionsWithFallback()
    {
        if ($this->hasRole('Super Admin')) {
            return Permission::all()->pluck('name');
        }

        return $this->getAllPermissions()->pluck('name');
    }

 
    public function getAllPermissions()
    {
        if (!$this->relationLoaded('permissions') || !$this->relationLoaded('roles')) {
            $this->load('permissions', 'roles.permissions');
        }

        return parent::getAllPermissions();
    }

    public function hasPermissionTo($permission, $guardName = null)
    {
        if ($this->hasRole('Super Admin')) {
            return true;
        }

        return parent::hasPermissionTo($permission, $guardName);
    }
}
