<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('appeal_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appeal_id')->constrained()->onDelete('cascade');
            $table->string('name', 150);
            $table->string('path', 255);
            $table->enum('type', ['JUSTIFICATION', 'PROOF', 'FORMAL', 'OTHER'])->default('OTHER');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Index pour optimiser les requêtes
            $table->index('appeal_id');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('appeal_documents');
    }
};
