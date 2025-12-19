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
        Schema::create('master_training_datasets', function (Blueprint $table) {
            $table->id();
            $table->integer('age');
            $table->string('provenance')->nullable();
            $table->string('intention_expressed')->nullable();
            $table->json('optional_courses')->nullable();
            $table->json('internships')->nullable();
            $table->float('average_grade');
            $table->json('grades_by_subject')->nullable();
            $table->string('actual_master');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_training_datasets');
    }
};
