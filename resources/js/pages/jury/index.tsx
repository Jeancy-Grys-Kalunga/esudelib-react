import { Head, router, useForm } from '@inertiajs/react';
import { Edit, Loader2, Plus, Search, Trash2, X, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

type Promotion = {
    id: number;
    title: string;
};

type AcademicYear = {
    id: number;
    title: string;
};

type Teacher = {
    id: number;
    name: string;
};

interface Jury {
    id: number;
    president_id: number;
    president: string;
    secretary_id: number;
    secretary: string;
    member_id: number;
    member: string;
    observation: string | null;
    institution_id: number;
    institution: string;
    promotion_id: number;
    promotion: string;
    academic_year_id: number;
    academic_year: string;
}

type Institution = {
    id: number;
    name: string;
};

type JuryFormData = {
    id?: number;
    president_id: string;
    secretary_id: string;
    member_id: string;
    observation: string;
    academic_year_id: string;
    promotion_id: string;
};

type PageProps = {
    juries: Jury[];
    promotions: Promotion[];
    academic_years: AcademicYear[];
    institutions: Institution[];
    teachers: Teacher[];
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
        promotion?: string;
    };
};

export default function JuryManager({
    juries: allJuries,
    promotions,
    academic_years,
    institutions,
    teachers,
    can,
    flash,
    filters,
}: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [juryToDelete, setJuryToDelete] = useState<Jury | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [filteredJuries, setFilteredJuries] = useState<Jury[]>(allJuries);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [bulkJuries, setBulkJuries] = useState<JuryFormData[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [currentAcademicYear, setCurrentAcademicYear] = useState(filters?.academic_year || 'all');
    const [currentPromotion, setCurrentPromotion] = useState(filters?.promotion || 'all');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { post, errors, processing, reset, setData } = useForm({
        juries: [] as JuryFormData[],
    });

    // Filtrage combiné
    useEffect(() => {
        let results = [...allJuries];

        // Filtre par recherche
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(
                (jury) =>
                    jury.president.toLowerCase().includes(term) ||
                    jury.secretary.toLowerCase().includes(term) ||
                    jury.member.toLowerCase().includes(term) ||
                    jury.institution.toLowerCase().includes(term) ||
                    jury.promotion.toLowerCase().includes(term)
            );
        }

        // Filtre par année académique
        if (currentAcademicYear && currentAcademicYear !== 'all') {
            results = results.filter((j) => j.academic_year_id.toString() === currentAcademicYear);
        }

        // Filtre par promotion
        if (currentPromotion && currentPromotion !== 'all') {
            results = results.filter((j) => j.promotion_id.toString() === currentPromotion);
        }

        setFilteredJuries(results);
        setCurrentPage(1);
    }, [allJuries, searchTerm, currentAcademicYear, currentPromotion]);

    const paginatedJuries = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredJuries.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredJuries, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredJuries.length / itemsPerPage);

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

    const openModal = (mode: 'single' | 'bulk', jury?: Jury) => {
        if (mode === 'single' && !can.edit && !can.create) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }
        if (mode === 'bulk' && !can.edit) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }

        setIsBulkMode(mode === 'bulk');

        if (mode === 'single' && jury) {
            setBulkJuries([
                {
                    id: jury.id,
                    president_id: jury.president_id.toString(),
                    secretary_id: jury.secretary_id.toString(),
                    member_id: jury.member_id.toString(),
                    observation: jury.observation || '',
                    academic_year_id: jury.academic_year_id.toString(),
                    promotion_id: jury.promotion_id.toString(),
                },
            ]);
        } else {
            setBulkJuries([createEmptyJury()]);
        }

        setIsModalOpen(true);
    };

    const createEmptyJury = (): JuryFormData => ({
        president_id: teachers.length > 0 ? teachers[0].id.toString() : '',
        secretary_id: teachers.length > 0 ? teachers[0].id.toString() : '',
        member_id: teachers.length > 0 ? teachers[0].id.toString() : '',
        observation: '',
        academic_year_id: currentAcademicYear !== 'all' ? currentAcademicYear : academic_years.length > 0 ? academic_years[0].id.toString() : '',
        promotion_id: promotions.length > 0 ? promotions[0].id.toString() : '',
    });

    const closeModal = () => {
        setIsModalOpen(false);
        setBulkJuries([]);
        reset();
    };

    const handleAddJury = () => {
        setBulkJuries([...bulkJuries, createEmptyJury()]);
    };

    const handleRemoveJury = (index: number) => {
        if (bulkJuries.length > 1) {
            const newJuries = [...bulkJuries];
            newJuries.splice(index, 1);
            setBulkJuries(newJuries);
        } else {
            toast.warning('Vous devez conserver au moins un jury');
        }
    };

    const handleJuryChange = (index: number, field: keyof JuryFormData, value: string) => {
        const newJuries = [...bulkJuries];
        newJuries[index] = { ...newJuries[index], [field]: value };
        setBulkJuries(newJuries);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);

        const payload = {
            juries: bulkJuries.map((j) => ({
                ...j,
                academic_year_id: j.academic_year_id,
                promotion_id: j.promotion_id,
            })),
        };

        const url = isBulkMode ? route('juries.store.bulk') : route('juries.store');

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

    const openDeleteModal = (jury: Jury) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }
        setJuryToDelete(jury);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!juryToDelete) return;

        setIsDeleting(true);
        router.delete(route('juries.destroy', juryToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
            },
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setCurrentAcademicYear('all');
        setCurrentPromotion('all');
        router.get(route('juries.index'), {}, { preserveState: true });
    };

    const getFieldError = (index: number, field: string): string | null => {
        const key = `juries.${index}.${field}`;
        // @ts-ignore
        return errors[key] as string | null;
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
            <Head title="Gestion des Jurys" />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestion des Jurys</h1>
                        <p className="text-muted-foreground">{filteredJuries.length} jurys enregistrés</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {can.create && (
                            <Button onClick={() => openModal('single')} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Nouveau Jury
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
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="relative">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    placeholder="Rechercher un jury..."
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
                                            {year.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={currentPromotion} onValueChange={setCurrentPromotion}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Toutes les promotions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes les promotions</SelectItem>
                                    {promotions.map((promotion) => (
                                        <SelectItem key={promotion.id} value={promotion.id.toString()}>
                                            {promotion.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent>
                        {filteredJuries.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>Président</TableHead>
                                                <TableHead>Secrétaire</TableHead>
                                                <TableHead>Membre</TableHead>
                                                <TableHead>Institution</TableHead>
                                                <TableHead>Promotion</TableHead>
                                                <TableHead>Année académique</TableHead>
                                                <TableHead>Observation</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedJuries.map((jury) => (
                                                <TableRow key={jury.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell>{jury.president}</TableCell>
                                                    <TableCell>{jury.secretary}</TableCell>
                                                    <TableCell>{jury.member}</TableCell>
                                                    <TableCell>{jury.institution}</TableCell>
                                                    <TableCell>{jury.promotion}</TableCell>
                                                    <TableCell>{jury.academic_year}</TableCell>
                                                    <TableCell>{jury.observation || '-'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => openModal('single', jury)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(jury)}
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
                                    <Users className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium">Aucun jury trouvé</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer un nouveau jury.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={() => openModal('single')} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter un jury
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
                                <Users className="h-5 w-5" />
                                {isBulkMode
                                    ? "Ajout Multiple de Jurys"
                                    : bulkJuries[0]?.id
                                      ? 'Modifier Jury'
                                      : 'Nouveau Jury'}
                            </DialogTitle>
                            <DialogDescription>
                                {isBulkMode ? 'Ajoutez plusieurs jurys en une seule opération' : "Configurez les détails du jury"}
                            </DialogDescription>
                        </DialogHeader>

                        {typeof errors.juries === 'string' && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 shadow dark:border-red-700 dark:bg-red-900/20">
                                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Erreurs de validation</h3>
                                <p className="mt-2 text-sm text-red-700 dark:text-red-300">{errors.juries}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="rounded-lg bg-gray-50 p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-medium">
                                        {bulkJuries.length} {bulkJuries.length > 1 ? 'jurys' : 'jury'}
                                    </h3>
                                    <Button type="button" onClick={handleAddJury} variant="outline" size="sm">
                                        <Plus className="mr-1 h-4 w-4" />
                                        Ajouter une ligne
                                    </Button>
                                </div>

                                <div className="overflow-hidden rounded-lg border">
                                    <Table>
                                        <TableHeader className="bg-gray-100">
                                            <TableRow>
                                                <TableHead className="w-[180px]">Président *</TableHead>
                                                <TableHead className="w-[180px]">Secrétaire *</TableHead>
                                                <TableHead className="w-[180px]">Membre *</TableHead>
                                                <TableHead className="w-[150px]">Année académique *</TableHead>
                                                <TableHead className="w-[150px]">Promotion *</TableHead>
                                                <TableHead>Observation</TableHead>
                                                <TableHead className="w-[50px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {bulkJuries.map((jury, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Select
                                                            value={jury.president_id}
                                                            onValueChange={(value) => handleJuryChange(index, 'president_id', value)}
                                                        >
                                                            <SelectTrigger
                                                                className={getFieldError(index, 'president_id') ? 'border-red-500' : ''}
                                                            >
                                                                <SelectValue placeholder="Sélectionnez un président" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {teachers
                                                                    .filter((teacher) =>
                                                                        teacher.id.toString() !== jury.secretary_id &&
                                                                        teacher.id.toString() !== jury.member_id
                                                                    )
                                                                    .map((teacher) => (
                                                                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                                            {teacher.name}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {getFieldError(index, 'president_id') && (
                                                            <p className="mt-1 text-xs text-red-500">{getFieldError(index, 'president_id')}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={jury.secretary_id}
                                                            onValueChange={(value) => handleJuryChange(index, 'secretary_id', value)}
                                                        >
                                                            <SelectTrigger
                                                                className={getFieldError(index, 'secretary_id') ? 'border-red-500' : ''}
                                                            >
                                                                <SelectValue placeholder="Sélectionnez un secrétaire" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {teachers
                                                                    .filter((teacher) =>
                                                                        teacher.id.toString() !== jury.president_id &&
                                                                        teacher.id.toString() !== jury.member_id
                                                                    )
                                                                    .map((teacher) => (
                                                                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                                            {teacher.name}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {getFieldError(index, 'secretary_id') && (
                                                            <p className="mt-1 text-xs text-red-500">{getFieldError(index, 'secretary_id')}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={jury.member_id}
                                                            onValueChange={(value) => handleJuryChange(index, 'member_id', value)}
                                                        >
                                                            <SelectTrigger
                                                                className={getFieldError(index, 'member_id') ? 'border-red-500' : ''}
                                                            >
                                                                <SelectValue placeholder="Sélectionnez un membre" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {teachers
                                                                    .filter((teacher) =>
                                                                        teacher.id.toString() !== jury.president_id &&
                                                                        teacher.id.toString() !== jury.secretary_id
                                                                    )
                                                                    .map((teacher) => (
                                                                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                                            {teacher.name}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {getFieldError(index, 'member_id') && (
                                                            <p className="mt-1 text-xs text-red-500">{getFieldError(index, 'member_id')}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={jury.academic_year_id}
                                                            onValueChange={(value) => handleJuryChange(index, 'academic_year_id', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez une année" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {academic_years.map((year) => (
                                                                    <SelectItem key={year.id} value={year.id.toString()}>
                                                                        {year.title}
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
                                                            value={jury.promotion_id}
                                                            onValueChange={(value) => handleJuryChange(index, 'promotion_id', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Sélectionnez une promotion" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {promotions.map((promotion) => (
                                                                    <SelectItem key={promotion.id} value={promotion.id.toString()}>
                                                                        {promotion.title}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {getFieldError(index, 'promotion_id') && (
                                                            <p className="mt-1 text-xs text-red-500">{getFieldError(index, 'promotion_id')}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            value={jury.observation}
                                                            onChange={(e) => handleJuryChange(index, 'observation', e.target.value)}
                                                            placeholder="Observation (optionnel)"
                                                            className={getFieldError(index, 'observation') ? 'border-red-500' : ''}
                                                        />
                                                        {getFieldError(index, 'observation') && (
                                                            <p className="mt-1 text-xs text-red-500">{getFieldError(index, 'observation')}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => handleRemoveJury(index)}
                                                            className="h-8 w-8"
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

                            <DialogFooter>
                                <Button variant="outline" onClick={closeModal} type="button" disabled={processing}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={processing || isSubmitting}>
                                    {(processing || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isBulkMode ? "Enregistrer les jurys" : "Enregistrer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal de suppression */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmer la suppression</DialogTitle>
                            <DialogDescription>
                                Êtes-vous sûr de vouloir supprimer ce jury ? Cette action est irréversible.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div>
                                <p>
                                    <span className="font-medium">Président:</span> {juryToDelete?.president}
                                </p>
                                <p>
                                    <span className="font-medium">Secrétaire:</span> {juryToDelete?.secretary}
                                </p>
                                <p>
                                    <span className="font-medium">Membre:</span> {juryToDelete?.member}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
                                Annuler
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Supprimer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
