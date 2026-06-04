<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Jury;
use Modules\Institution\Entities\CourseProgramDetail;
use Modules\Institution\Entities\ExamSession;
use Modules\Student\Entities\Student;
use Modules\Student\Entities\Note;
use Modules\RegistrationDesk\Entities\Inscription;
use Modules\Teacher\Entities\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class SimulateDeliberation extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:simulate-deliberation';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Simulate data for 10 students from BAC 1 to BAC 3 for deliberation test';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Démarrage de la simulation des données de délibération...");

        // 1. Années Académiques
        $years = [
            '2023-2024' => AcademicYear::firstOrCreate(['title' => '2023-2024'], ['status' => 'Clôturée']),
            '2024-2025' => AcademicYear::firstOrCreate(['title' => '2024-2025'], ['status' => 'Clôturée']),
            '2025-2026' => AcademicYear::firstOrCreate(['title' => '2025-2026'], ['status' => 'En cours']),
        ];
        $this->info("Années académiques configurées.");

        // 2. Trouver la promotion BAC 1 CSI (et modifier son nom)
        $promoBac1 = Promotion::where('title', 'BAC 1 CSI')->first();
        if (!$promoBac1) {
            $this->warn("La promotion 'BAC 1 CSI' stricte non trouvée. Recherche partielle...");
            $promoBac1 = Promotion::where('title', 'LIKE', '%BAC 1 CSI%')->first();
        }

        if (!$promoBac1) {
            $this->warn("Promotion introuvable. Création d'une promotion de test pour permettre la démo locale.");
            $institution = Institution::firstOrCreate(['name' => 'ISS Lubumbashi']);
            $promoBac1 = Promotion::create(['title' => 'BAC 1 CSI', 'institution_id' => $institution->id]);
        }
        
        $institution = $promoBac1->institution;
        $promoBac1->update(['title' => 'BAC1 INFORMATIQUE DE GESTION']);
        $this->info("Promotion mise à jour en : BAC1 INFORMATIQUE DE GESTION.");

        // Création BAC 2 et BAC 3
        $promoBac2 = Promotion::firstOrCreate([
            'title' => 'BAC2 INFORMATIQUE DE GESTION',
            'institution_id' => $institution->id,
            'faculty_id' => $promoBac1->faculty_id
        ]);
        
        $promoBac3 = Promotion::firstOrCreate([
            'title' => 'BAC3 INFORMATIQUE DE GESTION',
            'institution_id' => $institution->id,
            'faculty_id' => $promoBac1->faculty_id
        ]);
        $this->info("Promotions BAC 2 et BAC 3 configurées.");

        // 3. Récupérer 10 étudiants inscrits en BAC1
        $inscriptions = Inscription::where('promotion_id', $promoBac1->id)
                                   ->with('student.user')
                                   ->take(10)
                                   ->get();
                                   
        $students = collect();
        foreach ($inscriptions as $insc) {
            if ($insc->student) {
                $students->push($insc->student);
            }
        }
        
        // Compléter si < 10 (utile pour le test local si la BDD est vide)
        if ($students->count() < 10) {
            $this->warn("Seulement {$students->count()} étudiants trouvés. Création des manquants...");
            $roleStudent = Role::firstOrCreate(['name' => 'Etudiant']);
            
            for ($i = $students->count(); $i < 10; $i++) {
                $email = 'etudiant' . ($i + 1) . '_' . time() . '@iss-lubumbashi.cd';
                $user = User::create([
                    'name' => 'Test Etudiant ' . ($i + 1),
                    'email' => $email,
                    'password' => Hash::make('12345678'),
                ]);
                $user->assignRole($roleStudent);
                
                $student = Student::create([
                    'user_id' => $user->id,
                    'matricule' => 'MAT' . rand(1000, 9999) . '-' . $i,
                    'name' => 'Test Etudiant ' . ($i + 1),
                    'institution_id' => $institution->id,
                ]);
                $students->push($student);
            }
        }
        
        // Mettre à jour les mots de passe pour être sûr
        foreach ($students as $student) {
            if ($student->user) {
                $student->user->update(['password' => Hash::make('12345678')]);
            }
        }
        $this->info("10 étudiants récupérés (Mot de passe réinitialisé à 12345678).");

        // 4. Inscription et Cours + Notes (BAC1, BAC2, BAC3)
        $coursesBac1 = CourseProgramDetail::where('promotion_id', $promoBac1->id)->pluck('course_id');
        $coursesBac2 = CourseProgramDetail::where('promotion_id', $promoBac2->id)->pluck('course_id');
        $coursesBac3 = CourseProgramDetail::where('promotion_id', $promoBac3->id)->pluck('course_id');
        
        $allPromoCourses = [
            'BAC1' => ['promo_id' => $promoBac1->id, 'year' => $years['2023-2024'], 'courses' => $coursesBac1],
            'BAC2' => ['promo_id' => $promoBac2->id, 'year' => $years['2024-2025'], 'courses' => $coursesBac2],
            'BAC3' => ['promo_id' => $promoBac3->id, 'year' => $years['2025-2026'], 'courses' => $coursesBac3],
        ];

        $session = ExamSession::firstOrCreate(
            ['title' => 'Première session', 'institution_id' => $institution->id],
            ['status' => 'Active']
        );

        $this->info("Inscription des étudiants, assignation des cours et génération des notes...");
        $count = 0;
        foreach ($students as $index => $student) {
            $isIndividual = ($index < 5); // 5 premiers: cours choisis individuellement
            
            foreach ($allPromoCourses as $level => $data) {
                // Créer l'inscription à la promotion
                Inscription::firstOrCreate([
                    'student_id' => $student->id,
                    'promotion_id' => $data['promo_id'],
                    'academic_year_id' => $data['year']->id,
                ], [
                    'institution_id' => $institution->id,
                    'status' => 'Validé'
                ]);

                if ($data['courses']->isEmpty()) {
                    continue; // Pas de cours pour cette promotion
                }
                
                $coursesToTake = $data['courses'];
                if ($isIndividual) {
                    // Sélectionner 3 cours au hasard pour ces étudiants
                    $coursesToTake = $data['courses']->random(min(3, $data['courses']->count()));
                }
                
                // Assigner les cours individuellement à l'étudiant
                $student->courses()->syncWithoutDetaching($coursesToTake->toArray());
                
                // Coter l'étudiant pour ces cours (de 5 à 18)
                foreach ($coursesToTake as $courseId) {
                    Note::updateOrCreate([
                        'student_id' => $student->id,
                        'course_id' => $courseId,
                        'academic_year_id' => $data['year']->id,
                        'exam_session_id' => $session->id,
                    ], [
                        'cote' => rand(5, 18),
                        'institution_id' => $institution->id
                    ]);
                }
            }
            $count++;
        }
        $this->info("Parcours généré pour $count étudiants de BAC1 à BAC3.");

        // 5. Création du Jury pour BAC3 (Nkulu Masangu Patrick)
        $roleTeacher = Role::firstOrCreate(['name' => 'Enseignant']);
        $teacherUser = User::firstOrCreate(
            ['email' => 'nkulu.masangu@iss-lubumbashi.cd'],
            ['name' => 'Nkulu Masangu Patrick', 'password' => Hash::make('password')]
        );
        $teacherUser->assignRole($roleTeacher);
        
        $teacher = Teacher::firstOrCreate(
            ['user_id' => $teacherUser->id],
            ['name' => 'Nkulu Masangu Patrick', 'institution_id' => $institution->id]
        );
        
        $jury = Jury::updateOrCreate([
            'promotion_id' => $promoBac3->id,
            'academic_year_id' => $years['2025-2026']->id,
            'exam_session_id' => $session->id,
        ], [
            'institution_id' => $institution->id,
            'secretary_id' => $teacher->id,
            'president_id' => $teacher->id,
            'date_session' => now(),
            'status' => 'En cours'
        ]);
        $this->info("Jury créé pour BAC3. Secrétaire : Nkulu Masangu Patrick.");

        // 6. Affichage final
        $this->info("\n=============================================");
        $this->info("       RÉSUMÉ ET IDENTIFIANTS DE TEST       ");
        $this->info("=============================================");
        $this->info("\nENSEIGNANT (SECRÉTAIRE DU JURY BAC3) :");
        $this->info("  Email : nkulu.masangu@iss-lubumbashi.cd");
        $this->info("  Mot de passe : password");
        $this->info("\nÉTUDIANTS (Mot de passe : 12345678) :");
        foreach ($students as $student) {
            $email = $student->user ? $student->user->email : 'N/A';
            $this->info("  - $email (" . $student->name . ")");
        }
        $this->info("=============================================\n");
        $this->info("Succès ! La commande peut être exécutée sur le serveur de production pour remplir la base.");
    }
}
