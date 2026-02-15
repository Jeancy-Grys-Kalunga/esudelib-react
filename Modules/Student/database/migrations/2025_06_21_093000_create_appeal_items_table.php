<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appeal_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appeal_id')->constrained()->cascadeOnDelete();
            $table->string('object');
            $table->text('justification');
            $table->timestamps();
        });

        Schema::table('appeal_documents', function (Blueprint $table) {
            $table->foreignId('appeal_item_id')->nullable()->constrained()->cascadeOnDelete();
            // We make appeal_id nullable or remove constraint if we want to strictly link to items
            // For backward compatibility or transition, we might keep appeal_id but for new approach appeal_item_id is key
        });
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
