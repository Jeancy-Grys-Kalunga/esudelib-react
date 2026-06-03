<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Institution\Entities\Institution;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
    {
        if (!Schema::hasColumn('assignments', 'institution_id')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->foreignId('institution_id')
                    ->after('id')
                    ->constrained((new Institution)->getTable())
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            Schema::table('assignments', function (Blueprint $table) {
            $table->dropForeign(['institution_id']);
            $table->dropColumn('institution_id');
        });
        });
    }
};
