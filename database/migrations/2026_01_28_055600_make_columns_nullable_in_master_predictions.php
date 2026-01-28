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
        Schema::table('master_predictions', function (Blueprint $table) {
            if (Schema::hasColumn('master_predictions', 'age')) $table->integer('age')->nullable()->change();
            if (Schema::hasColumn('master_predictions', 'provenance')) $table->string('provenance')->nullable()->change();
            if (Schema::hasColumn('master_predictions', 'intention_expressed')) $table->string('intention_expressed')->nullable()->change();
            if (Schema::hasColumn('master_predictions', 'optional_courses')) $table->json('optional_courses')->nullable()->change();
            if (Schema::hasColumn('master_predictions', 'internships')) $table->json('internships')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverting not supported easily without knowing previous state, assuming nullable is fine.
    }
};
