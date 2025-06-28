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
         Schema::table('appeals', function (Blueprint $table) {
            // Ajout de la colonne avec une valeur par défaut (tableau vide en JSON)
            $table->json('objects')->default('[]')->nullable(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appeals', function (Blueprint $table) {
            $table->dropColumn('objects');
        });
    }
};
