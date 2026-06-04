import { Head, router, useForm } from '@inertiajs/react';
import { 
    BrainCircuit, Check, ChevronsUpDown, Download, Edit, 
    GraduationCap, Loader2, Plus, Search, Trash2, Upload, 
    X, Users, BookOpen, Clock, FileText 
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Label } from '@radix-ui/react-label';

type Course = {
    id: number;
    name: string;
    details?: {
        cm: number;
        td: number;
        tp: number;
        credits: number;
    };
    promotions?: {
        id: number;
        name: string;
    }[];
};

type AcademicYear = {
    id: number;
    name: string;
};

interface Assignment {
    id: number;
    holder_id: number;
    holder: string;
    collaborator_id: number | null;
    collaborator: string;
    course_id: number;
    course: string;
    academic_year_id: number;
    academic_year: string;
    institution_id: number;
    institution: string;
    observation: string | null;
    promotion_id: number;
    promotion: string;
    semester: string;
    cm: number;
    tp: number;
    td: number;
    credits: number;
}

type Teacher = {
    id: number;
    name: string;
};

type Institution = {
    id: number;
    name: string;
};

type AssignmentFormData = {
    id?: number;
    course_id: string;
    academic_year_id: string;
    holder_id: string;
    collaborator_id: string;
    observation: string;
    promotion_id: string;
};

type PageProps = {
    assignments: Assignment[];
    teachers: Teacher[];
    courses: Course[];
    academic_years: AcademicYear[];
    institutions: Institution[];
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        access: boolean;
    };
    flash?: {
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    };
    filters?: {
        search?: string;
        academic_year?: string;
    };
};

const CourseSelector = ({
    courses,
    value,
    onChange,
    error,
}: {
    courses: Course[];
    value: string;
    onChange: (value: string) => void;
    error?: string | null;
}) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col gap-1">
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
                onClick={() => setOpen(true)}
                type="button"
            >
                {value ? courses.find((course) => course.id.toString() === value)?.name : 'Sélectionnez un cours'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <DialogTitle className="sr-only">Rechercher un cours</DialogTitle>
                <CommandInput placeholder="Rechercher un cours..." />
                <CommandList>
                    <CommandEmpty>Aucun cours trouvé.</CommandEmpty>
                    <CommandGroup>
                        {courses.map((course) => (
                            <CommandItem
                                key={course.id}
                                value={course.name}
                                onSelect={() => {
                                    onChange(course.id.toString());
                                    setOpen(false);
                                }}
                            >
                                <Check className={cn('mr-2 h-4 w-4', value === course.id.toString() ? 'opacity-100' : 'opacity-0')} />
                                {course.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
};

export default function AssignmentManager({
    assignments: allAssignments,
    teachers,
    courses,
    academic_years,
    institutions,
    can,
    flash,
    filters,
}: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>(allAssignments);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [bulkAssignments, setBulkAssignments] = useState<AssignmentFormData[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [currentAcademicYear, setCurrentAcademicYear] = useState(filters?.academic_year || 'all');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const { post, errors, processing, reset, setData } = useForm({
        assignments: [] as AssignmentFormData[],
    });

    // Statistiques
    const stats = useMemo(() => {
        const uniqueCourses = new Set(allAssignments.map(a => a.course_id)).size;
        const uniqueTeachers = new Set([
            ...allAssignments.map(a => a.holder_id),
            ...allAssignments.filter(a => a.collaborator_id).map(a => a.collaborator_id)
        ]).size;
        return {
            total: allAssignments.length,
            courses: uniqueCourses,
            teachers: uniqueTeachers
        };
    }, [allAssignments]);

    // Filtrage combiné
    useEffect(() => {
        let results = [...allAssignments];

        // Filtre par recherche
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(
                (assignment) =>
                    assignment.holder.toLowerCase().includes(term) ||
                    (assignment.collaborator && assignment.collaborator.toLowerCase().includes(term)) ||
                    assignment.course.toLowerCase().includes(term) ||
                    assignment.promotion.toLowerCase().includes(term) ||
                    assignment.semester.toLowerCase().includes(term),
            );
        }

        // Filtre par année académique (ignorer si 'all')
        if (currentAcademicYear && currentAcademicYear !== 'all') {
            results = results.filter((a) => a.academic_year_id.toString() === currentAcademicYear);
        }

        setFilteredAssignments(results);
        setCurrentPage(1);
    }, [allAssignments, searchTerm, currentAcademicYear]);

    const paginatedAssignments = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAssignments.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAssignments, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);

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

    const openModal = (mode: 'single' | 'bulk', assignment?: Assignment) => {
        if (mode === 'single' && !can.edit && !can.create) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }
        if (mode === 'bulk' && !can.edit) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }

        setIsBulkMode(mode === 'bulk');

        if (mode === 'single' && assignment) {
            setBulkAssignments([
                {
                    id: assignment.id,
                    course_id: assignment.course_id.toString(),
                    academic_year_id: assignment.academic_year_id.toString(),
                    holder_id: assignment.holder_id.toString(),
                    collaborator_id: assignment.collaborator_id?.toString() || 'none',
                    observation: assignment.observation || '',
                    promotion_id: assignment.promotion_id ? assignment.promotion_id.toString() : '',
                },
            ]);
        } else {
            setBulkAssignments([createEmptyAssignment()]);
        }

        setIsModalOpen(true);
    };

    const createEmptyAssignment = (): AssignmentFormData => ({
        course_id: courses.length > 0 ? courses[0].id.toString() : '',
        academic_year_id: currentAcademicYear !== 'all' ? currentAcademicYear : academic_years.length > 0 ? academic_years[0].id.toString() : '',
        holder_id: teachers.length > 0 ? teachers[0].id.toString() : '',
        collaborator_id: 'none',
        observation: '',
        promotion_id: '',
    });

    const closeModal = () => {
        setIsModalOpen(false);
        setBulkAssignments([]);
        reset();
    };

    const handleAddAssignment = () => {
        setBulkAssignments([...bulkAssignments, createEmptyAssignment()]);
    };

    const handleRemoveAssignment = (index: number) => {
        if (bulkAssignments.length > 1) {
            const newAssignments = [...bulkAssignments];
            newAssignments.splice(index, 1);
            setBulkAssignments(newAssignments);
        } else {
            toast.warning('Vous devez conserver au moins une attribution');
        }
    };

    const handleAssignmentChange = (index: number, field: keyof AssignmentFormData, value: string) => {
        const newAssignments = [...bulkAssignments];
        newAssignments[index] = { ...newAssignments[index], [field]: value };

        // Si on change le cours, on tente de pré-sélectionner la promotion
        if (field === 'course_id') {
            const selectedCourse = courses.find((c) => c.id.toString() === value);
            if (selectedCourse && selectedCourse.promotions && selectedCourse.promotions.length === 1) {
                newAssignments[index].promotion_id = selectedCourse.promotions[0].id.toString();
            } else {
                newAssignments[index].promotion_id = '';
            }
        }

        setBulkAssignments(newAssignments);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);

        // Préparation des données pour l'envoi
        const payload = {
            assignments: bulkAssignments.map((a) => ({
                ...a,
                course_id: a.course_id,
                academic_year_id: a.academic_year_id,
                holder_id: a.holder_id,
                // Convertir 'none' en null
                collaborator_id: a.collaborator_id === 'none' ? null : a.collaborator_id,
                observation: a.observation,
                promotion_id: a.promotion_id,
            })),
        };

        // Utilisation de la route spécifique pour les opérations en masse
        const url = isBulkMode ? route('assignments.store.bulk') : route('assignments.store');

        router.post(url, payload, {
            onSuccess: () => {
                closeModal();
                setIsSubmitting(false);
            },
            onError: (errors) => {
                toast.error("Une erreur s'est produite");
                console.error('Submission errors:', errors);
                setIsSubmitting(false);
            },
        });
    };

    const openDeleteModal = (assignment: Assignment) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }
        setAssignmentToDelete(assignment);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!assignmentToDelete) return;

        setIsDeleting(true);
        router.delete(route('assignments.destroy', assignmentToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
            },
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setCurrentAcademicYear('all');
        router.get(route('assignments.index'), {}, { preserveState: true });
    };

    const getFieldError = (index: number, field: string): string | null => {
        const key = `assignments.${index}.${field}`;
        // @ts-ignore
        return errors[key] as string | null;
    };

    // Fonction pour filtrer les collaborateurs (exclure le titulaire)
    const getFilteredCollaborators = (index: number) => {
        const currentHolderId = bulkAssignments[index]?.holder_id;
        return teachers.filter((teacher) => teacher.id.toString() !== currentHolderId);
    };

    // Fonction pour exporter les données
    const exportAssignments = () => {
        router.get(route('assignments.export'), {
            academic_year: currentAcademicYear !== 'all' ? currentAcademicYear : undefined,
            search: searchTerm,
        });
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) {
            toast.error('Veuillez sélectionner un fichier');
            return;
        }

        setIsImporting(true);

        const formData = new FormData();
        formData.append('file', importFile);

        router.post(route('assignments.import'), formData, {
            onSuccess: () => {
                setIsImportModalOpen(false);
                setIsImporting(false);
                setImportFile(null);
                toast.success('Importation réussie !');
            },
            onError: (errors) => {
                setIsImporting(false);
                toast.error(errors.file || "Erreur lors de l'importation");
            },
            forceFormData: true,
        });
    };

    const handleAutoAssign = () => {
        if (!can.edit) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }

        const yearId = currentAcademicYear !== 'all' ? currentAcademicYear : academic_years.length > 0 ? academic_years[0].id.toString() : null;

        if (!yearId) {
            toast.error("Veuillez d'abord configurer une année académique");
            return;
        }

        if (
            confirm(
                "Voulez-vous lancer l'attribution automatique ? \nCette action va assigner les enseignants aux cours non attribués en se basant sur la correspondance Spécialité/Faculté.",
            )
        ) {
            router.post(
                route('assignments.auto-assign'),
                {
                    academic_year_id: yearId,
                },
                {
                    onSuccess: () => toast.success('Attribution automatique terminée'),
                    onError: () => toast.error("Erreur lors de l'attribution automatique"),
                },
            );
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    if (!can.access) {
        return (
            <AppLayout>
                <Head title="Accès refusé" />
                <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center py-6 text-center">
                    <div className="mb-6 rounded-full bg-red-100 p-6 dark:bg-red-900/30">
                        <X className="h-12 w-12 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">Accès refusé</h1>
                    <p className="mt-4 text-muted-foreground text-lg">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Gestion des Attributions" />
            <div className="container mx-auto space-y-8 py-8 px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Attributions des Cours</h1>
                        <p className="text-muted-foreground mt-2">Gérez les charges horaires et l'affectation des enseignants aux cours.</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        {can.create && (
                            <Button onClick={() => openModal('single')} className="gap-2 shadow-sm rounded-full">
                                <Plus size={16} />
                                Nouvelle
                            </Button>
                        )}
                        {can.edit && (
                            <Button onClick={() => openModal('bulk')} variant="secondary" className="gap-2 shadow-sm rounded-full">
                                <Plus size={16} />
                                Ajout Multiple
                            </Button>
                        )}
                        {can.edit && (
                            <>
                                <Button onClick={handleAutoAssign} className="gap-2 bg-emerald-600 shadow-sm hover:bg-emerald-700 rounded-full text-white">
                                    <BrainCircuit size={16} />
                                    Auto Assign
                                </Button>
                                <Button variant="outline" onClick={exportAssignments} className="gap-2 shadow-sm rounded-full">
                                    <Download size={16} />
                                    Exporter
                                </Button>
                                <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="gap-2 shadow-sm rounded-full">
                                    <Upload size={16} />
                                    Importer
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="shadow-sm border-l-4 border-l-primary/60 transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Attributions</CardTitle>
                            <FileText className="h-5 w-5 text-primary/60" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {filteredAssignments.length === allAssignments.length ? 'Toutes confondues' : `${filteredAssignments.length} filtrées`}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-l-4 border-l-emerald-500/60 transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Cours Couverts</CardTitle>
                            <BookOpen className="h-5 w-5 text-emerald-500/60" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{stats.courses}</div>
                            <p className="text-xs text-muted-foreground mt-1">Cours avec enseignant</p>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm border-l-4 border-l-blue-500/60 transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Enseignants Impliqués</CardTitle>
                            <Users className="h-5 w-5 text-blue-500/60" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{stats.teachers}</div>
                            <p className="text-xs text-muted-foreground mt-1">Actifs cette année</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="shadow-sm bg-gray-50/50 dark:bg-gray-900/50 border-none">
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    placeholder="Rechercher par cours, enseignant ou promotion..."
                                    className="pl-10 h-11 bg-white dark:bg-gray-950 border-gray-200 shadow-sm rounded-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2 rounded-full hover:bg-gray-100"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <Select value={currentAcademicYear} onValueChange={setCurrentAcademicYear}>
                                    <SelectTrigger className="w-full sm:w-[220px] h-11 bg-white dark:bg-gray-950 border-gray-200 shadow-sm rounded-full">
                                        <SelectValue placeholder="Toutes les années" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes les années</SelectItem>
                                        {academic_years.map((year) => (
                                            <SelectItem key={year.id} value={year.id.toString()}>
                                                {year.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" onClick={resetFilters} className="h-11 w-11 rounded-full text-muted-foreground hover:text-foreground" title="Réinitialiser les filtres">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Table */}
                <Card className="shadow-sm border-gray-200 dark:border-gray-800 overflow-hidden">
                    {filteredAssignments.length > 0 ? (
                        <div className="flex flex-col">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-100/80 dark:bg-gray-900/80 border-b">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Promotion / Semestre</TableHead>
                                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300 min-w-[200px]">Cours</TableHead>
                                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-center">Crédits (V.H.)</TableHead>
                                            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Équipe Pédagogique</TableHead>
                                            <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedAssignments.map((assignment) => (
                                            <TableRow key={assignment.id} className="group hover:bg-primary/5 transition-colors duration-200">
                                                <TableCell>
                                                    <div className="flex flex-col gap-1.5 items-start">
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 font-medium whitespace-nowrap">
                                                            {assignment.promotion}
                                                        </Badge>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{assignment.semester}</span>
                                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[180px]" title={assignment.institution}>{assignment.institution}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                                                        {assignment.course}
                                                    </div>
                                                    {assignment.observation && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                                                            "{assignment.observation}"
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold mb-1">
                                                            {assignment.credits} cr
                                                        </Badge>
                                                        <div className="flex gap-2 text-[11px] text-muted-foreground font-medium">
                                                            <span title="Cours Magistral">CM: {assignment.cm}</span>
                                                            <span title="Travaux Dirigés">TD: {assignment.td}</span>
                                                            <span title="Travaux Pratiques">TP: {assignment.tp}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-2">
                                                        {/* Titulaire */}
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6 border border-gray-200 shadow-sm">
                                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                                                    {getInitials(assignment.holder)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium leading-none">{assignment.holder}</span>
                                                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Titulaire</span>
                                                            </div>
                                                        </div>
                                                        {/* Collaborateur */}
                                                        {assignment.collaborator && assignment.collaborator !== 'Aucun' && (
                                                            <div className="flex items-center gap-2 ml-4">
                                                                <Avatar className="h-5 w-5 border border-gray-200 shadow-sm">
                                                                    <AvatarFallback className="bg-gray-100 text-gray-600 text-[9px]">
                                                                        {getInitials(assignment.collaborator)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs text-muted-foreground leading-none">{assignment.collaborator}</span>
                                                                    <span className="text-[9px] text-gray-500">Collaborateur</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right align-middle">
                                                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {can.edit && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openModal('single', assignment)}
                                                                className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                                                title="Modifier"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {can.delete && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openDeleteModal(assignment)}
                                                                className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            
                            {/* Pagination */}
                            <div className="flex items-center justify-between border-t px-4 py-3 bg-gray-50/50 dark:bg-gray-900/30">
                                <div className="text-sm text-muted-foreground">
                                    Affichage de <span className="font-medium text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filteredAssignments.length)}</span> sur <span className="font-medium text-foreground">{filteredAssignments.length}</span> résultats
                                </div>
                                <Pagination className="justify-end w-auto mx-0">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                                                }}
                                                className={cn("rounded-full", currentPage === 1 && 'pointer-events-none opacity-50')}
                                            />
                                        </PaginationItem>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                            .map((page, index, array) => (
                                            <PaginationItem key={page}>
                                                {index > 0 && page - array[index - 1] > 1 && (
                                                    <span className="px-2 text-muted-foreground">...</span>
                                                )}
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setCurrentPage(page);
                                                    }}
                                                    isActive={page === currentPage}
                                                    className={cn("rounded-full h-8 w-8", page === currentPage && "bg-primary text-primary-foreground")}
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                                }}
                                                className={cn("rounded-full", currentPage === totalPages && 'pointer-events-none opacity-50')}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 shadow-inner">
                                <GraduationCap className="h-10 w-10 text-blue-500" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">Aucune attribution trouvée</h3>
                            <p className="text-muted-foreground mb-8 max-w-sm text-base">
                                {can.create ? "Commencez par assigner un cours à un enseignant pour structurer l'année académique." : 'Aucune donnée correspondante disponible.'}
                            </p>
                            {can.create && (
                                <Button onClick={() => openModal('single')} className="gap-2 rounded-full h-11 px-6 shadow-md hover:shadow-lg transition-shadow">
                                    <Plus size={18} />
                                    Créer une attribution
                                </Button>
                            )}
                        </div>
                    )}
                </Card>

                {/* Create/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col sm:max-w-3xl md:max-w-5xl p-0 border-0 shadow-2xl rounded-xl">
                        <DialogHeader className="bg-gray-50 dark:bg-gray-900 px-6 py-5 border-b">
                            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                                {isBulkMode
                                    ? "Ajout Multiple d'Attributions"
                                    : bulkAssignments[0]?.id
                                      ? 'Modifier Attribution'
                                      : 'Nouvelle Attribution'}
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 text-base">
                                {isBulkMode ? "Configurez plusieurs affectations pédagogiques simultanément." : "Définissez les détails de l'affectation pédagogique pour ce cours."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-950">
                            {errors.assignments && typeof errors.assignments === 'string' && (
                                <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 shadow-sm dark:bg-red-900/20">
                                    <h3 className="text-sm font-bold text-red-800 dark:text-red-200">Erreurs de validation</h3>
                                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errors.assignments}</p>
                                </div>
                            )}

                            <form id="assignment-form" onSubmit={handleSubmit} className="space-y-6">
                                {isBulkMode && (
                                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                                        <div className="flex items-center gap-2">
                                            <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                                                {bulkAssignments.length} {bulkAssignments.length > 1 ? 'Lignes à insérer' : 'Ligne à insérer'}
                                            </h3>
                                        </div>
                                        <Button type="button" onClick={handleAddAssignment} variant="outline" size="sm" className="bg-white hover:bg-gray-50 h-9">
                                            <Plus className="mr-1.5 h-4 w-4" />
                                            Ajouter une ligne
                                        </Button>
                                    </div>
                                )}

                                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-gray-100 dark:bg-gray-800/80">
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="w-[200px] font-semibold">Cours <span className="text-red-500">*</span></TableHead>
                                                    <TableHead className="w-[180px] font-semibold">Promotion <span className="text-red-500">*</span></TableHead>
                                                    <TableHead className="w-[180px] font-semibold">Titulaire <span className="text-red-500">*</span></TableHead>
                                                    <TableHead className="w-[180px] font-semibold">Collaborateur</TableHead>
                                                    <TableHead className="min-w-[150px] font-semibold">Observation</TableHead>
                                                    {isBulkMode && <TableHead className="w-[60px] text-center"></TableHead>}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {bulkAssignments.map((assignment, index) => (
                                                    <TableRow key={index} className="group hover:bg-white dark:hover:bg-gray-900 transition-colors">
                                                        <TableCell className="align-top pt-4">
                                                            <CourseSelector
                                                                courses={courses}
                                                                value={assignment.course_id}
                                                                onChange={(value) => handleAssignmentChange(index, 'course_id', value)}
                                                                error={getFieldError(index, 'course_id')}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="align-top pt-4">
                                                            <div className="flex flex-col gap-1">
                                                                <Select
                                                                    value={assignment.promotion_id}
                                                                    onValueChange={(value) => handleAssignmentChange(index, 'promotion_id', value)}
                                                                    disabled={!assignment.course_id}
                                                                >
                                                                    <SelectTrigger className={cn("bg-white dark:bg-gray-950", getFieldError(index, 'promotion_id') && "border-red-500")}>
                                                                        <SelectValue
                                                                            placeholder={
                                                                                assignment.course_id
                                                                                    ? 'Sélect. promotion'
                                                                                    : "Choisir cours d'abord"
                                                                            }
                                                                        />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {courses
                                                                            .find((c) => c.id.toString() === assignment.course_id)
                                                                            ?.promotions?.map((promo) => (
                                                                                <SelectItem key={promo.id} value={promo.id.toString()}>
                                                                                    {promo.name}
                                                                                </SelectItem>
                                                                            ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                {getFieldError(index, 'promotion_id') && (
                                                                    <p className="text-[10px] text-red-500 leading-tight">{getFieldError(index, 'promotion_id')}</p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="align-top pt-4">
                                                            <div className="flex flex-col gap-1">
                                                                <Select
                                                                    value={assignment.holder_id}
                                                                    onValueChange={(value) => handleAssignmentChange(index, 'holder_id', value)}
                                                                >
                                                                    <SelectTrigger className={cn("bg-white dark:bg-gray-950", getFieldError(index, 'holder_id') && "border-red-500")}>
                                                                        <SelectValue placeholder="Sélect. titulaire" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {teachers.map((teacher) => (
                                                                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                                                {teacher.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                {getFieldError(index, 'holder_id') && (
                                                                    <p className="text-[10px] text-red-500 leading-tight">{getFieldError(index, 'holder_id')}</p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="align-top pt-4">
                                                            <div className="flex flex-col gap-1">
                                                                <Select
                                                                    value={assignment.collaborator_id}
                                                                    onValueChange={(value) => handleAssignmentChange(index, 'collaborator_id', value)}
                                                                >
                                                                    <SelectTrigger className="bg-white dark:bg-gray-950">
                                                                        <SelectValue placeholder="Aucun" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none" className="text-muted-foreground italic">Aucun collaborateur</SelectItem>
                                                                        {getFilteredCollaborators(index).map((teacher) => (
                                                                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                                                {teacher.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                {getFieldError(index, 'collaborator_id') && (
                                                                    <p className="text-[10px] text-red-500 leading-tight">{getFieldError(index, 'collaborator_id')}</p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="align-top pt-4">
                                                            <div className="flex flex-col gap-1">
                                                                <Input
                                                                    className="bg-white dark:bg-gray-950 placeholder:italic"
                                                                    value={assignment.observation}
                                                                    onChange={(e) => handleAssignmentChange(index, 'observation', e.target.value)}
                                                                    placeholder="Note faculative..."
                                                                />
                                                                {getFieldError(index, 'observation') && (
                                                                    <p className="text-[10px] text-red-500 leading-tight">{getFieldError(index, 'observation')}</p>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        {isBulkMode && (
                                                            <TableCell className="align-top pt-4 text-center">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => handleRemoveAssignment(index)}
                                                                    disabled={bulkAssignments.length <= 1}
                                                                    title="Supprimer la ligne"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <DialogFooter className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t gap-3 sm:justify-between">
                            <div className="text-sm text-muted-foreground hidden sm:block">
                                Les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires.
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting} className="flex-1 sm:flex-none">
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    form="assignment-form"
                                    disabled={isSubmitting}
                                    className="flex-1 sm:flex-none min-w-[160px] gap-2 rounded-full shadow-md"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Enregistrement...</span>
                                        </>
                                    ) : bulkAssignments[0]?.id ? (
                                        <>
                                            <Edit className="h-4 w-4" />
                                            Mettre à jour
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            {isBulkMode ? 'Tout Enregistrer' : "Confirmer la création"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog
                    open={isDeleteModalOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsDeleteModalOpen(false);
                            setAssignmentToDelete(null);
                            setIsDeleting(false);
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-0 shadow-2xl rounded-xl">
                        <div className="bg-red-50 dark:bg-red-900/20 p-6 flex flex-col items-center text-center border-b border-red-100 dark:border-red-900/50">
                            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4 shadow-sm">
                                <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <DialogTitle className="text-2xl text-red-700 dark:text-red-400 font-bold mb-2">Suppression définitive</DialogTitle>
                            <DialogDescription className="text-red-900/70 dark:text-red-200/70 text-base">
                                Êtes-vous sûr de vouloir supprimer l'attribution de <strong className="text-red-800 dark:text-red-300">{assignmentToDelete?.holder}</strong> au cours <strong className="text-red-800 dark:text-red-300">{assignmentToDelete?.course}</strong> ?
                                <br/><br/>
                                Cette action est irréversible.
                            </DialogDescription>
                        </div>
                        <DialogFooter className="bg-white dark:bg-gray-950 px-6 py-4 gap-3 sm:justify-center">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setIsDeleting(false);
                                }}
                                disabled={isDeleting}
                                className="w-full sm:w-auto h-11"
                            >
                                Annuler
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDelete}
                                className="w-full sm:w-auto h-11 min-w-[140px] gap-2 shadow-md"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Suppression...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4" />
                                        Oui, supprimer
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Import Excel Modal */}
                <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                    <DialogContent className="sm:max-w-[550px] rounded-xl border-0 shadow-2xl p-0 overflow-hidden">
                        <DialogHeader className="bg-gray-50 dark:bg-gray-900 px-6 py-5 border-b">
                            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <Upload className="h-5 w-5" />
                                </div>
                                Importer des attributions
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 text-base">
                                Téléversez un fichier Excel (.xlsx, .xls) contenant la liste des attributions à traiter.
                            </DialogDescription>
                        </DialogHeader>
                        <form id="import-form" onSubmit={handleImportSubmit} className="p-6 bg-white dark:bg-gray-950">
                            <div className="space-y-4">
                                <Label className="text-base font-semibold">Fichier source <span className="text-red-500">*</span></Label>
                                <div
                                    className={cn(
                                        "cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-8 text-center flex flex-col items-center justify-center gap-4",
                                        importFile 
                                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-700" 
                                            : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-900"
                                    )}
                                    onClick={() => document.getElementById('import-file')?.click()}
                                >
                                    <input
                                        id="import-file"
                                        type="file"
                                        className="hidden"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setImportFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    {importFile ? (
                                        <>
                                            <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                                                <Check className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg text-emerald-800 dark:text-emerald-300">{importFile.name}</p>
                                                <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">{(importFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <Button type="button" variant="outline" className="mt-2 text-emerald-700 border-emerald-200 hover:bg-emerald-100" onClick={(e) => { e.stopPropagation(); setImportFile(null); }}>
                                                Changer de fichier
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-16 w-16 rounded-full bg-white dark:bg-gray-800 shadow-sm border flex items-center justify-center">
                                                <Download className="h-7 w-7 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-medium">Glissez votre fichier ici</p>
                                                <p className="text-sm text-gray-500 mt-1">Formats supportés: XLSX, XLS, CSV</p>
                                            </div>
                                            <Button type="button" variant="secondary" className="mt-2 rounded-full px-6 pointer-events-none">
                                                Parcourir les fichiers
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </form>
                        <DialogFooter className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t gap-3 sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)} className="h-11 px-6">
                                Annuler
                            </Button>
                            <Button type="submit" form="import-form" disabled={isImporting || !importFile} className="h-11 px-8 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                Lancer l'import
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
