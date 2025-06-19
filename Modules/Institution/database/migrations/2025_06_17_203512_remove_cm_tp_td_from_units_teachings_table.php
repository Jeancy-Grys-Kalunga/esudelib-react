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
        Schema::table('units_teachings', function (Blueprint $table) {
            $table->dropColumn(['cm', 'tp', 'td']);
        });
    }

    /**
     * Reverse the migrations.
     */
     public function down(): void
    {
        Schema::table('units_teachings', function (Blueprint $table) {
            $table->integer('cm')->default(0);
            $table->integer('tp')->default(0);
            $table->integer('td')->default(0);
        });
    }
};
