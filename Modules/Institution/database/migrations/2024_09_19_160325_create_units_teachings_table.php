<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Promotion;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('units_teachings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->integer('cm');
            $table->integer('tp');
            $table->integer('td');
            $table->foreignIdFor(Promotion::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(Course::class)->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units_teachings');
    }
};
