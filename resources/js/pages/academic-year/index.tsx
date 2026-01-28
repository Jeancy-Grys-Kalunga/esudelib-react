import { Head, router, useForm } from '@inertiajs/react';
import _ from 'lodash';
import { Edit, Loader2, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

type AcademicYear = {
    id: number;
    title: string;
    created_at: string;
};

type PageProps = {
    academicYears: AcademicYear[];
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        access: boolean;
    };
    filters?: {
        search?: string;
    };
    flash?: {
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    };
};

export default function AcademicYearIndex({ academicYears: allAcademicYears, can, flash, filters }: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [academicYearToDelete, setAcademicYearToDelete] = useState<AcademicYear | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [filteredAcademicYears, setFilteredAcademicYears] = useState<AcademicYear[]>(allAcademicYears);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const { data, setData, post, put, errors, processing, reset } = useForm({
        title: '',
    });

    const handleSearch = useMemo(() => {
        return _.debounce((term: string) => {
            if (!term) {
                setFilteredAcademicYears(allAcademicYears);
                setCurrentPage(1);
                return;
            }
            const results = allAcademicYears.filter((academicYear) => academicYear.title.toLowerCase().includes(term.toLowerCase()));
            setFilteredAcademicYears(results);
            setCurrentPage(1);
        }, 300);
    }, [allAcademicYears]);

    useEffect(() => {
        handleSearch(searchTerm);
        return () => handleSearch.cancel();
    }, [searchTerm, handleSearch]);

    const paginatedAcademicYears = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAcademicYears.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAcademicYears, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAcademicYears.length / itemsPerPage);

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
        if (currentAcademicYear) {
            setData({
                title: currentAcademicYear.title,
            });
        } else {
            reset();
        }
    }, [currentAcademicYear]);

    const openModal = (academicYear: AcademicYear | null = null) => {
        if ((academicYear && !can.edit) || (!academicYear && !can.create)) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }
        setCurrentAcademicYear(academicYear);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentAcademicYear(null);
        reset();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (currentAcademicYear) {
                await put(route('academics.update', currentAcademicYear.id), {
                    onSuccess: () => closeModal(),
                });
            } else {
                await post(route('academics.store'), {
                    onSuccess: () => closeModal(),
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const openDeleteModal = (academicYear: AcademicYear) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }
        setAcademicYearToDelete(academicYear);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!academicYearToDelete) return;

        router.delete(route('academics.destroy', academicYearToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setAcademicYearToDelete(null);
            },
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilteredAcademicYears(allAcademicYears);
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
            <Head title="Gestion des Années Académiques" />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestion des Années Académiques</h1>
                        <p className="text-muted-foreground">{filteredAcademicYears.length} années enregistrées</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {can.create && (
                            <Button onClick={() => openModal()} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Nouvelle Année Académique
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
                                placeholder="Rechercher une année..."
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
                                <CardTitle>Liste des Années Académiques</CardTitle>
                                <CardDescription>{filteredAcademicYears.length} années correspondant aux critères</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredAcademicYears.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>Intitulé</TableHead>
                                                <TableHead>Date de création</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedAcademicYears.map((academicYear) => (
                                                <TableRow key={academicYear.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell className="font-medium">{academicYear.title}</TableCell>
                                                    <TableCell>{new Date(academicYear.created_at).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => openModal(academicYear)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(academicYear)}
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
                                <h3 className="mb-2 text-lg font-medium">Aucune année académique trouvée</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer une nouvelle année académique.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={() => openModal()} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter une année
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                {currentAcademicYear ? 'Modifier Année Académique' : 'Nouvelle Année Académique'}
                            </DialogTitle>
                            <DialogDescription>
                                {currentAcademicYear ? "Modifiez les informations de l'année académique" : "Renseignez l'intitulé (ex: 2023-2024)"}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Intitulé *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Ex: 2023-2024"
                                    required
                                />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>

                            <DialogFooter className="mt-4">
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={closeModal} disabled={processing}>
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={processing} className="gap-2">
                                        {processing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : currentAcademicYear ? (
                                            <>
                                                <Edit className="h-4 w-4" />
                                                Mettre à jour
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Créer
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
                                Êtes-vous sûr de vouloir supprimer l'année académique "{academicYearToDelete?.title}" ? Cette action est irréversible.
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
