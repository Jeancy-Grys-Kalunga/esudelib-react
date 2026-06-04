'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
    ArrowRightLeft,
    ArrowUpDown,
    Award,
    BarChart,
    BrainCircuit,
    Check,
    Download,
    GraduationCap,
    Layers,
    Loader2,
    PlusCircle,
    Save,
    Scale,
    Search,
    User,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

// Types
type Course = {
    id: number;
    title: string;
    credit?: number;
    orientation?: string;
    cm?: number;
    td?: number;
    tp?: number;
    program_detail_id?: number | null;
    unit_teaching_id?: number;
};

type NoteData = {
    id: number;
    value: number | null;
    is_submitted?: boolean;
};

type Student = {
    id: number;
    name: string;
    matricule?: string;
    notes: any[];
    average: number;
    reserve: string;
    need: string;
    decision: string;
    mention: string;
};

type GridData = {
    courses: Array<{ id: number; title: string; credit: number }>;
    students: Array<{
        id: number;
        name: string;
        matricule: string;
        average: number;
        reserve: string;
        need: string;
        decision: string;
        mention: string;
        notes: Record<number, NoteData | null>;
    }>;
};

type TeachingUnit = {
    id: number;
    title: string;
    courses: Course[];
};

type ResultsGridProps = {
    students: {
        data: Student[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    academicYear: { id: number; title: string };
    promotion: { id: number; title: string };
    allCourses: Course[];
    gridData: GridData;
    flash?: { type: string; message: string };
    teachingUnits: TeachingUnit[];
};

// Composant EditableCell
const EditableCell = ({
    value,
    onChange,
    placeholder = '',
    type = 'text',
}: {
    value: any;
    onChange: (newValue: any) => void;
    placeholder?: string;
    type?: string;
}) => {
    const [localValue, setLocalValue] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setLocalValue(value?.toString() || '');
    }, [value]);

    const handleSave = () => {
        let finalValue: any = localValue;

        if (type === 'number') {
            if (localValue === '') {
                finalValue = 0;
            } else {
                // Remplacer les virgules par des points et convertir en float
                const numericValue = parseFloat(localValue.replace(',', '.'));
                if (!isNaN(numericValue)) {
                    // Limiter entre 0 et 20 avec 2 décimales
                    finalValue = Math.min(20, Math.max(0, Math.round(numericValue * 100) / 100));
                } else {
                    finalValue = 0;
                }
            }
        }

        onChange(finalValue);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setLocalValue(value?.toString() || '');
        }
    };

    if (isEditing) {
        return (
            <div className="relative">
                <Input
                    autoFocus
                    type={type}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="h-8 w-full px-2 py-1 text-sm"
                    placeholder={placeholder}
                />
                <div className="absolute top-1 right-1 flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSave}>
                        <Check className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                            setIsEditing(false);
                            setLocalValue(value?.toString() || '');
                        }}
                    >
                        <X className="h-3 w-3 text-red-600" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[32px] cursor-pointer items-center rounded px-2 py-1 hover:bg-gray-100" onClick={() => setIsEditing(true)}>
            {value !== null && value !== undefined ? (
                <span>{type === 'number' ? `${value}/20` : value}</span>
            ) : (
                <span className="text-gray-400">{placeholder}</span>
            )}
        </div>
    );
};

// Composant Modal pour éditer les détails du cours
const CourseDetailsModal = ({
    isOpen,
    onClose,
    course,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    course: Course | null;
    onSave: (data: any) => void;
}) => {
    const [formData, setFormData] = useState({
        credits: 0,
        cm: 0,
        td: 0,
        tp: 0,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (course) {
            setFormData({
                credits: course.credit || 0,
                cm: course.cm || 0,
                td: course.td || 0,
                tp: course.tp || 0,
            });
        }
    }, [course]);

    const handleSave = async () => {
        // if (!course?.program_detail_id) { ... } -> Removed check to allow creation

        setSaving(true);
        try {
            await axios.post(route('jury.course-details.update'), {
                program_detail_id: course.program_detail_id,
                course_id: course.id,
                // @ts-ignore
                unit_teaching_id: course.unit_teaching_id,
                ...formData,
            });
            toast.success('Détails du cours mis à jour');
            onSave(formData);
            onClose();
            router.reload(); // Recharger pour mettre à jour les moyennes
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !course) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Modifier : {course.title}</DialogTitle>
                    <DialogDescription>Ajustez les crédits et volumes horaires pour ce cours.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium">Crédits</label>
                        <Input
                            type="number"
                            value={formData.credits}
                            onChange={(e) => setFormData({ ...formData, credits: parseFloat(e.target.value) || 0 })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium">CM (h)</label>
                        <Input
                            type="number"
                            value={formData.cm}
                            onChange={(e) => setFormData({ ...formData, cm: parseFloat(e.target.value) || 0 })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium">TD (h)</label>
                        <Input
                            type="number"
                            value={formData.td}
                            onChange={(e) => setFormData({ ...formData, td: parseFloat(e.target.value) || 0 })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium">TP (h)</label>
                        <Input
                            type="number"
                            value={formData.tp}
                            onChange={(e) => setFormData({ ...formData, tp: parseFloat(e.target.value) || 0 })}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Composant pour afficher une grille de résultats
const ResultsTable = ({
    courses,
    students,
    onChange,
    showActions = false,
    onMassEdit,
    isSaving,
    highlightedStudentId = null,
}: {
    courses: Array<Course>;
    students: Array<{
        id: number;
        name: string;
        matricule: string;
        average: number;
        reserve: string;
        need: string;
        decision: string;
        mention: string;
        notes: Record<number, NoteData | null>;
    }>;
    onChange: (studentId: number, courseId: number, field: string, value: any) => void;
    showActions?: boolean;
    onMassEdit?: (courseId: number, points: number) => void;
    isSaving?: boolean;
    highlightedStudentId?: number | null;
}) => {
    const [massEditPoints, setMassEditPoints] = useState<Record<number, string>>({});
    const [isMassEditing, setIsMassEditing] = useState<Record<number, boolean>>({});
    const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({});
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    const handleMassEdit = (courseId: number) => {
        if (onMassEdit) {
            const points = parseFloat(massEditPoints[courseId]?.replace(',', '.') || '0');
            if (!isNaN(points)) {
                onMassEdit(courseId, points);
                setIsMassEditing((prev) => ({ ...prev, [courseId]: false }));
                setMassEditPoints((prev) => ({ ...prev, [courseId]: '' }));
            }
        }
    };

    // Effet pour scroller vers l'étudiant surligné
    useEffect(() => {
        if (highlightedStudentId && rowRefs.current[highlightedStudentId]) {
            rowRefs.current[highlightedStudentId]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [highlightedStudentId]);

    // Fonction pour obtenir la couleur de la décision
    const getDecisionColor = (decision: string) => {
        switch (decision) {
            case 'A':
                return 'bg-purple-100 text-purple-800';
            case 'B':
                return 'bg-blue-100 text-blue-800';
            case 'C':
                return 'bg-green-100 text-green-800';
            case 'D':
                return 'bg-teal-100 text-teal-800';
            case 'E':
                return 'bg-amber-100 text-amber-800';
            case 'F':
                return 'bg-orange-100 text-orange-800';
            case 'G':
                return 'bg-red-100 text-red-800';
            case 'AJ':
                return 'bg-red-200 text-red-900';
            case 'DEF':
                return 'bg-gray-200 text-gray-900';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Fonction pour obtenir la couleur de la mention
    const getMentionColor = (mention: string) => {
        switch (mention) {
            case 'Admis':
                return 'bg-green-100 text-green-800';
            case 'Comp':
                return 'bg-yellow-100 text-yellow-800';
            case 'AJ':
                return 'bg-red-100 text-red-800';
            case 'DEF':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
            <Table>
                <TableHeader className="bg-gray-100">
                    <TableRow>
                        <TableHead className="sticky left-0 min-w-[120px] bg-white px-4 py-3">Matricule</TableHead>
                        <TableHead className="sticky left-0 min-w-[200px] bg-white px-4 py-3">Étudiant</TableHead>
                        {courses.map((course) => (
                            <TableHead key={course.id} className="group min-w-[250px] px-4 py-3 text-center">
                                <div
                                    className="flex cursor-pointer items-center justify-center gap-1 font-medium hover:text-indigo-600 hover:underline"
                                    onClick={() => setEditingCourse(course)}
                                    title="Cliquez pour modifier les crédits"
                                >
                                    {course.title}
                                    <span className="text-xs text-gray-400">✎</span>
                                </div>
                                <div className="text-xs text-gray-500">Crédits: {course.credit}</div>
                                <div className="text-[10px] text-gray-400">
                                    CM: {course.cm || 0} | TD: {course.td || 0} | TP: {course.tp || 0}
                                </div>

                                <div className="mt-2 flex items-center justify-center">
                                    {isMassEditing[course.id] ? (
                                        <div className="flex items-center gap-1">
                                            <Input
                                                type="number"
                                                value={massEditPoints[course.id] || ''}
                                                onChange={(e) =>
                                                    setMassEditPoints((prev) => ({
                                                        ...prev,
                                                        [course.id]: e.target.value,
                                                    }))
                                                }
                                                placeholder="Points à ajouter"
                                                className="h-8 w-32 text-sm"
                                                step="0.1"
                                                min="-20"
                                                max="20"
                                            />
                                            <Button variant="outline" size="sm" onClick={() => handleMassEdit(course.id)} disabled={isSaving}>
                                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Appliquer'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setIsMassEditing((prev) => ({ ...prev, [course.id]: false }))}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-blue-600 opacity-0 group-hover:opacity-100"
                                            onClick={() => setIsMassEditing((prev) => ({ ...prev, [course.id]: true }))}
                                        >
                                            <PlusCircle className="mr-1 h-4 w-4" />
                                            Ajouter des points
                                        </Button>
                                    )}
                                </div>
                            </TableHead>
                        ))}
                        <TableHead className="min-w-[100px] px-4 py-3 text-center">Moyenne</TableHead>
                        <TableHead className="min-w-[100px] px-4 py-3 text-center">Réserve</TableHead>
                        <TableHead className="min-w-[100px] px-4 py-3 text-center">Besoin</TableHead>
                        <TableHead className="min-w-[100px] px-4 py-3 text-center">Décision</TableHead>
                        <TableHead className="min-w-[100px] px-4 py-3 text-center">Mention</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student) => (
                        <TableRow
                            key={student.id}
                            ref={(el) => {
                                rowRefs.current[student.id] = el;
                            }}
                            className={`hover:bg-gray-50 ${highlightedStudentId === student.id ? 'animate-pulse bg-yellow-100 duration-1000' : ''}`}
                        >
                            <TableCell className="sticky left-0 border-b bg-white px-4 py-3">{student.matricule}</TableCell>
                            <TableCell className="sticky left-0 border-b bg-white px-4 py-3 font-medium">{student.name}</TableCell>
                            {courses.map((course) => {
                                const note = student.notes[course.id];
                                return (
                                    <TableCell key={course.id} className="border-b px-4 py-3">
                                        {note ? (
                                            <div className="flex justify-center">
                                                <EditableCell
                                                    value={note.value}
                                                    onChange={(value) => onChange(student.id, course.id, 'value', value)}
                                                    placeholder="Note"
                                                    type="number"
                                                />
                                            </div>
                                        ) : (
                                            <div className="py-2 text-center text-gray-400">Non inscrit</div>
                                        )}
                                    </TableCell>
                                );
                            })}
                            <TableCell className="border-b px-4 py-3 text-center font-bold">
                                <Badge variant="secondary" className="bg-indigo-600 px-3 py-1 text-white">
                                    {student.average.toFixed(2)}
                                </Badge>
                            </TableCell>
                            <TableCell className="border-b px-4 py-3 text-center">
                                <Badge variant="outline" className="bg-amber-50 px-3 py-1 text-amber-800">
                                    {student.reserve}
                                </Badge>
                            </TableCell>
                            <TableCell className="border-b px-4 py-3 text-center">
                                <Badge variant="outline" className="bg-blue-50 px-3 py-1 text-blue-800">
                                    {student.need}
                                </Badge>
                            </TableCell>
                            <TableCell className="border-b px-4 py-3 text-center">
                                <Badge variant="outline" className={`${getDecisionColor(student.decision)} px-3 py-1 font-medium`}>
                                    {student.decision}
                                </Badge>
                            </TableCell>
                            <TableCell className="border-b px-4 py-3 text-center">
                                <Badge variant="outline" className={`${getMentionColor(student.mention)} px-3 py-1 font-medium`}>
                                    {student.mention}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <CourseDetailsModal
                isOpen={!!editingCourse}
                onClose={() => setEditingCourse(null)}
                course={editingCourse}
                onSave={() => setEditingCourse(null)}
            />
        </div>
    );
};

// Composant Modal pour le Parcours Académique
const AcademicHistoryModal = ({
    isOpen,
    onClose,
    student,
    historyData,
    loading,
}: {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    historyData: any;
    loading: boolean;
}) => {
    if (!isOpen) return null;

    return (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Parcours Académique - {student.name} ({student.matricule})
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-6 py-8">
                        {[1, 2, 3].map((year) => (
                            <Card key={`skeleton-${year}`} className="overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-6 w-40" />
                                        <Skeleton className="h-6 w-24" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                        {[1, 2, 3, 4].map((course) => (
                                            <Skeleton key={`skeleton-course-${course}-${year}`} className="h-24 rounded-lg" />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : historyData ? (
                    <div className="space-y-6 py-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
                            <h2 className="mb-6 text-xl font-bold text-gray-800">Parcours Académique</h2>

                            {/* Tableau principal */}
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full">
                                    <thead className="bg-indigo-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-indigo-800">Promotion</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-indigo-800">Cours Validés</th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-indigo-800">Cours Complémentaires</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {historyData.history.map((year: any) => {
                                            const passedCourses = year.courses.filter((c: any) => c.passed);
                                            const failedCourses = year.courses.filter((c: any) => !c.passed);

                                            return (
                                                <tr key={`${year.academic_year_id}-${year.promotion_id}`} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium text-gray-900">{year.promotion}</div>
                                                        <div className="text-sm text-gray-500">{year.academic_year}</div>
                                                    </td>

                                                    {/* Cours Validés */}
                                                    <td className="px-6 py-4">
                                                        {passedCourses.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {passedCourses.map((course: any) => (
                                                                    <div
                                                                        key={`passed-${year.academic_year_id}-${course.id}`}
                                                                        className="flex items-center justify-between rounded bg-green-50 p-3"
                                                                    >
                                                                        <div>
                                                                            <div className="font-medium">{course.title}</div>
                                                                            <div className="text-sm text-gray-600">{course.credits} crédits</div>
                                                                        </div>
                                                                        <Badge className="bg-green-100 text-green-800">{course.note}/20</Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-gray-400 italic">Aucun cours validé</div>
                                                        )}
                                                    </td>

                                                    {/* Cours Complémentaires */}
                                                    <td className="px-6 py-4">
                                                        {failedCourses.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {failedCourses.map((course: any) => (
                                                                    <div
                                                                        key={`failed-${year.academic_year_id}-${course.id}`}
                                                                        className="flex items-center justify-between rounded bg-amber-50 p-3"
                                                                    >
                                                                        <div>
                                                                            <div className="font-medium">{course.title}</div>
                                                                            <div className="text-sm text-gray-600">{course.credits} crédits</div>
                                                                        </div>
                                                                        <Badge className="bg-amber-100 text-amber-800">
                                                                            {course.note ? `${course.note}/20` : 'Non suivi'}
                                                                        </Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-gray-400 italic">Aucun cours complémentaire</div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* Ligne des totaux */}
                                        <tr className="border-t-2 border-indigo-200 bg-indigo-50 font-bold">
                                            <td className="px-6 py-4 text-right" colSpan={2}>
                                                <div className="flex justify-between">
                                                    <span>Total crédits validés:</span>
                                                    <span className="text-green-600">
                                                        {(() => {
                                                            // Dédoublonner les cours validés par ID de cours (éviter de compter 2x le même cours)
                                                            const passedMap: Record<number, number> = {};
                                                            historyData.history.forEach((year: any) => {
                                                                year.courses
                                                                    .filter((c: any) => c.passed)
                                                                    .forEach((c: any) => {
                                                                        passedMap[c.id] = parseFloat(c.credits) || 0;
                                                                    });
                                                            });
                                                            return Object.values(passedMap)
                                                                .reduce((sum: number, cr: number) => sum + cr, 0)
                                                                .toFixed(2);
                                                        })()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-between">
                                                    <span>Total crédits complémentaires:</span>
                                                    <span className="text-amber-600">
                                                        {historyData.complementary_courses
                                                            .reduce((total: number, course: any) => {
                                                                return total + (parseFloat(course.credits) || 0);
                                                            }, 0)
                                                            .toFixed(2)}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Section des cours à repasser */}
                            {historyData.complementary_courses?.length > 0 && (
                                <div className="mt-8">
                                    <div className="mb-4 flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                                        <h3 className="text-lg font-semibold text-amber-800">Cours à repasser</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                        {historyData.complementary_courses.map((course: any) => (
                                            <div
                                                key={`complementary-${course.id}`}
                                                className="rounded-lg border border-amber-200 bg-amber-50 p-4 transition-all hover:shadow-md"
                                            >
                                                <div className="font-medium text-amber-800">{course.title}</div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <div className="text-sm text-amber-700">{course.credits} crédits</div>
                                                    <div className="text-sm font-semibold text-amber-800">
                                                        {course.note ? `${course.note}/20` : 'Non suivi'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center py-8">
                        <div className="text-gray-500">Aucun parcours académique disponible.</div>
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <Button onClick={onClose}>Fermer</Button>
                </div>
            </div>
        </div>
    );
};

export default function ResultsGrid({ students, academicYear, promotion, allCourses, gridData, flash, teachingUnits = [] }: ResultsGridProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [changes, setChanges] = useState<
        Array<{
            id: number | null;
            studentId: number;
            courseId: number;
            field: string;
            value: any;
            isNew?: boolean;
        }>
    >([]);
    const [massChanges, setMassChanges] = useState<
        Array<{
            courseId: number;
            points: number;
        }>
    >([]);
    const [activeStudent, setActiveStudent] = useState(0);
    const [viewMode, setViewMode] = useState<'individual' | 'grid'>('grid');
    const [isExporting, setIsExporting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [academicHistory, setAcademicHistory] = useState<Record<number, any>>({});
    const [loadingHistory, setLoadingHistory] = useState<Record<number, boolean>>({});
    const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);
    const [academicHistoryModalOpen, setAcademicHistoryModalOpen] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedStudentId, setHighlightedStudentId] = useState<number | null>(null);
    const tabsRef = useRef<HTMLDivElement>(null);

    // États pour la pérequation
    const [equalizationModalOpen, setEqualizationModalOpen] = useState(false);
    const [selectedEqualizationOption, setSelectedEqualizationOption] = useState<number | null>(null);
    const [selectedUE, setSelectedUE] = useState<number | null>(null);
    const [selectedCredit, setSelectedCredit] = useState<number | null>(null);
    const [applyingEqualization, setApplyingEqualization] = useState(false);

    // Options de pérequation
    const equalizationOptions = [
        {
            id: 1,
            type: 'global',
            title: 'Péréquation Globale',
            description: 'Utilise la réserve totale pour combler les échecs dans tous les cours',
            icon: <Scale className="h-6 w-6 text-purple-500" />,
        },
        {
            id: 2,
            type: 'ue',
            title: 'Péréquation par UE',
            description: "Utilise la réserve dans une unité d'enseignement pour combler ses échecs",
            icon: <Layers className="h-6 w-6 text-blue-500" />,
        },
        {
            id: 3,
            type: 'coefficient',
            title: 'Péréquation par Coefficient',
            description: 'Utilise la réserve dans les cours de même crédit pour combler les échecs',
            icon: <ArrowUpDown className="h-6 w-6 text-green-500" />,
        },
    ];

    // Crédits distincts
    const distinctCredits = Array.from(new Set(allCourses.map((course) => course.credit).filter((credit) => credit !== undefined) as number[])).sort(
        (a, b) => a - b,
    );

    useEffect(() => {
        if (flash?.message) {
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

    const handleGradeChange = (studentId: number, courseId: number, field: string, value: any) => {
        const student = gridData.students.find((s) => s.id === studentId);
        const note = student?.notes[courseId];
        const noteId = note?.id || Date.now();

        setChanges((prev) => [
            ...prev,
            {
                id: noteId,
                studentId,
                courseId,
                field,
                value,
                isNew: !note?.id,
            },
        ]);
    };

    const handleMassEdit = (courseId: number, points: number) => {
        setMassChanges((prev) => [...prev, { courseId, points }]);
    };

    const saveChanges = async () => {
        if ((changes.length === 0 && massChanges.length === 0) || isSaving) return;
        setIsSaving(true);

        try {
            const response = await axios.post('/jury/save-grades', {
                changes: changes.map((c) => ({
                    ...c,
                    id: c.isNew ? null : c.id,
                    studentId: c.studentId,
                    courseId: c.courseId,
                })),
                massChanges,
            });

            if (response.data.success) {
                setChanges([]);
                setMassChanges([]);
                setLastSaved(new Date().toLocaleTimeString());
                router.reload({ only: ['students', 'gridData'] });
            }
        } catch (error: any) {
            console.error('Erreur sauvegarde:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save après 30 secondes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (changes.length > 0 || massChanges.length > 0) {
                saveChanges();
            }
        }, 30000);

        setSaveTimer(timer);

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [changes, massChanges]);

    const exportToExcel = async () => {
        setIsExporting(true);
        try {
            const response = await axios.get('/jury/export-results', {
                responseType: 'blob',
                params: {
                    academic_year_id: academicYear.id,
                    promotion_id: promotion.id,
                },
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `resultats-${promotion.title}-${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error('Erreur export:', error);
            toast.error("Erreur lors de l'exportation");
        } finally {
            setIsExporting(false);
        }
    };

    const publishResults = async () => {
        if (changes.length > 0 || massChanges.length > 0) {
            toast.info('Veuillez sauvegarder les modifications avant publication');
            return;
        }

        setIsPublishing(true);
        try {
            await axios.post('/jury/publish-results');
            toast.success('Résultats publiés avec succès');
        } catch (error) {
            console.error('Erreur publication:', error);
            toast.error('Erreur lors de la publication des résultats');
        } finally {
            setIsPublishing(false);
        }
    };

    const loadAcademicHistory = (studentId: number) => {
        if (academicHistory[studentId] || loadingHistory[studentId]) return;
        setLoadingHistory((prev) => ({ ...prev, [studentId]: true }));

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

    const openAcademicHistoryModal = (studentId: number) => {
        setAcademicHistoryModalOpen(studentId);
        loadAcademicHistory(studentId);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        // Recherche en mode Grille d'Ensemble
        if (viewMode === 'grid') {
            const foundStudent = gridData.students.find(
                (student) =>
                    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    student.matricule.toLowerCase().includes(searchQuery.toLowerCase()),
            );

            if (foundStudent) {
                setHighlightedStudentId(foundStudent.id);
                setTimeout(() => setHighlightedStudentId(null), 3000);
            } else {
                toast.error('Aucun étudiant trouvé');
            }
        }
        // Recherche en mode Grille Individuelle
        else {
            const index = students.data.findIndex(
                (student) =>
                    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (student.matricule && student.matricule.toLowerCase().includes(searchQuery.toLowerCase())),
            );

            if (index >= 0) {
                setActiveStudent(index);
                // Scroller vers l'onglet
                setTimeout(() => {
                    if (tabsRef.current) {
                        tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            } else {
                toast.error('Aucun étudiant trouvé dans la page courante');
            }
        }

        setSearchQuery('');
    };

    // Fonction pour appliquer la pérequation
    const applyEqualization = async () => {
        if (!selectedEqualizationOption || activeStudent === null) return;

        const studentId = students.data[activeStudent]?.id;
        if (!studentId) return;

        const option = equalizationOptions.find((opt) => opt.id === selectedEqualizationOption);
        if (!option) return;

        setApplyingEqualization(true);
        try {
            await axios.post('/jury/apply-equalization', {
                student_id: studentId,
                type: option.type,
                ue_id: selectedUE,
                credit: selectedCredit,
            });

            toast.success('Péréquation appliquée avec succès');
            router.reload({ only: ['students', 'gridData'] });
        } catch (error) {
            toast.error('Erreur lors de la péréquation');
        } finally {
            setApplyingEqualization(false);
            setEqualizationModalOpen(false);
        }
    };

    // Fonction pour obtenir la couleur de la décision (pour la vue individuelle)
    const getDecisionColor = (decision: string) => {
        switch (decision) {
            case 'A':
                return 'bg-purple-100 text-purple-800';
            case 'B':
                return 'bg-blue-100 text-blue-800';
            case 'C':
                return 'bg-green-100 text-green-800';
            case 'D':
                return 'bg-teal-100 text-teal-800';
            case 'E':
                return 'bg-amber-100 text-amber-800';
            case 'F':
                return 'bg-orange-100 text-orange-800';
            case 'G':
                return 'bg-red-100 text-red-800';
            case 'AJ':
                return 'bg-red-200 text-red-900';
            case 'DEF':
                return 'bg-gray-200 text-gray-900';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Fonction pour obtenir la couleur de la mention (pour la vue individuelle)
    const getMentionColor = (mention: string) => {
        switch (mention) {
            case 'Admis':
                return 'bg-green-100 text-green-800';
            case 'Comp':
                return 'bg-yellow-100 text-yellow-800';
            case 'AJ':
                return 'bg-red-100 text-red-800';
            case 'DEF':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout>
            <div className="container mx-auto px-4 py-8">
                <Head title="Gestion des résultats" />

                <div className="mb-8 flex flex-col items-start justify-between gap-4">
                    <div>
                        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
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

                    <div className="flex w-full flex-col gap-3 md:w-auto">
                        <div className="flex flex-wrap items-center gap-2">
                            {(changes.length > 0 || massChanges.length > 0) && (
                                <Badge variant="destructive" className="px-3 py-1">
                                    {changes.length + massChanges.length} modifications non sauvegardées
                                </Badge>
                            )}
                            {lastSaved && (
                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                    Sauvegardé: {lastSaved}
                                </Badge>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                onClick={saveChanges}
                                disabled={isSaving || (changes.length === 0 && massChanges.length === 0)}
                                className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                            </Button>

                            <Button variant="secondary" className="flex items-center gap-2" onClick={exportToExcel} disabled={isExporting}>
                                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Exporter Excel
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Barre de recherche */}
                <form onSubmit={handleSearch} className="mb-6 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Input
                            type="text"
                            placeholder="Rechercher un étudiant par nom ou matricule..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                        <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    </div>
                    <Button type="submit" variant="outline">
                        Rechercher
                    </Button>
                </form>

                <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="mb-6">
                    {/* @ts-ignore */}
                    <TabsList className="w-full md:w-auto">
                        <TabsTrigger value="individual">Grille Individuelle</TabsTrigger>
                        <TabsTrigger value="grid">Grille d'Ensemble</TabsTrigger>
                    </TabsList>
                </Tabs>

                {viewMode === 'grid' ? (
                    <ResultsTable
                        courses={gridData.courses}
                        students={gridData.students}
                        onChange={handleGradeChange}
                        onMassEdit={handleMassEdit}
                        isSaving={isSaving}
                        highlightedStudentId={highlightedStudentId}
                    />
                ) : (
                    <div ref={tabsRef}>
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

                            {students.data.map((student, index) => (
                                <TabsContent key={student.id} value={index.toString()} active={activeStudent === index} className="space-y-4">
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-center justify-between">
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
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => openAcademicHistoryModal(student.id)}
                                                className="flex items-center gap-2"
                                            >
                                                <GraduationCap className="h-4 w-4" />
                                                Voir le parcours académique
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setEqualizationModalOpen(true)}
                                                className="flex items-center gap-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 hover:bg-purple-100"
                                            >
                                                <ArrowRightLeft className="h-4 w-4" />
                                                Péréquation
                                            </Button>
                                            <Badge variant="outline" className={`${getDecisionColor(student.decision)} px-3 py-1 font-medium`}>
                                                Décision: {student.decision}
                                            </Badge>
                                            <Badge variant="outline" className={`${getMentionColor(student.mention)} px-3 py-1 font-medium`}>
                                                Mention: {student.mention}
                                            </Badge>
                                        </div>
                                    </div>

                                    {(() => {
                                        // Dédupliquer les notes par course_id (garder la meilleure note)
                                        const bestNotesMap: Record<number, NoteData> = {};
                                        const seenTitles = new Set<number>();

                                        student.notes.forEach((note: any) => {
                                            if (!note || note.course_id == null) return;
                                            const cid = Number(note.course_id);
                                            const existing = bestNotesMap[cid];
                                            if (!existing || (note.cote != null && (existing.value == null || note.cote > (existing.value ?? -1)))) {
                                                bestNotesMap[cid] = { id: note.id, value: note.cote };
                                            }
                                            seenTitles.add(cid);
                                        });

                                        // Construire les cours depuis allCourses (contient cm/td/tp) en filtrant par notes de l'étudiant
                                        const seenIdsList = Array.from(seenTitles);
                                        const coursesForGrid = seenIdsList.map((courseId) => {
                                            const fromAll = allCourses.find((c) => c.id === courseId);
                                            // Fallback: cherche dans les notes pour le titre
                                            const noteObj = student.notes.find((n: any) => Number(n.course_id) === courseId);
                                            return {
                                                id: courseId,
                                                title: fromAll?.title ?? noteObj?.course?.title ?? 'Cours inconnu',
                                                credit: fromAll?.credit ?? 0,
                                                cm: fromAll?.cm ?? 0,
                                                td: fromAll?.td ?? 0,
                                                tp: fromAll?.tp ?? 0,
                                                program_detail_id: fromAll?.program_detail_id ?? null,
                                                unit_teaching_id: fromAll?.unit_teaching_id ?? undefined,
                                            };
                                        });

                                        return (
                                            <ResultsTable
                                                courses={coursesForGrid}
                                                students={[
                                                    {
                                                        id: student.id,
                                                        name: student.name,
                                                        matricule: student.matricule || '',
                                                        average: student.average,
                                                        reserve: student.reserve,
                                                        need: student.need,
                                                        decision: student.decision,
                                                        mention: student.mention,
                                                        notes: bestNotesMap,
                                                    },
                                                ]}
                                                onChange={handleGradeChange}
                                                showActions={true}
                                                onMassEdit={handleMassEdit}
                                                isSaving={isSaving}
                                            />
                                        );
                                    })()}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                )}

                {viewMode === 'individual' && (
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
                )}

                <div className="mt-8 flex justify-center">
                    <Button
                        onClick={publishResults}
                        disabled={isPublishing || changes.length > 0 || massChanges.length > 0}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                        {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                        {isPublishing ? 'Publication en cours...' : 'Publier les résultats'}
                    </Button>
                </div>
            </div>

            {/* Modal pour le parcours académique */}
            {students.data.map((student) => (
                <AcademicHistoryModal
                    key={`modal-${student.id}`}
                    isOpen={academicHistoryModalOpen === student.id}
                    onClose={() => setAcademicHistoryModalOpen(null)}
                    student={student}
                    historyData={academicHistory[student.id]}
                    loading={loadingHistory[student.id] || false}
                />
            ))}

            {/* Modal pour la pérequation */}
            <Dialog open={equalizationModalOpen} onOpenChange={setEqualizationModalOpen}>
                <DialogContent className="max-w-2xl rounded-xl bg-white shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <ArrowRightLeft className="h-6 w-6 text-purple-600" />
                            <span>Péréquation des Notes</span>
                        </DialogTitle>
                        <DialogDescription>Transférez les points excédentaires pour combler les échecs</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {activeStudent !== null && students.data[activeStudent] && (
                            <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-5">
                                <div className="mb-4 flex items-center gap-4">
                                    <User className="h-5 w-5 text-indigo-600" />
                                    <h3 className="font-semibold text-indigo-800">Étudiant: {students.data[activeStudent]?.name}</h3>
                                    <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                                        Réserve: {students.data[activeStudent]?.reserve}
                                    </Badge>
                                    <Badge variant="outline" className="bg-amber-100 text-amber-800">
                                        Besoin: {students.data[activeStudent]?.need}
                                    </Badge>
                                </div>

                                <Accordion type="single" collapsible>
                                    {equalizationOptions.map((option) => (
                                        <AccordionItem key={option.id} value={`item-${option.id}`} className="mb-3 border-b-0">
                                            <AccordionTrigger
                                                onClick={() => setSelectedEqualizationOption(option.id)}
                                                className={`rounded-lg p-4 hover:no-underline ${
                                                    selectedEqualizationOption === option.id ? 'border border-indigo-200 bg-indigo-50' : 'bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg border bg-white p-2">{option.icon}</div>
                                                    <div className="text-left">
                                                        <h4 className="font-semibold">{option.title}</h4>
                                                        <p className="text-sm text-gray-500">{option.description}</p>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>

                                            <AccordionContent className="rounded-lg border border-gray-100 bg-white px-4 pb-4 shadow-sm">
                                                {option.type === 'global' && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3 rounded-lg bg-purple-50 p-3">
                                                            <Scale className="h-5 w-5 text-purple-600" />
                                                            <p className="text-sm">
                                                                Cette option utilisera toute la réserve disponible (
                                                                {students.data[activeStudent]?.reserve}) pour combler les échecs dans tous les cours.
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
                                                            <Check className="h-5 w-5 text-green-600" />
                                                            <p className="text-sm">
                                                                Les points seront distribués proportionnellement aux besoins dans chaque cours.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {option.type === 'ue' && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                                                            <Layers className="h-5 w-5 text-blue-600" />
                                                            <p className="text-sm">
                                                                Sélectionnez une unité d'enseignement pour la pérequation interne.
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            {teachingUnits.map((ue) => (
                                                                <div
                                                                    key={ue.id}
                                                                    className={`cursor-pointer rounded-lg border p-3 transition-all ${
                                                                        selectedUE === ue.id
                                                                            ? 'border-blue-500 bg-blue-50'
                                                                            : 'border-gray-200 hover:border-blue-300'
                                                                    }`}
                                                                    onClick={() => setSelectedUE(ue.id)}
                                                                >
                                                                    <h4 className="font-medium">{ue.title}</h4>
                                                                    <div className="mt-2 flex gap-2">
                                                                        {ue.courses.slice(0, 3).map((course) => (
                                                                            <Badge key={course.id} variant="outline" className="text-xs">
                                                                                {course.title}
                                                                            </Badge>
                                                                        ))}
                                                                        {ue.courses.length > 3 && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                +{ue.courses.length - 3}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {option.type === 'coefficient' && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
                                                            <ArrowUpDown className="h-5 w-5 text-green-600" />
                                                            <p className="text-sm">
                                                                Sélectionnez un coefficient pour la pérequation entre cours de même crédit.
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-4 gap-3">
                                                            {distinctCredits.map((credit) => (
                                                                <div
                                                                    key={credit}
                                                                    className={`cursor-pointer rounded-lg border p-3 text-center ${
                                                                        selectedCredit === credit
                                                                            ? 'border-green-500 bg-green-50'
                                                                            : 'border-gray-200 hover:border-green-300'
                                                                    }`}
                                                                    onClick={() => setSelectedCredit(credit)}
                                                                >
                                                                    <div className="text-lg font-bold">{credit}</div>
                                                                    <div className="text-xs text-gray-500">crédits</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div>
                                {selectedEqualizationOption && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>
                                            Option sélectionnée:{' '}
                                            <span className="font-medium">
                                                {equalizationOptions.find((o) => o.id === selectedEqualizationOption)?.title}
                                            </span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setEqualizationModalOpen(false)}>
                                    Annuler
                                </Button>
                                <Button
                                    onClick={applyEqualization}
                                    disabled={!selectedEqualizationOption || applyingEqualization}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                                >
                                    {applyingEqualization ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                                    )}
                                    Appliquer la péréquation
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
