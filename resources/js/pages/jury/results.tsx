'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Award,
    BarChart,
    BookOpen,
    Check,
    FileText,
    GraduationCap,
    Pencil,
    PlusCircle,
    User,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

// Types
type Course = {
    id: number;
    title: string;
};

type Note = {
    id: number;
    course_id: number;
    cote: number | null;
    student: { name: string };
    course: { title: string };
};

type Student = {
    id: number;
    name: string;
    notes: Note[];
    average: number;
    reserve: string;
    need: string;
};

type ResultsGridProps = {
    students: {
        data: Student[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    academicYear: { title: string };
    promotion: { title: string };
    allCourses: Course[];
    flash?: { type: string; message: string };
};

export default function ResultsGrid({ students, academicYear, promotion, allCourses, flash }: ResultsGridProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [pointsToAdd, setPointsToAdd] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeStudent, setActiveStudent] = useState(0);
    const [activeSubTab, setActiveSubTab] = useState<Record<number, string>>({});

    // États pour l'historique académique
    const [academicHistory, setAcademicHistory] = useState<Record<number, any>>({});
    const [loadingHistory, setLoadingHistory] = useState<Record<number, boolean>>({});

    // Fonction pour déterminer la couleur du badge en fonction de la note
    const getNoteColor = (cote: number | null) => {
        if (cote === null) return 'bg-gray-100 text-gray-800';
        if (cote < 10) return 'bg-red-100 text-red-800';
        if (cote < 12) return 'bg-amber-100 text-amber-800';
        return 'bg-green-100 text-green-800';
    };

    // Fonction pour déterminer l'icône en fonction de la note
    const getNoteIcon = (cote: number | null) => {
        if (cote === null) return <AlertTriangle className="h-4 w-4" />;
        if (cote < 10) return <X className="h-4 w-4" />;
        if (cote < 12) return <AlertTriangle className="h-4 w-4" />;
        return <Check className="h-4 w-4" />;
    };

    // Charger l'historique académique
    // Charger l'historique académique
    const loadAcademicHistory = (studentId: number) => {
        if (academicHistory[studentId] || loadingHistory[studentId]) return;

        setLoadingHistory((prev) => ({ ...prev, [studentId]: true }));

        // Correction : Ajout du préfixe "/jury" dans l'URL
        axios
            .get(`/jury/students/${studentId}/academic-history`)
            .then((response) => {
                setAcademicHistory((prev) => ({
                    ...prev,
                    [studentId]: response.data,
                }));
            })
            .catch((error) => {
                toast.error('Erreur lors du chargement du parcours académique');
            })
            .finally(() => {
                setLoadingHistory((prev) => ({ ...prev, [studentId]: false }));
            });
    };

    const handleAddPoints = (course: Course) => {
        setSelectedCourse(course);
        setEditingNote(null);
        setPointsToAdd(0);
        setIsModalOpen(true);
    };

    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setSelectedCourse(null);
        setPointsToAdd(note.cote || 0);
        setIsModalOpen(true);
    };

    const submitPoints = () => {
        setIsSubmitting(true);

        if (editingNote) {
            if (pointsToAdd < 0 || pointsToAdd > 20) {
                toast.error('La note doit être entre 0 et 20');
                setIsSubmitting(false);
                return;
            }

            router.post(
                '/jury/update-note',
                {
                    note_id: editingNote.id,
                    cote: pointsToAdd,
                },
                {
                    onSuccess: () => {
                        toast.success('Note modifiée avec succès');
                        setIsSubmitting(false);
                    },
                    onError: () => {
                        toast.error('Erreur lors de la modification de la note');
                        setIsSubmitting(false);
                    },
                    preserveScroll: true,
                },
            );
        } else if (selectedCourse) {
            router.post(
                '/jury/add-points',
                {
                    course_id: selectedCourse.id,
                    points: pointsToAdd,
                },
                {
                    onSuccess: () => {
                        toast.success('Points ajoutés avec succès');
                        setIsSubmitting(false);
                    },
                    onError: () => {
                        toast.error("Erreur lors de l'ajout des points");
                        setIsSubmitting(false);
                    },
                    preserveScroll: true,
                },
            );
        }
        setIsModalOpen(false);
    };

    const publishResults = () => {
        setIsSubmitting(true);
        router.post(
            '/jury/publish-results',
            {},
            {
                onSuccess: () => {
                    toast.success('Résultats publiés avec succès');
                    setIsSubmitting(false);
                },
                onError: () => {
                    toast.error('Erreur lors de la publication des résultats');
                    setIsSubmitting(false);
                },
                preserveScroll: true,
            },
        );
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
            <div className="container mx-auto px-4 py-8">
                <Head title="Gestion des résultats" />

                {/* En-tête modernisé */}
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
                            <BarChart className="h-8 w-8 text-indigo-600" />
                            Grille des résultats
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                                <GraduationCap className="mr-1 h-4 w-4" />
                                {academicYear.title}
                            </Badge>
                            <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                {promotion.title}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => allCourses.length > 0 && handleAddPoints(allCourses[0])} className="flex items-center gap-2 shadow-md">
                            <PlusCircle className="h-4 w-4" />
                            Ajouter des points
                        </Button>

                        <Button variant="secondary" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Exporter PDF
                        </Button>
                    </div>
                </div>

                {/* Onglets pour les étudiants */}
                <Tabs value={activeStudent.toString()} onValueChange={(value) => setActiveStudent(Number(value))} className="mb-6">
                    <TabsList
                        value={activeStudent.toString()}
                        onValueChange={(value) => setActiveStudent(Number(value))}
                        className="flex w-full overflow-x-auto"
                    >
                        {students.data.map((student, index) => (
                            <TabsTrigger
                                key={student.id}
                                value={index.toString()}
                                className="flex items-center gap-2"
                                active={activeStudent === index}
                            >
                                <User className="h-4 w-4" />
                                {student.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {students.data.map((student, index) => {
                        const currentSubTab = activeSubTab[index] || 'results';

                        return (
                            <TabsContent key={student.id} value={index.toString()} active={activeStudent === index} className="space-y-4">
                                {/* Sous-onglets Résultats vs Parcours */}
                                <Tabs
                                    value={currentSubTab}
                                    onValueChange={(value) =>
                                        setActiveSubTab((prev) => ({
                                            ...prev,
                                            [index]: value,
                                        }))
                                    }
                                >
                                    <TabsList
                                        value={currentSubTab}
                                        onValueChange={(value) =>
                                            setActiveSubTab((prev) => ({
                                                ...prev,
                                                [index]: value,
                                            }))
                                        }
                                        className="mb-4"
                                    >
                                        <TabsTrigger value="results">Résultats actuels</TabsTrigger>
                                        <TabsTrigger value="history" onClick={() => loadAcademicHistory(student.id)}>
                                            Parcours académique
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Contenu des résultats actuels */}
                                    <TabsContent value="results" active={currentSubTab === 'results'}>
                                        <Card className="overflow-hidden rounded-xl border border-gray-200 shadow-lg">
                                            <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <GraduationCap className="h-5 w-5 text-indigo-600" />
                                                        <span className="text-lg font-semibold">{student.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="secondary" className="bg-indigo-600 px-3 py-1 font-bold text-white">
                                                            Moyenne: {student.average.toFixed(2)}
                                                        </Badge>
                                                        <Badge variant="outline" className="bg-amber-50 px-3 py-1 text-amber-800">
                                                            Réserve: {student.reserve}
                                                        </Badge>
                                                        <Badge variant="outline" className="bg-blue-50 px-3 py-1 text-blue-800">
                                                            Besoin: {student.need}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="p-0">
                                                <Table>
                                                    <TableHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                                                        <TableRow className="hover:bg-transparent">
                                                            <TableHead className="py-4 pl-8 font-bold text-gray-900">Cours</TableHead>
                                                            <TableHead className="py-4 text-center">Note</TableHead>
                                                            <TableHead className="py-4 text-center">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {student.notes.map((note) => (
                                                            <TableRow key={note.course_id} className="group transition-colors hover:bg-indigo-50">
                                                                <TableCell className="border-b border-gray-100 py-4 pl-8">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="rounded-full bg-indigo-100 p-2">
                                                                            <BookOpen className="h-5 w-5 text-indigo-600" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-medium text-gray-900">{note.course.title}</div>
                                                                            <div className="mt-1 text-xs text-gray-500">Crédits: 5</div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>

                                                                <TableCell className="border-b border-gray-100 py-4">
                                                                    <div className="flex justify-center">
                                                                        <div className={note.cote !== null ? 'w-full max-w-[200px]' : 'w-auto'}>
                                                                            {note.cote !== null ? (
                                                                                <div className="flex flex-col items-center">
                                                                                    <div className="mb-2 h-2.5 w-full rounded-full bg-gray-200">
                                                                                        <div
                                                                                            className={`h-2.5 rounded-full ${getNoteColor(note.cote).replace('text-', 'bg-').split(' ')[0]}`}
                                                                                            style={{ width: `${(note.cote / 20) * 100}%` }}
                                                                                        ></div>
                                                                                    </div>
                                                                                    <Badge
                                                                                        className={`${getNoteColor(note.cote)} flex items-center gap-1.5 rounded-full px-4 py-1.5`}
                                                                                    >
                                                                                        {getNoteIcon(note.cote)}
                                                                                        <span className="text-base font-bold">{note.cote}/20</span>
                                                                                    </Badge>
                                                                                </div>
                                                                            ) : (
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-1.5"
                                                                                >
                                                                                    <AlertTriangle className="h-4 w-4" />
                                                                                    <span className="font-medium">Non noté</span>
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>

                                                                <TableCell className="border-b border-gray-100 py-4 text-center">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="flex items-center gap-1.5 text-indigo-600 opacity-0 transition-colors group-hover:opacity-100 hover:bg-indigo-100 hover:text-indigo-800"
                                                                        onClick={() => handleEditNote(note)}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                        <span>Modifier</span>
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Contenu du parcours académique */}
                                    <TabsContent value="history" active={currentSubTab === 'history'}>
                                        {loadingHistory[student.id] ? (
                                            <div className="space-y-6">
                                                {[1, 2, 3].map((year) => (
                                                    <Card key={year} className="overflow-hidden">
                                                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
                                                            <div className="flex items-center justify-between">
                                                                <Skeleton className="h-6 w-40" />
                                                                <Skeleton className="h-6 w-24" />
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="p-4">
                                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                                                {[1, 2, 3, 4].map((course) => (
                                                                    <Skeleton key={course} className="h-24 rounded-lg" />
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : academicHistory[student.id] ? (
                                            <div className="space-y-6">
                                                {/* Historique académique */}
                                                {academicHistory[student.id].history.map((year: any, idx: number) => (
                                                    <Card key={`${student.id}-year-${year.academic_year_id}`} className="overflow-hidden">
                                                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
                                                            <div className="flex items-center justify-between">
                                                                <h3 className="text-lg font-semibold">{year.academic_year}</h3>
                                                                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                                                    {year.promotion}
                                                                </Badge>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="p-4">
                                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                                                {year.courses.map((course: any) => (
                                                                    <div
                                                                        key={`${student.id}-course-${course.id}-${year.academic_year_id}`}
                                                                        className={`rounded-lg border p-4 ${
                                                                            course.passed
                                                                                ? 'border-green-200 bg-green-50 text-green-800'
                                                                                : 'border-red-200 bg-red-50 text-red-800'
                                                                        }`}
                                                                    >
                                                                        <div className="font-medium">{course.title}</div>
                                                                        <div className="mt-2 text-sm">
                                                                            {course.note !== null ? (
                                                                                <>
                                                                                    <span className="font-bold">{course.note}/20</span>
                                                                                    <span> - {course.passed ? 'Validé' : 'Non validé'}</span>
                                                                                </>
                                                                            ) : (
                                                                                <span>Non noté</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}

                                                {/* Cours complémentaires */}
                                                {academicHistory[student.id].complementary_courses &&
                                                    academicHistory[student.id].complementary_courses.length > 0 && (
                                                        <Card className="border-amber-200 bg-amber-50">
                                                            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 p-4">
                                                                <div className="flex items-center gap-2">
                                                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                                                    <h3 className="text-lg font-semibold text-amber-800">Cours complémentaires</h3>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="p-4">
                                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                                                    {academicHistory[student.id].complementary_courses.map((course: any) => (
                                                                        <div
                                                                            key={`${student.id}-complementary-${course.id}`}
                                                                            className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800"
                                                                        >
                                                                            <div className="font-medium">{course.title}</div>
                                                                            <div className="mt-2 text-sm">
                                                                                <span className="font-bold">{course.note}/20</span>
                                                                                <span> - À repasser</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                            </div>
                                        ) : (
                                            <div className="flex justify-center py-8">
                                                <div className="text-gray-500">Aucun parcours académique disponible.</div>
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </TabsContent>
                        );
                    })}
                </Tabs>

                {/* Pagination */}
                <Pagination className="mt-6">
                    <PaginationContent>
                        {students.links.map((link, index) => (
                            <PaginationItem key={index}>
                                {link.url ? (
                                    <PaginationLink
                                        href={link.url}
                                        isActive={link.active}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            router.get(link.url!);
                                        }}
                                    >
                                        {link.label.includes('Previous') ? (
                                            <ArrowLeft className="h-4 w-4" />
                                        ) : link.label.includes('Next') ? (
                                            <ArrowRight className="h-4 w-4" />
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </PaginationLink>
                                ) : (
                                    <span className="text-gray-400" dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </PaginationItem>
                        ))}
                    </PaginationContent>
                </Pagination>

                {/* Bouton de publication */}
                <div className="mt-8 flex justify-center">
                    <Button onClick={publishResults} disabled={isSubmitting} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                        <Award className="h-4 w-4" />
                        {isSubmitting ? 'Publication en cours...' : 'Publier les résultats'}
                    </Button>
                </div>

                {/* Modal pour ajouter/modifier des points */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="rounded-lg border-0 bg-white p-6 shadow-xl sm:max-w-md">
                        <DialogHeader>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                                {editingNote ? <Pencil className="h-6 w-6 text-indigo-600" /> : <PlusCircle className="h-6 w-6 text-indigo-600" />}
                            </div>
                            <DialogTitle className="mt-4 text-center text-xl font-bold">
                                {editingNote ? 'Modifier la note' : 'Ajouter des points'}
                            </DialogTitle>
                            <DialogDescription className="text-center">
                                {editingNote
                                    ? `Modifier la note de ${editingNote.student.name} en ${editingNote.course.title}`
                                    : `Ajouter des points à tous les étudiants pour ${selectedCourse?.title}`}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="points" className="mb-2 block">
                                        {editingNote ? 'Nouvelle note' : 'Points à ajouter'}
                                    </Label>
                                    <Input
                                        id="points"
                                        type="number"
                                        value={pointsToAdd}
                                        onChange={(e) => setPointsToAdd(Number(e.target.value))}
                                        min={editingNote ? 0 : undefined}
                                        max={editingNote ? 20 : undefined}
                                        step="0.1"
                                        className="h-12 rounded-lg border-gray-300 text-center text-xl font-bold"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">{editingNote ? 'Note entre 0 et 20' : 'Valeur numérique'}</p>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                onClick={submitPoints}
                                disabled={isSubmitting || isNaN(pointsToAdd) || pointsToAdd < 0 || (editingNote ? pointsToAdd > 20 : false)}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-pulse">Traitement...</span>
                                    </span>
                                ) : editingNote ? (
                                    'Modifier la note'
                                ) : (
                                    'Ajouter les points'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}