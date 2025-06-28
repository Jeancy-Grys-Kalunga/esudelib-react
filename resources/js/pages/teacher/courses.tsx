import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { Download, FileWarning, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

type Course = {
    id: number;
    title: string;
    program: string;
    student_count: number;
    appeals_count: number;
};

type PageProps = {
    courses: Course[];
    flash?: {
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    };
};

export default function TeacherCourses({ courses, flash }: PageProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isExporting, setIsExporting] = useState<{ [key: number]: boolean }>({});

    const paginatedCourses = courses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(courses.length / itemsPerPage);

    const handleExport = async (courseId: number, courseTitle: string) => {
        setIsExporting((prev) => ({ ...prev, [courseId]: true }));
        try {
            const response = await axios.get(route('teacher.courses.export', { course: courseId }), {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileName = `etudiants_${courseTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                if (link.parentNode) {
                    link.parentNode.removeChild(link);
                }
            }, 100);
            toast.success('La liste des étudiants a été exportée avec succès');
        } catch (error) {
            console.error('Erreur export:', error);
            toast.error("Échec de l'exportation des étudiants");
        } finally {
            setIsExporting((prev) => ({ ...prev, [courseId]: false }));
        }
    };

    useEffect(() => {
        if (flash && flash.message) {
            switch (flash.type) {
                case 'success':
                    toast.success(flash.message);
                    break;
                case 'error':
                    toast.error(flash.message);
                    break;
                default:
                    toast(flash.message);
            }
        }
    }, [flash]);

    return (
        <AppLayout>
            <Head title="Mes Cours" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-10">
                <div className="container mx-auto max-w-5xl">
                    <Card className="rounded-3xl border-0 bg-white/90 shadow-2xl backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-purple-700">
                                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                                        <path d="M12 3L2 9l10 6 10-6-10-6zm0 13.5l-10-6V21h20V10.5l-10 6z" fill="#a21caf" />
                                    </svg>
                                    Mes Cours
                                </span>
                                <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-gray-500 shadow">
                                    {courses.length} cours attribués
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {courses.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow">
                                        <Table>
                                            <TableHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
                                                <TableRow>
                                                    <TableHead className="text-base font-bold text-purple-700">Cours</TableHead>
                                                    <TableHead className="text-base font-bold text-purple-700">Programme</TableHead>
                                                    <TableHead className="text-base font-bold text-purple-700">Étudiants</TableHead>
                                                    <TableHead className="text-base font-bold text-purple-700">Recours</TableHead>
                                                    <TableHead className="text-right text-base font-bold text-purple-700">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedCourses.map((course) => (
                                                    <TableRow key={course.id} className="transition hover:bg-purple-50/60">
                                                        <TableCell className="font-semibold text-gray-900">{course.title}</TableCell>
                                                        <TableCell className="text-gray-700">{course.program}</TableCell>
                                                        <TableCell>
                                                            <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-sm font-bold text-blue-700 shadow">
                                                                {course.student_count}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {course.appeals_count > 0 ? (
                                                                <span className="inline-block animate-pulse rounded-full bg-red-100 px-2 py-0.5 text-sm font-bold text-red-700 shadow">
                                                                    {course.appeals_count}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-sm font-semibold text-gray-400">
                                                                    0
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="space-x-2 text-right">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-blue-400 text-blue-700 shadow-sm transition-all hover:scale-105 hover:bg-blue-50"
                                                                onClick={() => handleExport(course.id, course.title)}
                                                                disabled={isExporting[course.id]}
                                                            >
                                                                {isExporting[course.id] ? (
                                                                    <span className="flex items-center">
                                                                        <svg
                                                                            className="mr-2 -ml-1 h-4 w-4 animate-spin text-blue-500"
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <circle
                                                                                className="opacity-25"
                                                                                cx="12"
                                                                                cy="12"
                                                                                r="10"
                                                                                stroke="currentColor"
                                                                                strokeWidth="4"
                                                                            ></circle>
                                                                            <path
                                                                                className="opacity-75"
                                                                                fill="currentColor"
                                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                            ></path>
                                                                        </svg>
                                                                        Export...
                                                                    </span>
                                                                ) : (
                                                                    <span className="group flex items-center">
                                                                        <Download className="mr-1 h-4 w-4 group-hover:animate-bounce" />
                                                                        Fiche cotation
                                                                    </span>
                                                                )}
                                                            </Button>
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-purple-400 text-purple-700 shadow-sm transition-all hover:scale-105 hover:bg-purple-50"
                                                            >
                                                                <Link href={route('teacher.courses.submit.form', course.id)} preserveScroll>
                                                                    <Upload className="mr-1 h-4 w-4 group-hover:animate-bounce" />
                                                                    Soumettre
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-green-400 text-green-700 shadow-sm transition-all hover:scale-105 hover:bg-green-50"
                                                            >
                                                                <Link href={route('teacher.courses.appeals', course.id)} preserveScroll>
                                                                    <FileWarning className="mr-1 h-4 w-4 group-hover:animate-bounce" />
                                                                    Recours
                                                                </Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                                                    className={`rounded-full border border-purple-200 bg-white shadow transition-all hover:bg-purple-100 ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                                                />
                                            </PaginationItem>
                                            {Array.from({ length: totalPages }, (_, i) => (
                                                <PaginationItem key={i}>
                                                    <PaginationLink
                                                        isActive={currentPage === i + 1}
                                                        onClick={() => setCurrentPage(i + 1)}
                                                        className={`rounded-full px-3 py-1 font-bold transition-all ${
                                                            currentPage === i + 1
                                                                ? 'bg-purple-600 text-white shadow'
                                                                : 'bg-white text-purple-700 hover:bg-purple-100'
                                                        }`}
                                                    >
                                                        {i + 1}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                                                    className={`rounded-full border border-purple-200 bg-white shadow transition-all hover:bg-purple-100 ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            ) : (
                                <div className="py-16 text-center">
                                    <div className="mb-6 flex justify-center">
                                        <div className="rounded-full bg-gradient-to-br from-purple-100 to-blue-100 p-6 shadow-lg">
                                            <FileWarning className="h-14 w-14 text-purple-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800">Aucun cours attribué</h3>
                                    <p className="mt-2 text-gray-500">Vous n'avez pas encore de cours attribués pour cette année académique.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
