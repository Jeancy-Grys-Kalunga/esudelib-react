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
        Schema::table('courses', function (Blueprint $table) {
            // Supprimer les colonnes
            $table->dropColumn('credits');
            $table->dropForeign(['institution_id']);
            $table->dropColumn('institution_id');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            // Recréer les colonnes (avec des valeurs par défaut pour le rollback)
            $table->integer('credits')->default(0);
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
        });
    }
};
