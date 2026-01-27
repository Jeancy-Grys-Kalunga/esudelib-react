<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('course_program_details', function (Blueprint $table) {
            $table->unsignedBigInteger('units_teaching_id')->nullable()->change();
            $table->unsignedBigInteger('course_category_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_program_details', function (Blueprint $table) {
            $table->unsignedBigInteger('units_teaching_id')->nullable(false)->change();
            $table->unsignedBigInteger('course_category_id')->nullable(false)->change();
        });
    }
};
