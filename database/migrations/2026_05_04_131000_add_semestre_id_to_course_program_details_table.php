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
            $table->foreignIdFor(Semestre::class)->nullable()->constrained()->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_program_details', function (Blueprint $table) {
            $table->dropForeign(['semestre_id']);
            $table->dropColumn('semestre_id');
        });
    }
};
