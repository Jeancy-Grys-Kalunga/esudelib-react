<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Institution\Entities\Semestre;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('course_program_details', function (Blueprint $table) {
            Schema::table('course_program_details', function (Blueprint $table) {
                // Vérifier si la colonne existe déjà pour éviter les erreurs
                if (!Schema::hasColumn('course_program_details', 'semester_id')) {
                    $table->foreignIdFor(Semestre::class)
                        ->nullable()
                        ->constrained()
                        ->onDelete('set null')
                        ->comment('Référence au semestre');
                }
            });
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_program_details', function (Blueprint $table) {
            // Supprimer la contrainte de clé étrangère d'abord
            $table->dropForeign(['semester_id']);

            // Puis supprimer la colonne
            $table->dropColumn('semester_id');
        });
    }
};
