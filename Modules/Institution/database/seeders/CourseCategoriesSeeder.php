<?php

namespace Modules\Institution\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Institution\Entities\CourseCategory;

class CourseCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        CourseCategory::insert([
            ['name' => 'Obligatoire', 'slug' => 'obligatoire'],
            ['name' => 'Spécialité', 'slug' => 'specialite'],
            ['name' => 'Autres', 'slug' => 'autres'],
        ]);
    }
}
