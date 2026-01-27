import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Activity, BookOpen, FileText, GraduationCap } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Etudiant',
        href: '/dashboard',
    },
];

interface Note {
    course: string;
    cote: number;
    date: string;
}

interface StudentStats {
    courses_count: number;
    average_note: number;
    credits_validated: number;
    recent_notes: Note[];
}

export default function StudentDashboard({ stats }: { stats: StudentStats }) {
    const { auth } = usePage().props as unknown as { auth: { user: any } };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Etudiant" />
            <div className="dark:bg-sidebar-accent/5 flex flex-1 flex-col gap-6 bg-gray-50/50 p-6 pt-0">
                {/* Welcome Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                        Bienvenue, {auth.user.name} 👋
                    </h1>
                    <p className="text-muted-foreground">Voici un aperçu de votre progression académique cette année.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Courses Card */}
                    <div className="group dark:bg-sidebar-accent/10 dark:border-sidebar-border relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transition-all group-hover:scale-110 group-hover:opacity-20">
                            <BookOpen className="h-24 w-24 text-blue-600" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
                                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mes Cours</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.courses_count}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Average Grade Card */}
                    <div className="group dark:bg-sidebar-accent/10 dark:border-sidebar-border relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transition-all group-hover:scale-110 group-hover:opacity-20">
                            <FileText className="h-24 w-24 text-green-600" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="rounded-xl bg-green-50 p-3 dark:bg-green-900/20">
                                <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Moyenne Générale</p>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.average_note}</h3>
                                    <span className="text-sm text-gray-500">/20</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Credits Card */}
                    <div className="group dark:bg-sidebar-accent/10 dark:border-sidebar-border relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute top-0 right-0 p-4 opacity-10 transition-all group-hover:scale-110 group-hover:opacity-20">
                            <GraduationCap className="h-24 w-24 text-purple-600" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="rounded-xl bg-purple-50 p-3 dark:bg-purple-900/20">
                                <GraduationCap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Crédits Validés</p>
                                <div className="flex items-baseline gap-1">
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.credits_validated}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Recent Activity / Notes */}
                    <div className="dark:bg-sidebar-accent/10 dark:border-sidebar-border col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-lg font-semibold">
                                <Activity className="h-5 w-5 text-indigo-500" />
                                Résultats Récents
                            </h2>
                        </div>

                        {stats.recent_notes.length > 0 ? (
                            <div className="dark:border-sidebar-border overflow-hidden rounded-xl border border-gray-100">
                                <table className="w-full text-sm">
                                    <thead className="dark:bg-sidebar-accent/30 bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Cours</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">Note</th>
                                            <th className="px-4 py-3 text-right font-medium text-gray-500">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="dark:divide-sidebar-border/50 divide-y divide-gray-100">
                                        {stats.recent_notes.map((note, index) => (
                                            <tr key={index} className="dark:hover:bg-sidebar-accent/20 transition-colors hover:bg-gray-50/50">
                                                <td className="px-4 py-3 font-medium">{note.course}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                            note.cote >= 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {note.cote}/20
                                                    </span>
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3 text-right">{note.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
                                <FileText className="mb-2 h-10 w-10 opacity-20" />
                                <p>Aucun résultat récent disponible</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions or Notifications */}
                    <div className="dark:bg-sidebar-accent/10 dark:border-sidebar-border dark:from-sidebar-accent/20 dark:to-sidebar-accent/5 rounded-2xl border border-gray-200 bg-white bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-indigo-900 dark:text-indigo-300">Information Rapide</h2>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-sm">
                                <div className="h-full min-h-[1.5rem] w-1 rounded-full bg-indigo-500"></div>
                                <p className="text-muted-foreground">
                                    N'oubliez pas de consulter régulièrement vos valves pour les horaires d'examens.
                                </p>
                            </li>
                            <li className="flex gap-3 text-sm">
                                <div className="h-full min-h-[1.5rem] w-1 rounded-full bg-blue-500"></div>
                                <p className="text-muted-foreground">Les inscriptions aux cours de rattrapage sont ouvertes jusqu'au 30 Juin.</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
