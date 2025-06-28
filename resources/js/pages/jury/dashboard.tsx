import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { BarChart2, BookCheck, CheckCircle, ClipboardList, Clock, PlusCircle } from 'lucide-react';

interface JuryDashboardProps {
    academicYear: { title: string };
    promotion: { title: string };
    courses: Array<{
        id: number;
        title: string;
        submitted_notes: number;
        pending_notes: number;
        total_students: number;
    }>;
    successRates: Array<{
        course_id: number;
        course: { title: string };
        success_rate: number;
        failure_rate: number;
    }>;
}

export default function JuryDashboard({ academicYear, promotion, courses, successRates }: JuryDashboardProps) {
    return (
        <AppLayout>
            <div className="container mx-auto px-4 py-8">
                <Head title="Espace Jury" />

                {/* En-tête modernisé */}
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
                            <ClipboardList className="h-8 w-8 text-indigo-600" />
                            Espace Jury
                        </h1>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                                {academicYear.title}
                            </Badge>
                            <span className="text-muted-foreground">/</span>
                            <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                {promotion.title}
                            </Badge>
                        </div>
                    </div>
                    <Button asChild className="shadow-md">
                        <Link href={route('jury.results')} className="flex items-center gap-2">
                            <BarChart2 className="h-4 w-4" />
                            Voir la grille complète
                        </Link>
                    </Button>
                </div>

                {/* Grille responsive */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Situation des dépôts de cotes - version modernisée */}
                    <Card className="overflow-hidden rounded-xl border border-gray-100 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                            <CardTitle className="flex items-center gap-2">
                                <BookCheck className="h-5 w-5 text-indigo-600" />
                                Situation des dépôts de cotes
                            </CardTitle>
                            <CardDescription>État d'avancement des dépôts par les enseignants</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="py-3 pl-6">Cours</TableHead>
                                        <TableHead className="py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Soumis
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Clock className="h-4 w-4 text-amber-500" />
                                                En attente
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-3 pr-6 text-center">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {courses.map((course) => {
                                        const progress = (course.submitted_notes / course.total_students) * 100;
                                        return (
                                            <TableRow key={course.id} className="hover:bg-gray-50">
                                                <TableCell className="py-4 pl-6 font-medium">{course.title}</TableCell>
                                                <TableCell className="py-4 text-center font-medium text-green-600">
                                                    {course.submitted_notes}
                                                </TableCell>
                                                <TableCell className="py-4 text-center font-medium text-amber-600">{course.pending_notes}</TableCell>
                                                <TableCell className="py-4 pr-6 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-semibold">{course.total_students}</span>
                                                        {/* Barre de progression personnalisée */}
                                                        <div className="mt-2 h-2 w-full max-w-[120px] rounded-full bg-gray-200">
                                                            <div 
                                                                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                                                                style={{ width: `${progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Situation de réussite - version modernisée */}
                    <Card className="overflow-hidden rounded-xl border border-gray-100 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                            <CardTitle className="flex items-center gap-2">
                                <BarChart2 className="h-5 w-5 text-indigo-600" />
                                Taux de réussite par cours
                            </CardTitle>
                            <CardDescription>Performance des étudiants par matière</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="py-3 pl-6">Cours</TableHead>
                                        <TableHead className="py-3 text-center">Réussite</TableHead>
                                        <TableHead className="py-3 text-center">Échec</TableHead>
                                        <TableHead className="py-3 pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {successRates.map((rate) => (
                                        <TableRow key={rate.course_id} className="hover:bg-gray-50">
                                            <TableCell className="py-4 pl-6 font-medium">{rate.course.title}</TableCell>
                                            <TableCell className="py-4 text-center">
                                                <Badge className="bg-green-500 px-3 py-1 font-bold text-white hover:bg-green-600">
                                                    {rate.success_rate}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 text-center">
                                                <Badge variant="destructive" className="px-3 py-1 font-bold">
                                                    {rate.failure_rate}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 pr-6">
                                                <Button variant="outline" size="sm" className="flex items-center gap-1 shadow-sm">
                                                    <PlusCircle className="h-4 w-4" />
                                                    Ajouter points
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="flex justify-end bg-gray-50 py-3">
                            <Button asChild variant="link" className="text-indigo-600 hover:text-indigo-800">
                                <Link href={route('jury.results')}>Voir les détails complets</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}