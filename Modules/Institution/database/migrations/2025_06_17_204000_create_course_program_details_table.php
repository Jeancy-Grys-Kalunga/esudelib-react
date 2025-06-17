<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\CourseCategory;
use Modules\Institution\Entities\Program;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\UnitsTeaching;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
    {
        Schema::create('course_program_details', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Course::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Program::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Promotion::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(UnitsTeaching::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(CourseCategory::class)->constrained()->cascadeOnDelete();
            
            $table->integer('cm')->default(0);
            $table->integer('td')->default(0);
            $table->integer('tp')->default(0);
            $table->integer('credits')->default(0);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_program_details');
    }
};
