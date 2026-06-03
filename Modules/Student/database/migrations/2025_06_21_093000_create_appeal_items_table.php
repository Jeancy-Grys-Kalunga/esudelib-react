<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('appeal_items')) {
            Schema::create('appeal_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('appeal_id')->constrained()->cascadeOnDelete();
                $table->string('object');
                $table->text('justification');
                $table->timestamps();
            });
        }

        if (Schema::hasTable('appeal_documents') && !Schema::hasColumn('appeal_documents', 'appeal_item_id')) {
            Schema::table('appeal_documents', function (Blueprint $table) {
                $table->foreignId('appeal_item_id')->nullable()->constrained()->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('appeal_documents', function (Blueprint $table) {
            $table->dropForeign(['appeal_item_id']);
            $table->dropColumn('appeal_item_id');
        });
        Schema::dropIfExists('appeal_items');
    }
};
