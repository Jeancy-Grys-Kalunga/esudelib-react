import { Head, router, useForm } from '@inertiajs/react';
import { BookOpen, Edit, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

import { MultiSelect } from '@/components/multi-select'; // Import du composant MultiSelect
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import _ from 'lodash';

type UnitTeaching = {
    id: number;
    title: string;
    cm: number;
    tp: number;
    td: number;
    promotion: string;
    courses: string; // Changé de 'course' à 'courses' pour refléter plusieurs cours
    created_at: string;
    promotion_id?: number;
    course_ids?: number[]; // Tableau d'IDs de cours
};

type Promotion = {
    id: number;
    title: string;
};

type Course = {
    id: number;
    title: string;
};

type PageProps = {
    units: UnitTeaching[];
    promotions: Promotion[];
    courses: Course[];
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        access: boolean;
        import?: boolean;
    };
    filters?: {
        search?: string;
    };
    flash?: {
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    };
};

export default function UnitTeachingIndex({ units: allUnits, promotions, courses, can, flash, filters }: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUnit, setCurrentUnit] = useState<UnitTeaching | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState<UnitTeaching | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [filteredUnits, setFilteredUnits] = useState<UnitTeaching[]>(allUnits);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const { data, setData, post, put, errors, processing, reset } = useForm({
        title: '',
        cm: 0,
        tp: 0,
        td: 0,
        promotion_id: '',
        course_ids: [] as string[], // Tableau d'IDs de cours sous forme de string
    });

    const handleSearch = useMemo(() => {
        return _.debounce((term: string) => {
            if (!term) {
                setFilteredUnits(allUnits);
                setCurrentPage(1);
                return;
            }
            const results = allUnits.filter(
                (unit) =>
                    unit.title.toLowerCase().includes(term.toLowerCase()) ||
                    unit.promotion.toLowerCase().includes(term.toLowerCase()) ||
                    unit.courses.toLowerCase().includes(term.toLowerCase()),
            );
            setFilteredUnits(results);
            setCurrentPage(1);
        }, 300);
    }, [allUnits]);

    useEffect(() => {
        handleSearch(searchTerm);
        return () => handleSearch.cancel();
    }, [searchTerm, handleSearch]);

    const paginatedUnits = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUnits.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUnits, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);

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

    useEffect(() => {
        if (currentUnit) {
            setData({
                title: currentUnit.title,
                cm: currentUnit.cm,
                tp: currentUnit.tp,
                td: currentUnit.td,
                promotion_id: currentUnit.promotion_id?.toString() || '',
                course_ids: (currentUnit.course_ids || []).map(String), // Convertir en tableau de strings
            });
        } else {
            reset();
        }
    }, [currentUnit]);

    const openModal = (unit: UnitTeaching | null = null) => {
        if ((unit && !can.edit) || (!unit && !can.create)) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }
        setCurrentUnit(unit);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentUnit(null);
        reset();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (currentUnit) {
                await put(route('units-teachings.update', currentUnit.id), {
                    onSuccess: () => closeModal(),
                });
            } else {
                await post(route('units-teachings.store'), {
                    onSuccess: () => closeModal(),
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const openDeleteModal = (unit: UnitTeaching) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }
        setUnitToDelete(unit);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!unitToDelete) return;

        router.delete(route('units-teachings.destroy', unitToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setUnitToDelete(null);
            },
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilteredUnits(allUnits);
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
            <Head title="Gestion des Unités d'Enseignement" />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Unités d'Enseignement</h1>
                        <p className="text-muted-foreground">{filteredUnits.length} unités enregistrées</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {can.create && (
                            <Button onClick={() => openModal()} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Nouvelle Unité
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
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                placeholder="Rechercher une unité..."
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
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Liste des Unités</CardTitle>
                                <CardDescription>{filteredUnits.length} unités correspondant aux critères</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredUnits.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>Titre</TableHead>
                                                <TableHead>CM</TableHead>
                                                <TableHead>TP</TableHead>
                                                <TableHead>TD</TableHead>
                                                <TableHead>Promotion</TableHead>
                                                <TableHead>Cours Associés</TableHead> {/* Changé de "Cours" à "Cours Associés" */}
                                                <TableHead>Date de création</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedUnits.map((unit) => (
                                                <TableRow key={unit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell className="font-medium">{unit.title}</TableCell>
                                                    <TableCell>{unit.cm}h</TableCell>
                                                    <TableCell>{unit.tp}h</TableCell>
                                                    <TableCell>{unit.td}h</TableCell>
                                                    <TableCell>{unit.promotion}</TableCell>
                                                    <TableCell>{unit.courses}</TableCell> {/* Utilisation de courses (pluriel) */}
                                                    <TableCell>{unit.created_at}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => openModal(unit)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(unit)}
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
                                    <BookOpen className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium">Aucune unité trouvée</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer une nouvelle unité.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={() => openModal()} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter une unité
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <BookOpen className="h-5 w-5" />
                                {currentUnit ? 'Modifier Unité' : 'Nouvelle Unité'}
                            </DialogTitle>
                            <DialogDescription>
                                {currentUnit ? "Modifiez les informations de l'unité" : 'Remplissez les informations pour créer une nouvelle unité'}
                            </DialogDescription>
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
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Colonne Gauche */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="flex items-center gap-1">
                                            <BookOpen className="h-4 w-4" />
                                            Titre de l'unité *
                                        </Label>
                                        <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cm" className="flex items-center gap-1">
                                            <BookOpen className="h-4 w-4" />
                                            Heures CM *
                                        </Label>
                                        <Input
                                            id="cm"
                                            type="number"
                                            min="0"
                                            value={data.cm}
                                            onChange={(e) => setData('cm', parseInt(e.target.value) || 0)}
                                            required
                                        />
                                        {errors.cm && <p className="text-sm text-red-500">{errors.cm}</p>}
                                    </div>
                                </div>

                                {/* Colonne Droite */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="tp" className="flex items-center gap-1">
                                            <BookOpen className="h-4 w-4" />
                                            Heures TP *
                                        </Label>
                                        <Input
                                            id="tp"
                                            type="number"
                                            min="0"
                                            value={data.tp}
                                            onChange={(e) => setData('tp', parseInt(e.target.value) || 0)}
                                            required
                                        />
                                        {errors.tp && <p className="text-sm text-red-500">{errors.tp}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="td" className="flex items-center gap-1">
                                            <BookOpen className="h-4 w-4" />
                                            Heures TD *
                                        </Label>
                                        <Input
                                            id="td"
                                            type="number"
                                            min="0"
                                            value={data.td}
                                            onChange={(e) => setData('td', parseInt(e.target.value) || 0)}
                                            required
                                        />
                                        {errors.td && <p className="text-sm text-red-500">{errors.td}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1">
                                        <BookOpen className="h-4 w-4" />
                                        Promotion *
                                    </Label>
                                    <Select value={data.promotion_id} onValueChange={(value) => setData('promotion_id', value)} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez une promotion">
                                                {promotions.find((p) => p.id.toString() === data.promotion_id)?.title || 'Sélectionnez une promotion'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {promotions.map((promotion) => (
                                                <SelectItem key={promotion.id} value={promotion.id.toString()}>
                                                    {promotion.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.promotion_id && <p className="text-sm text-red-500">{errors.promotion_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1">
                                        <BookOpen className="h-4 w-4" />
                                        Cours Associés *
                                    </Label>

                                    {/* Remplacement du Select par MultiSelect */}
                                    <MultiSelect
                                        options={courses.map((course) => ({
                                            value: course.id.toString(),
                                            label: course.title,
                                        }))}
                                        selected={data.course_ids}
                                        onChange={(selected) => setData('course_ids', selected)}
                                        placeholder="Sélectionnez des cours..."
                                    />

                                    {errors.course_ids && <p className="text-sm text-red-500">{errors.course_ids}</p>}
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={closeModal} disabled={processing}>
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={processing} className="gap-2">
                                        {processing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : currentUnit ? (
                                            <>
                                                <Edit className="h-4 w-4" />
                                                Mettre à jour
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Créer l'unité
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
                                Êtes-vous sûr de vouloir supprimer l'unité "{unitToDelete?.title}" ? Cette action est irréversible.
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
