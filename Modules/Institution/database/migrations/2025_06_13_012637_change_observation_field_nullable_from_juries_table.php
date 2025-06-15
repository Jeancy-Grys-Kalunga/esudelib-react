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
        Schema::table('juries', function (Blueprint $table) {
            // Rendre le champ 'observation' nullable
            $table->string('observation')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('juries', function (Blueprint $table) {
            // Rétablir le champ 'observation' comme non nullable
            $table->string('observation')->nullable(false)->change();
        });
    }
};
