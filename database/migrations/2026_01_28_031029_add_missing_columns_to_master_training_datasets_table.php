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
        Schema::table('master_training_datasets', function (Blueprint $table) {
            if (!Schema::hasColumn('master_training_datasets', 'genre')) $table->string('genre')->nullable();
            if (!Schema::hasColumn('master_training_datasets', 'intention')) $table->string('intention')->nullable();
            if (!Schema::hasColumn('master_training_datasets', 'optional_courses')) $table->json('optional_courses')->nullable();
            if (!Schema::hasColumn('master_training_datasets', 'provenance_region')) $table->string('provenance_region')->nullable();
            if (!Schema::hasColumn('master_training_datasets', 'etablissement')) $table->string('etablissement')->nullable();
            if (!Schema::hasColumn('master_training_datasets', 'age')) $table->integer('age')->nullable();
            if (!Schema::hasColumn('master_training_datasets', 'moyenne_licence')) $table->float('moyenne_licence')->nullable();
            if (!Schema::hasColumn('master_training_datasets', 'actual_master')) $table->string('actual_master')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('master_training_datasets', function (Blueprint $table) {
            $table->dropColumn([
                'genre',
                'intention',
                'optional_courses',
                'provenance_region',
                'etablissement',
                'age',
                'moyenne_licence',
                'actual_master'
            ]);
        });
    }
};
