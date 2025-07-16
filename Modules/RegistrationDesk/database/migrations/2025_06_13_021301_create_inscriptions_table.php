<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Promotion;
use Modules\Student\Entities\Student;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Student::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(AcademicYear::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Institution::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Promotion::class)->constrained()->cascadeOnDelete(); 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inscriptions');
    }
};
