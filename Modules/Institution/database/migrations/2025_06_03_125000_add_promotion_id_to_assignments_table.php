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
        if (!Schema::hasColumn('assignments', 'promotion_id')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->foreignId('promotion_id')->nullable()->constrained('promotions')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropForeign(['promotion_id']);
            $table->dropColumn('promotion_id');
        });
    }
};
