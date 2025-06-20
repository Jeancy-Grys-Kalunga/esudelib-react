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
            $table->float('cm')->change();
            $table->float('td')->change();
            $table->float('tp')->change();
            $table->float('credits')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_program_details', function (Blueprint $table) {
            $table->decimal('cm', 10, 2)->change();
            $table->decimal('td', 10, 2)->change();
            $table->decimal('tp', 10, 2)->change();
            $table->decimal('credits', 10, 2)->change();
        });
    }
};
