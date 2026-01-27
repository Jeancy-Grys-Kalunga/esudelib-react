import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { AlertCircle, BookOpen, Building2, CheckCircle2, ClipboardList, GraduationCap, Layers, TrendingUp, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Administrateur',
        href: '/dashboard',
    },
];

interface AdminStats {
    users_count: number;
    institutions_count: number;
    departments_count: number;
    courses_count: number;
    programs_count: number;
    students_count: number;
}

export default function AdminDashboard({ stats }: { stats: AdminStats }) {
    const { auth } = usePage().props as unknown as { auth: { user: any } };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Admin" />
            <div className="dark:bg-sidebar-accent/5 flex flex-1 flex-col gap-6 bg-gray-50/50 p-6 pt-0">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-white dark:to-gray-400">
                        Administration Système
                    </h1>
                    <p className="text-muted-foreground">Vue d'ensemble et état de santé de la plateforme.</p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Users Card */}
                    <div className="group dark:bg-sidebar-accent/10 dark:border-sidebar-border relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 transform p-4 opacity-[0.03]">
                            <Users className="h-32 w-32 text-blue-900" />
                        </div>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-600">
                                <TrendingUp className="mr-1 h-3 w-3" /> +12%
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Utilisateurs</p>
                            <h3 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{stats.users_count}</h3>
                        </div>
                    </div>

                    {/* Students Card */}
                    <div className="group dark:bg-sidebar-accent/10 dark:border-sidebar-border relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 transform p-4 opacity-[0.03]">
                            <GraduationCap className="h-32 w-32 text-teal-900" />
                        </div>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="rounded-xl bg-teal-50 p-3 dark:bg-teal-900/20">
                                <GraduationCap className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Étudiants</p>
                            <h3 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{stats.students_count}</h3>
                        </div>
                    </div>

                    {/* Institutions Card */}
                    <div className="group dark:bg-sidebar-accent/10 dark:border-sidebar-border relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 transform p-4 opacity-[0.03]">
                            <Building2 className="h-32 w-32 text-purple-900" />
                        </div>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="rounded-xl bg-purple-50 p-3 dark:bg-purple-900/20">
                                <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500">Stable</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Institutions Actives</p>
                            <h3 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{stats.institutions_count}</h3>
                        </div>
                    </div>

                    {/* Departments Card */}
                    <div className="group dark:bg-sidebar-accent/10 dark:border-sidebar-border relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 transform p-4 opacity-[0.03]">
                            <Layers className="h-32 w-32 text-orange-900" />
                        </div>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="rounded-xl bg-orange-50 p-3 dark:bg-orange-900/20">
                                <Layers className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Départements</p>
                            <h3 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{stats.departments_count}</h3>
                        </div>
                    </div>

                    {/* Courses Card */}
                    <div className="group dark:bg-sidebar-accent/10 dark:border-sidebar-border relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 transform p-4 opacity-[0.03]">
                            <BookOpen className="h-32 w-32 text-pink-900" />
                        </div>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="rounded-xl bg-pink-50 p-3 dark:bg-pink-900/20">
                                <BookOpen className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cours</p>
                            <h3 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{stats.courses_count}</h3>
                        </div>
                    </div>

                    {/* Programs Card */}
                    <div className="group dark:bg-sidebar-accent/10 dark:border-sidebar-border relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 transform p-4 opacity-[0.03]">
                            <ClipboardList className="h-32 w-32 text-cyan-900" />
                        </div>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="rounded-xl bg-cyan-50 p-3 dark:bg-cyan-900/20">
                                <ClipboardList className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Programmes</p>
                            <h3 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{stats.programs_count}</h3>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="dark:bg-sidebar-accent/10 dark:border-sidebar-border rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold">État du Système</h3>
                        <div className="space-y-4">
                            <div className="dark:bg-sidebar-accent/20 flex items-center justify-between rounded-xl bg-gray-50 p-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <span className="font-medium">Base de données</span>
                                </div>
                                <span className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-600">Opérationnel</span>
                            </div>
                            <div className="dark:bg-sidebar-accent/20 flex items-center justify-between rounded-xl bg-gray-50 p-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <span className="font-medium">Service de fichiers</span>
                                </div>
                                <span className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-600">Opérationnel</span>
                            </div>
                            <div className="dark:bg-sidebar-accent/20 flex items-center justify-between rounded-xl bg-gray-50 p-3">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                                    <span className="font-medium">Mises à jour</span>
                                </div>
                                <span className="rounded-md bg-yellow-100 px-2 py-1 text-xs text-yellow-600">1 Disponible</span>
                            </div>
                        </div>
                    </div>

                    <div className="dark:bg-sidebar-accent/10 dark:border-sidebar-border rounded-2xl border border-gray-200 bg-white bg-gradient-to-br from-gray-900 to-slate-800 p-6 text-white shadow-sm">
                        <h3 className="mb-2 text-lg font-semibold">Actions Administrateur</h3>
                        <p className="mb-6 text-sm text-gray-400">Accès rapide aux tâches de maintenance courantes.</p>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="rounded-lg bg-white/10 p-3 text-left text-sm font-medium transition-colors hover:bg-white/20">
                                Vider le cache
                            </button>
                            <button className="rounded-lg bg-white/10 p-3 text-left text-sm font-medium transition-colors hover:bg-white/20">
                                Logs Système
                            </button>
                            <button className="rounded-lg bg-white/10 p-3 text-left text-sm font-medium transition-colors hover:bg-white/20">
                                Backups
                            </button>
                            <button className="rounded-lg bg-white/10 p-3 text-left text-sm font-medium transition-colors hover:bg-white/20">
                                Paramètres
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
