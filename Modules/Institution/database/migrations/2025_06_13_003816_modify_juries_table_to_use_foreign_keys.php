<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('juries', function (Blueprint $table) {
            // Supprimer les anciennes colonnes
            $table->dropColumn(['president', 'secretary', 'member']);
            
            // Ajouter les nouvelles colonnes de clés étrangères
            $table->foreignId('president_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('secretary_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('teachers')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('juries', function (Blueprint $table) {
            // Supprimer les clés étrangères
            $table->dropForeign(['president_id']);
            $table->dropForeign(['secretary_id']);
            $table->dropForeign(['member_id']);
            
            $table->dropColumn(['president_id', 'secretary_id', 'member_id']);
            
            // Recréer les anciennes colonnes
            $table->string('president');
            $table->string('secretary');
            $table->string('member');
        });
    }
};
