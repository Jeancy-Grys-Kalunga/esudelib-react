import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { BookOpen, Briefcase, Calendar, ClipboardList, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Enseignant',
        href: '/dashboard',
    },
];

interface TeacherStats {
    courses_count: number;
    students_count: number;
    pending_grades: number;
}

export default function TeacherDashboard({ stats }: { stats: TeacherStats }) {
    const { auth } = usePage().props as unknown as { auth: { user: any } };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Enseignant" />
            <div className="dark:bg-sidebar-accent/5 flex flex-1 flex-col gap-6 bg-gray-50/50 p-6 pt-0">
                {/* Welcome Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                        Bonjour, {auth.user.name}
                    </h1>
                    <p className="text-muted-foreground">Espace de gestion académique et pédagogique.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Assigned Courses Card */}
                    <div className="group dark:bg-sidebar-accent/10 dark:border-sidebar-border relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transition-all group-hover:scale-110 group-hover:opacity-20">
                            <BookOpen className="h-24 w-24 text-blue-600" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
                                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cours Assignés</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.courses_count}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Total Students Card */}
                    <div className="group dark:bg-sidebar-accent/10 dark:border-sidebar-border relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transition-all group-hover:scale-110 group-hover:opacity-20">
                            <Users className="h-24 w-24 text-orange-600" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="rounded-xl bg-orange-50 p-3 dark:bg-orange-900/20">
                                <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Étudiants</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.students_count}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Pending Grades Card (Placeholder logic for now) */}
                    <div className="group dark:bg-sidebar-accent/10 dark:border-sidebar-border relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transition-all group-hover:scale-110 group-hover:opacity-20">
                            <ClipboardList className="h-24 w-24 text-purple-600" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="rounded-xl bg-purple-50 p-3 dark:bg-purple-900/20">
                                <ClipboardList className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes à Soumettre</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending_grades}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Access Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="dark:bg-sidebar-accent/10 dark:border-sidebar-border group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-colors hover:border-blue-200">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="rounded-lg bg-indigo-50 p-2 transition-colors group-hover:bg-indigo-100">
                                <Briefcase className="h-5 w-5 text-indigo-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Emploi du temps</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Consultez vos horaires de cours et de TP pour la semaine en cours.</p>
                    </div>

                    <div className="dark:bg-sidebar-accent/10 dark:border-sidebar-border group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-colors hover:border-blue-200">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="rounded-lg bg-teal-50 p-2 transition-colors group-hover:bg-teal-100">
                                <Calendar className="h-5 w-5 text-teal-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Sessions d'examen</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Vérifiez les dates d'examens et les échéances de soumission des notes.</p>
                    </div>

                    <div className="dark:bg-sidebar-accent/10 dark:border-sidebar-border rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-md">
                        <h3 className="mb-2 text-lg font-semibold">Besoin d'aide ?</h3>
                        <p className="mb-4 text-sm text-gray-300">
                            Contactez le secrétariat académique pour toute question concernant vos attributions.
                        </p>
                        <button className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/20">
                            Contacter le support
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
