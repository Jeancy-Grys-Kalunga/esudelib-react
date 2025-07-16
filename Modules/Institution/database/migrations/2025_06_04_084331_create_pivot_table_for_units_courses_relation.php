<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\UnitsTeaching;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('course_units_teaching')) {
            Schema::create('course_units_teaching', function (Blueprint $table) {
                $table->foreignIdFor(UnitsTeaching::class)->constrained()->cascadeOnDelete();
                $table->foreignIdFor(Course::class)->constrained()->cascadeOnDelete();
                $table->primary(['units_teaching_id', 'course_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_units_teaching');
    }
};
