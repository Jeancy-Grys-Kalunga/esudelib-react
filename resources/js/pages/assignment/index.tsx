import { Head, router, useForm } from '@inertiajs/react';
import { Edit, GraduationCap, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import _ from 'lodash';

type TeachingUnit = {
    id: number;
    name: string; // On garde name comme alias
};

type AcademicYear = {
    id: number;
    name: string; // On garde name comme alias
};

interface Assignment {
    id: number;
    holder_id: number;
    holder: string;
    collaborator_id: number | null;
    collaborator: string;
    teaching_unit_id: number;
    teaching_unit: string;
    academic_year_id: number;
    academic_year: string;
    institution_id: number;
    institution: string;
    observation: string | null;
}

interface Option {
    id: number;
    name: string;
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
    institution_id: string;
    teaching_unit_id: string;
    academic_year_id: string;
    holder_id: string;
    collaborator_id: string;
    observation: string;
};

type PageProps = {
    assignments: Assignment[];
    teachers: Teacher[];
    teaching_units: TeachingUnit[];
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
    };
};

export default function AssignmentIndex({
    assignments: allAssignments,
    teachers,
    teaching_units,
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
    const [currentInstitution, setCurrentInstitution] = useState<string>('');
    const [currentAcademicYear, setCurrentAcademicYear] = useState<string>('');

    const { post, errors, processing, reset } = useForm({
        assignments: [] as AssignmentFormData[],
    });

    const handleSearch = useMemo(() => {
        return _.debounce((term: string) => {
            if (!term) {
                setFilteredAssignments(allAssignments);
                setCurrentPage(1);
                return;
            }
            const results = allAssignments.filter(
                (assignment) =>
                    assignment.holder.toLowerCase().includes(term.toLowerCase()) ||
                    (assignment.collaborator && assignment.collaborator.toLowerCase().includes(term.toLowerCase())) ||
                    assignment.teaching_unit.toLowerCase().includes(term.toLowerCase()) ||
                    assignment.institution.toLowerCase().includes(term.toLowerCase()),
            );
            setFilteredAssignments(results);
            setCurrentPage(1);
        }, 300);
    }, [allAssignments]);

    useEffect(() => {
        handleSearch(searchTerm);
        return () => handleSearch.cancel();
    }, [searchTerm, handleSearch]);

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
            // Mode édition d'une seule attribution
            setBulkAssignments([
                {
                    id: assignment.id,
                    institution_id: assignment.institution_id.toString(),
                    teaching_unit_id: teaching_units.find((unit) => unit.name === assignment.teaching_unit)?.id.toString() || '',
                    academic_year_id: academic_years.find((year) => year.name === assignment.academic_year)?.id.toString() || '',
                    holder_id: assignment.holder_id.toString(),
                    collaborator_id: assignment.collaborator_id?.toString() || '',
                    observation: assignment.observation || '',
                },
            ]);
        } else if (mode === 'bulk') {
            // Mode création en masse - initialiser avec une ligne vide
            setBulkAssignments([createEmptyAssignment()]);
        } else {
            // Mode création d'une seule attribution
            setBulkAssignments([createEmptyAssignment()]);
        }

        setIsModalOpen(true);
    };

    const createEmptyAssignment = (): AssignmentFormData => ({
        institution_id: currentInstitution || (institutions.length > 0 ? institutions[0].id.toString() : ''),
        teaching_unit_id: teaching_units.length > 0 ? teaching_units[0].id.toString() : '',
        academic_year_id: currentAcademicYear || (academic_years.length > 0 ? academic_years[0].id.toString() : ''),
        holder_id: teachers.length > 0 ? teachers[0].id.toString() : '',
        collaborator_id: '',
        observation: '',
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
        setBulkAssignments(newAssignments);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Préparer les données dans un FormData d'Inertia
        const formData = new FormData();
        bulkAssignments.forEach((assignment, idx) => {
            Object.entries(assignment).forEach(([key, value]) => {
                // Pour le collaborateur, si "none" ou vide, on envoie null
                if (key === 'collaborator_id' && (value === 'none' || value === '')) {
                    formData.append(`assignments[${idx}][${key}]`, '');
                } else {
                    formData.append(`assignments[${idx}][${key}]`, value != null ? String(value) : '');
                }
            });
        });

        try {
            await post(route('assignments.bulk'), {
                data: formData,
                forceFormData: true,
                onSuccess: () => {
                    closeModal();
                    toast.success(isBulkMode ? 'Attributions enregistrées avec succès' : 'Attribution enregistrée avec succès');
                },
            });
        } catch (error) {
            console.error('Error submitting form:', error);
        }
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

        router.delete(route('assignments.destroy', assignmentToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setAssignmentToDelete(null);
            },
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilteredAssignments(allAssignments);
        setCurrentPage(1);
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
                        <Button variant="outline" onClick={resetFilters} className="gap-2 shadow-sm">
                            <X size={16} />
                            Réinitialiser
                        </Button>
                    </div>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle>Recherche</CardTitle>
                    </CardHeader>
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
                            <div className="grid grid-cols-2 gap-3">
                                <Select value={currentInstitution} onValueChange={setCurrentInstitution}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrer par institution" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes les institutions</SelectItem> {/* Corrigé */}
                                        {institutions.map((institution) => (
                                            <SelectItem key={institution.id} value={institution.id.toString()}>
                                                {institution.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={currentAcademicYear} onValueChange={setCurrentAcademicYear}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrer par année" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes les années</SelectItem> {/* Corrigé */}
                                        {academic_years.map((year) => (
                                            <SelectItem key={year.id} value={year.id.toString()}>
                                                {year.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Liste des Attributions</CardTitle>
                                <CardDescription>{filteredAssignments.length} attributions correspondant aux critères</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredAssignments.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>Institution</TableHead>
                                                <TableHead>Titulaire</TableHead>
                                                <TableHead>Collaborateur</TableHead>
                                                <TableHead>Unité d'enseignement</TableHead>
                                                <TableHead>Année académique</TableHead>
                                                <TableHead>Observation</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedAssignments.map((assignment) => (
                                                <TableRow key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell>{assignment.institution}</TableCell>
                                                    <TableCell>{assignment.holder}</TableCell>
                                                    <TableCell>{assignment.collaborator || '-'}</TableCell>
                                                    <TableCell>{assignment.teaching_unit}</TableCell>
                                                    <TableCell>{assignment.academic_year}</TableCell>
                                                    <TableCell>{assignment.observation || '-'}</TableCell>
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
                    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <GraduationCap className="h-5 w-5" />
                                {isBulkMode
                                    ? "Ajout Multiple d'Attributions"
                                    : bulkAssignments[0]?.id
                                      ? 'Modifier Attribution'
                                      : 'Nouvelle Attribution'}
                            </DialogTitle>
                        </DialogHeader>

                        {Object.keys(errors).length > 0 && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 shadow dark:border-red-700 dark:bg-red-900/20">
                                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Erreurs de validation</h3>
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                    {Object.entries(errors).map(([key, error]) => (
                                        <li key={key} className="text-sm text-red-700 dark:text-red-300">
                                            {error}
                                        </li>
                                    ))}
                                </ul>
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

                                <div className="grid grid-cols-1 gap-4">
                                    {bulkAssignments.map((assignment, index) => (
                                        <div key={index} className="relative rounded-lg border bg-white p-4">
                                            {bulkAssignments.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-6 w-6"
                                                    onClick={() => handleRemoveAssignment(index)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="space-y-3">
                                                    <div className="space-y-2">
                                                        <Label>Institution *</Label>
                                                        <Select
                                                            value={assignment.institution_id}
                                                            onValueChange={(value) => handleAssignmentChange(index, 'institution_id', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez une institution" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {institutions
                                                                    .filter((inst) => inst.id != null)
                                                                    .map((institution) => (
                                                                        <SelectItem
                                                                            key={institution.id}
                                                                            value={institution.id.toString()}
                                                                            disabled={!institution.id}
                                                                        >
                                                                            {institution.name}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {Array.isArray((errors as any).assignments) &&
                                                            (errors as any).assignments[index]?.institution_id && (
                                                                <p className="text-sm text-red-500">
                                                                    {(errors as any).assignments[index].institution_id}
                                                                </p>
                                                            )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Unité d'enseignement *</Label>
                                                        <Select
                                                            value={assignment.teaching_unit_id}
                                                            onValueChange={(value) => handleAssignmentChange(index, 'teaching_unit_id', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez une unité" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {teaching_units
                                                                    .filter((unit) => unit.id != null)
                                                                    .map((unit) => (
                                                                        <SelectItem key={unit.id} value={unit.id.toString()} disabled={!unit.id}>
                                                                            {unit.name}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {Array.isArray((errors as any).assignments) &&
                                                            (errors as any).assignments[index]?.teaching_unit_id && (
                                                                <p className="text-sm text-red-500">
                                                                    {(errors as any).assignments[index].teaching_unit_id}
                                                                </p>
                                                            )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Année académique *</Label>
                                                        <Select
                                                            value={assignment.academic_year_id}
                                                            onValueChange={(value) => handleAssignmentChange(index, 'academic_year_id', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez une année" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {academic_years
                                                                    .filter((year) => year.id != null)
                                                                    .map((year) => (
                                                                        <SelectItem key={year.id} value={year.id.toString()} disabled={!year.id}>
                                                                            {year.name}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {Array.isArray((errors as any).assignments) &&
                                                            (errors as any).assignments[index]?.academic_year_id && (
                                                                <p className="text-sm text-red-500">
                                                                    {(errors as any).assignments[index].academic_year_id}
                                                                </p>
                                                            )}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="space-y-2">
                                                        <Label>Titulaire *</Label>
                                                        <Select
                                                            value={assignment.holder_id}
                                                            onValueChange={(value) => handleAssignmentChange(index, 'holder_id', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez un titulaire" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {teachers
                                                                    .filter((teacher) => teacher.id != null)
                                                                    .map((teacher) => (
                                                                        <SelectItem
                                                                            key={teacher.id}
                                                                            value={teacher.id.toString()}
                                                                            disabled={!teacher.id}
                                                                        >
                                                                            {teacher.name}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {Array.isArray((errors as any).assignments) &&
                                                            (errors as any).assignments[index]?.holder_id && (
                                                                <p className="text-sm text-red-500">{(errors as any).assignments[index].holder_id}</p>
                                                            )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Collaborateur</Label>
                                                        <Select
                                                            value={assignment.collaborator_id}
                                                            onValueChange={(value) => handleAssignmentChange(index, 'collaborator_id', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez un collaborateur" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Aucun collaborateur</SelectItem>
                                                                {teachers
                                                                    .filter((teacher) => teacher.id != null)
                                                                    .map((teacher) => (
                                                                        <SelectItem
                                                                            key={teacher.id}
                                                                            value={teacher.id.toString()}
                                                                            disabled={!teacher.id}
                                                                        >
                                                                            {teacher.name}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {Array.isArray((errors as any).assignments) &&
                                                            (errors as any).assignments[index]?.collaborator_id && (
                                                                <p className="text-sm text-red-500">
                                                                    {(errors as any).assignments[index].collaborator_id}
                                                                </p>
                                                            )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Observation</Label>
                                                        <Input
                                                            value={assignment.observation}
                                                            onChange={(e) => handleAssignmentChange(index, 'observation', e.target.value)}
                                                        />
                                                        {Array.isArray((errors as any).assignments) &&
                                                            (errors as any).assignments[index]?.observation && (
                                                                <p className="text-sm text-red-500">
                                                                    {(errors as any).assignments[index].observation}
                                                                </p>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <div className="flex w-full justify-between">
                                    <Button type="button" variant="outline" onClick={closeModal} disabled={processing}>
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={processing} className="gap-2">
                                        {processing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
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
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Confirmer la suppression</DialogTitle>
                            <DialogDescription>
                                Êtes-vous sûr de vouloir supprimer cette attribution ? Cette action est irréversible.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete} className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
