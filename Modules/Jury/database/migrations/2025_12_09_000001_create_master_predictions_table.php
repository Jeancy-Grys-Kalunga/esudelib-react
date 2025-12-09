<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Student\Entities\Student;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('master_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Student::class)->constrained()->cascadeOnDelete();
            $table->integer('age');
            $table->string('provenance'); // Ville/Province d'origine
            $table->string('intention_expressed')->nullable(); // Filière souhaitée par l'étudiant
            $table->json('optional_courses')->nullable(); // Cours non obligatoires suivis
            $table->json('internships')->nullable(); // Stages effectués
            $table->string('predicted_master')->nullable(); // Filière prédite
            $table->float('confidence_score')->nullable(); // Score de confiance
            $table->json('prediction_details')->nullable(); // Détails de la prédiction
            $table->timestamp('predicted_at')->nullable();
            $table->timestamps();
        });

        // Table pour stocker le dataset d'entraînement
        Schema::create('master_training_dataset', function (Blueprint $table) {
            $table->id();
            $table->integer('age');
            $table->string('provenance');
            $table->string('intention_expressed')->nullable();
            $table->json('optional_courses')->nullable();
            $table->json('internships')->nullable();
            $table->float('average_grade'); // Moyenne générale
            $table->json('grades_by_subject')->nullable(); // Notes par matière
            $table->string('actual_master'); // Filière réellement suivie (pour l'entraînement)
            $table->boolean('is_synthetic')->default(false); // Données synthétiques ou réelles
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_predictions');
        Schema::dropIfExists('master_training_dataset');
    }
};
