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
            if (!Schema::hasColumn('master_training_datasets', 'is_synthetic')) {
                $table->boolean('is_synthetic')->default(false);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('master_training_datasets', function (Blueprint $table) {
            if (Schema::hasColumn('master_training_datasets', 'is_synthetic')) {
                $table->dropColumn('is_synthetic');
            }
        });
    }
};
