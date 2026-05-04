<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $permissions = [
            //User Mangement
            'edit_own_profile',
            'access_user_management',

            //Dashboard

            'show_total_stats',
            'show_month_overview',
            'show_monthly_cashflow',
            'show_notifications',

            //students
            'access_students',
            'create_students',
            'show_students',
            'edit_students',
            'delete_students',
            'import_students',
            'payment_fees',

            //Academic Year
            'access_academic_years',
            'create_academic_years',
            'show_academic_years',
            'edit_academic_years',
            'delete_academic_years',

            //Departments
            'access_departments',
            'create_departments',
            'show_departments',
            'edit_departments',
            'delete_departments',

            // Palmares
            'access_palmares',

            //Promotions
            'access_promotions',
            'create_promotions',
            'show_promotions',
            'edit_promotions',
            'delete_promotions',

            //Institutions
            'access_institutions',
            'create_institutions',
            'show_institutions',
            'edit_institutions',
            'delete_institutions',

            //Jury
            'access_juries',
            'access_notes',
            'create_juries',
            'show_juries',
            'edit_juries',
            'delete_juries',
            'import_notes',
            'send_results',
            'access_expert_system',
            'add_observation',

            // Appeals
            'access_appeals',
            'create_appeals',
            'show_appeals',
            'edit_appeals',
            'delete_appeals',

            //courses
            'access_courses',
            'create_courses',
            'show_courses',
            'edit_courses',
            'delete_courses',
            'import_courses',

            // Inscriptions

            'access_inscriptions',
            'create_inscriptions',
            'show_inscriptions',
            'edit_inscriptions',
            'delete_inscriptions',
            'import_inscriptions',

            //Semestre
            'access_semestre',

            //faculties
            'access_faculties',
            'create_faculties',
            'edit_faculties',
            'delete_faculties',
            'import_faculties',
            'show_faculties',


            //teachers
            'access_teachers',
            'create_teachers',
            'show_teachers',
            'edit_teachers',
            'delete_teachers',
            'import_teachers',

            //unitse_teachings
            'access_unit_teachings',
            'create_unit_teachings',
            'show_unit_teachings',
            'edit_unit_teachings',
            'delete_unit_teachings',
            'import_unit_teachings',

            // Reports

            'access_reports',

            //Currencies
            'access_currencies',
            'create_currencies',
            'edit_currencies',
            'delete_currencies',

            //Settings
            'access_settings',

            'access_secretary_features',

            'access_student_features',

            'access_jury_features',

            'access_partner_features',

            // programs

            'access_programs',
            'edit_programs',
            'delete_programs',
            'show_programs',
            'create_programs',

            // attributions

            'access_assignments',
            'create_assignments',
            'show_assignments',
            'edit_assignments',
            'delete_assignments',

            'create_roles',
            'edit_roles',
            'delete_roles',

            'create_users',
            'edit_users',
            'delete_users',
            'access_users',
            'show_users',

            'access_exam_sessions',
            'create_exam_sessions',
            'edit_exam_sessions',
            'delete_exam_sessions'

        ];

        foreach ($permissions as $permission) {
            Permission::create([
                'name' => $permission
            ]);
        }

        $role = Role::create([
            'name' => 'Admin'
        ]);

        $role->givePermissionTo($permissions);
        $role->revokePermissionTo('access_user_management');
    }
}
