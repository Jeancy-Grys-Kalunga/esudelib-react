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
        Schema::table('notes', function (Blueprint $table) {
            // Supprimer l'ancienne colonne session
            if (Schema::hasColumn('notes', 'session')) {
                $table->dropColumn('session');
            }

            // Ajouter la nouvelle colonne exam_session_id
            $table->foreignId('exam_session_id')
                ->nullable()
                ->after('promotion_id')
                ->constrained('exam_sessions')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            // Supprimer la clé étrangère
            $table->dropForeign(['exam_session_id']);
            $table->dropColumn('exam_session_id');

            // Recréer l'ancienne colonne session
            $table->string('session')->nullable()->after('promotion_id');
        });
    }
};
