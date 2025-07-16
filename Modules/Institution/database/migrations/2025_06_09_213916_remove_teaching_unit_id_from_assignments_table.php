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
          Schema::table('assignments', function (Blueprint $table) {
            // Supprimer la clé étrangère et la colonne
            $table->dropForeign(['teaching_unit_id']);
            $table->dropColumn('teaching_unit_id');
            
            // Ajouter la nouvelle relation avec courses
            $table->after('id', function (Blueprint $table) {
                $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            });
        });
    }

    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            // Supprimer la nouvelle relation
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
            
            // Rétablir l'ancienne colonne
            $table->foreignId('teaching_unit_id')->constrained('units_teachings')->onDelete('cascade');
        });
    }
};
