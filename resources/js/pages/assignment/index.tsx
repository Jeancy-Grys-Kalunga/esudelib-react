import { Head, router, useForm } from '@inertiajs/react';
import { BrainCircuit, Check, ChevronsUpDown, Download, Edit, GraduationCap, Loader2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
                    promotion_id: assignment.promotion_id.toString(),
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
            // On peut passer des paramètres de filtrage si nécessaire
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

    if (!can.access) {
        return (
            <AppLayout>
                <Head title="Accès refusé" />
                <div className="container mx-auto py-6 text-center">
                    <h1 className="text-2xl font-bold text-red-500">Accès refusé</h1>
                    <p className="mt-4">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Gestion des Attributions" />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestion des Attributions</h1>
                        <p className="text-muted-foreground">{filteredAssignments.length} attributions enregistrées</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {can.create && (
                            <Button onClick={() => openModal('single')} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Nouvelle Attribution
                            </Button>
                        )}
                        {can.edit && (
                            <Button onClick={() => openModal('bulk')} className="gap-2 bg-indigo-600 shadow-sm hover:bg-indigo-700">
                                <Plus size={16} />
                                Ajouter en masse
                            </Button>
                        )}
                        {can.edit && (
                            <>
                                <Button onClick={handleAutoAssign} className="gap-2 bg-emerald-600 shadow-sm hover:bg-emerald-700">
                                    <BrainCircuit size={16} />
                                    Auto Assign
                                </Button>
                                <Button onClick={exportAssignments} className="gap-2 shadow-sm">
                                    <Download size={16} />
                                    Exporter Excel
                                </Button>
                                <Button onClick={() => setIsImportModalOpen(true)} className="gap-2 shadow-sm">
                                    <Upload size={16} />
                                    Importer Excel
                                </Button>
                            </>
                        )}
                        <Button variant="outline" onClick={resetFilters} className="gap-2 shadow-sm">
                            <X size={16} />
                            Réinitialiser
                        </Button>
                    </div>
                </div>

                <Card className="shadow-sm">
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="relative">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    placeholder="Rechercher une attribution..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <Select value={currentAcademicYear} onValueChange={setCurrentAcademicYear}>
                                <SelectTrigger>
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
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent>
                        {filteredAssignments.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>Promotion</TableHead>
                                                <TableHead>Nom du cours</TableHead>
                                                <TableHead>Semestre</TableHead>
                                                <TableHead>CM</TableHead>
                                                <TableHead>TP</TableHead>
                                                <TableHead>TD</TableHead>
                                                <TableHead>Crédits</TableHead>
                                                <TableHead>Titulaire</TableHead>
                                                <TableHead>Collaborateur</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedAssignments.map((assignment) => (
                                                <TableRow key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell>{assignment.promotion}</TableCell>
                                                    <TableCell>{assignment.course}</TableCell>
                                                    <TableCell>{assignment.semester}</TableCell>
                                                    <TableCell>{assignment.cm}</TableCell>
                                                    <TableCell>{assignment.tp}</TableCell>
                                                    <TableCell>{assignment.td}</TableCell>
                                                    <TableCell>{assignment.credits}</TableCell>
                                                    <TableCell>{assignment.holder}</TableCell>
                                                    <TableCell>{assignment.collaborator || '-'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => openModal('single', assignment)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(assignment)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
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
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                                                }}
                                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setCurrentPage(page);
                                                    }}
                                                    isActive={page === currentPage}
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
                                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                    <GraduationCap className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium">Aucune attribution trouvée</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer une nouvelle attribution.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={() => openModal('single')} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter une attribution
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl md:max-w-4xl lg:max-w-6xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <GraduationCap className="h-5 w-5" />
                                {isBulkMode
                                    ? "Ajout Multiple d'Attributions"
                                    : bulkAssignments[0]?.id
                                      ? 'Modifier Attribution'
                                      : 'Nouvelle Attribution'}
                            </DialogTitle>
                            <DialogDescription>
                                {isBulkMode ? 'Ajoutez plusieurs attributions en une seule opération' : "Configurez les détails de l'attribution"}
                            </DialogDescription>
                        </DialogHeader>

                        {errors.assignments && typeof errors.assignments === 'string' && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 shadow dark:border-red-700 dark:bg-red-900/20">
                                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Erreurs de validation</h3>
                                <p className="mt-2 text-sm text-red-700 dark:text-red-300">{errors.assignments}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="rounded-lg bg-gray-50 p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-medium">
                                        {bulkAssignments.length} {bulkAssignments.length > 1 ? 'attributions' : 'attribution'}
                                    </h3>
                                    <Button type="button" onClick={handleAddAssignment} variant="outline" size="sm">
                                        <Plus className="mr-1 h-4 w-4" />
                                        Ajouter une ligne
                                    </Button>
                                </div>

                                <div className="overflow-hidden rounded-lg border">
                                    <Table>
                                        <TableHeader className="bg-gray-100">
                                            <TableRow>
                                                <TableHead className="w-[180px]">Cours *</TableHead>
                                                <TableHead className="w-[150px]">Promotion *</TableHead>
                                                <TableHead className="w-[150px]">Année académique *</TableHead>
                                                <TableHead className="w-[180px]">Titulaire *</TableHead>
                                                <TableHead className="w-[180px]">Collaborateur</TableHead>
                                                <TableHead>Observation</TableHead>
                                                <TableHead className="w-[50px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {bulkAssignments.map((assignment, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <CourseSelector
                                                            courses={courses}
                                                            value={assignment.course_id}
                                                            onChange={(value) => handleAssignmentChange(index, 'course_id', value)}
                                                            error={getFieldError(index, 'course_id')}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={assignment.promotion_id}
                                                            onValueChange={(value) => handleAssignmentChange(index, 'promotion_id', value)}
                                                            disabled={!assignment.course_id}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue
                                                                    placeholder={
                                                                        assignment.course_id
                                                                            ? 'Sélectionnez une promotion'
                                                                            : "Sélectionnez d'abord un cours"
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
                                                            <p className="mt-1 text-xs text-red-500">{getFieldError(index, 'promotion_id')}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={assignment.academic_year_id}
                                                            onValueChange={(value) => handleAssignmentChange(index, 'academic_year_id', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez une année" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {academic_years.map((year) => (
                                                                    <SelectItem key={year.id} value={year.id.toString()}>
                                                                        {year.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {getFieldError(index, 'academic_year_id') && (
                                                            <p className="mt-1 text-xs text-red-500">{getFieldError(index, 'academic_year_id')}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={assignment.holder_id}
                                                            onValueChange={(value) => handleAssignmentChange(index, 'holder_id', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez un titulaire" />
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
                                                            <p className="mt-1 text-xs text-red-500">{getFieldError(index, 'holder_id')}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={assignment.collaborator_id}
                                                            onValueChange={(value) => handleAssignmentChange(index, 'collaborator_id', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez un collaborateur" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Aucun collaborateur</SelectItem>
                                                                {getFilteredCollaborators(index).map((teacher) => (
                                                                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                                        {teacher.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {getFieldError(index, 'collaborator_id') && (
                                                            <p className="mt-1 text-xs text-red-500">{getFieldError(index, 'collaborator_id')}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={assignment.observation}
                                                            onChange={(e) => handleAssignmentChange(index, 'observation', e.target.value)}
                                                            placeholder="Observation"
                                                        />
                                                        {getFieldError(index, 'observation') && (
                                                            <p className="mt-1 text-xs text-red-500">{getFieldError(index, 'observation')}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => handleRemoveAssignment(index)}
                                                            disabled={bulkAssignments.length <= 1}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <div className="flex w-full justify-between">
                                    <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                                        Annuler
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="relative flex min-w-[180px] items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Traitement...</span>
                                            </>
                                        ) : bulkAssignments[0]?.id ? (
                                            <>
                                                <Edit className="h-4 w-4" />
                                                Mettre à jour
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                {isBulkMode ? 'Enregistrer les attributions' : "Créer l'attribution"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

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
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Confirmer la suppression</DialogTitle>
                            <DialogDescription>
                                Êtes-vous sûr de vouloir supprimer cette attribution ? Cette action est irréversible.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setIsDeleting(false);
                                }}
                                disabled={isDeleting}
                            >
                                Annuler
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDelete}
                                className="flex min-w-[120px] items-center justify-center gap-2"
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
                                        Supprimer
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal Importation Excel */}
                <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Upload className="h-5 w-5" />
                                Importer des attributions
                            </DialogTitle>
                            <DialogDescription>Téléversez un fichier Excel contenant la liste des attributions</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Fichier Excel *</Label>
                                <div
                                    className="cursor-pointer rounded-lg border-2 border-dashed bg-gray-50 p-6 text-center"
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
                                        <p className="font-medium">{importFile.name}</p>
                                    ) : (
                                        <>
                                            <Download className="mx-auto h-8 w-8 text-gray-400" />
                                            <p className="mt-2 font-medium">Glissez votre fichier ici</p>
                                            <p className="text-sm text-gray-500">Formats supportés: XLSX, XLS, CSV</p>
                                            <Button type="button" variant="outline" className="mt-2">
                                                Sélectionner un fichier
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={isImporting} className="gap-2">
                                    {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    Importer
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
