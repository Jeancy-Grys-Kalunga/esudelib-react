import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Download, Edit, Loader2, Plus, Search, Trash2, Upload, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import _ from 'lodash';

type Promotion = {
    id: number;
    title: string;
    institution: string;
    faculty: string;
    created_at: string;
    institution_id?: number;
    faculty_id?: number;
};

type Institution = {
    id: number;
    name: string;
};

type Faculty = {
    id: number;
    title: string;
};

type PageProps = {
    promotions: Promotion[];
    institutions: Institution[];
    faculties: Faculty[];
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

export default function PromotionIndex({ promotions: allPromotions, institutions, faculties, can, flash, filters }: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>(allPromotions);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedInstitutionId, setSelectedInstitutionId] = useState('');

    // Déterminer si l'utilisateur est Super Admin en utilisant les props globales auth
    const { props } = usePage<{ auth: { user: any } }>();
    const isSuperAdmin = props.auth?.user?.roles?.some((role: any) => role.name === 'Super Admin') || false;

    // Pré-remplir l'institution pour les non Super Admin
    useEffect(() => {
        if (!isSuperAdmin && props.auth?.user?.institutions && props.auth.user.institutions.length > 0) {
            setSelectedInstitutionId(props.auth.user.institutions[0].id.toString());
        }
    }, [isSuperAdmin, props.auth]);

    const { data, setData, post, put, errors, processing, reset } = useForm({
        title: '',
        institution_id: '',
        faculty_id: '',
    });

    const handleSearch = useMemo(() => {
        return _.debounce((term: string) => {
            if (!term) {
                setFilteredPromotions(allPromotions);
                setCurrentPage(1);
                return;
            }
            const results = allPromotions.filter(
                (promotion) =>
                    promotion.title.toLowerCase().includes(term.toLowerCase()) ||
                    promotion.institution.toLowerCase().includes(term.toLowerCase()) ||
                    promotion.faculty.toLowerCase().includes(term.toLowerCase()),
            );
            setFilteredPromotions(results);
            setCurrentPage(1);
        }, 300);
    }, [allPromotions]);

    useEffect(() => {
        handleSearch(searchTerm);
        return () => handleSearch.cancel();
    }, [searchTerm, handleSearch]);

    const paginatedPromotions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPromotions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPromotions, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);

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
        if (currentPromotion) {
            setData({
                title: currentPromotion.title,
                institution_id: currentPromotion.institution_id?.toString() || '',
                faculty_id: currentPromotion.faculty_id?.toString() || '',
            });
        } else {
            reset();
        }
    }, [currentPromotion]);

    const openModal = (promotion: Promotion | null = null) => {
        if ((promotion && !can.edit) || (!promotion && !can.create)) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }
        setCurrentPromotion(promotion);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentPromotion(null);
        reset();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (currentPromotion) {
                await put(route('promotions.update', currentPromotion.id), {
                    onSuccess: () => closeModal(),
                });
            } else {
                await post(route('promotions.store'), {
                    onSuccess: () => closeModal(),
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const openDeleteModal = (promotion: Promotion) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }
        setPromotionToDelete(promotion);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!promotionToDelete) return;

        router.delete(route('promotions.destroy', promotionToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setPromotionToDelete(null);
            },
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilteredPromotions(allPromotions);
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (value: string) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

    const openImportModal = () => {
        if (!can.import) {
            toast.error("Vous n'avez pas la permission d'importer");
            return;
        }
        setIsImportModalOpen(true);
    };

    const closeImportModal = () => {
        setIsImportModalOpen(false);
        setFile(null);
        if (isSuperAdmin) {
            setSelectedInstitutionId('');
        }
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast.error('Veuillez sélectionner un fichier');
            return;
        }

        if (!selectedInstitutionId) {
            toast.error('Veuillez sélectionner une institution');
            return;
        }

        setIsImporting(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('institution_id', selectedInstitutionId);

        router.post(route('promotions.import'), formData, {
            forceFormData: true,
            onSuccess: () => {
                closeImportModal();
                setIsImporting(false);
                setFile(null);
            },
            onError: (errors) => {
                setIsImporting(false);
                console.error('Import errors:', errors);
                if (errors.file) {
                    toast.error(errors.file);
                }
                if (errors.institution_id) {
                    toast.error(errors.institution_id);
                }
            },
        });
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
            <Head title="Gestion des Promotions" />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestion des Promotions</h1>
                        <p className="text-muted-foreground">{filteredPromotions.length} promotions enregistrées</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {can.create && (
                            <Button onClick={() => openModal()} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Nouvelle Promotion
                            </Button>
                        )}
                        {can.import && (
                            <Button onClick={openImportModal} variant="outline" className="gap-2 shadow-sm">
                                <Upload size={16} />
                                Importer Excel
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
                                placeholder="Rechercher une promotion..."
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
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Liste des Promotions</CardTitle>
                                <CardDescription>{filteredPromotions.length} promotions correspondant aux critères</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="items-per-page" className="text-muted-foreground text-sm font-normal whitespace-nowrap">
                                    Afficher:
                                </Label>
                                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                                    <SelectTrigger id="items-per-page" className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="50">50 par page</SelectItem>
                                        <SelectItem value="100">100 par page</SelectItem>
                                        <SelectItem value="500">500 par page</SelectItem>
                                        <SelectItem value="1000">1000 par page</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredPromotions.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>Nom</TableHead>
                                                <TableHead>Institution</TableHead>
                                                <TableHead>Faculté</TableHead>
                                                <TableHead>Date de création</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedPromotions.map((promotion) => (
                                                <TableRow key={promotion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell className="font-medium">{promotion.title}</TableCell>
                                                    <TableCell>{promotion.institution}</TableCell>
                                                    <TableCell>{promotion.faculty}</TableCell>
                                                    <TableCell>{promotion.created_at}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => openModal(promotion)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(promotion)}
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
                                <h3 className="mb-2 text-lg font-medium">Aucune promotion trouvée</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer une nouvelle promotion.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={() => openModal()} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter une promotion
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
                                {currentPromotion ? 'Modifier Promotion' : 'Nouvelle Promotion'}
                            </DialogTitle>
                            <DialogDescription>
                                {currentPromotion
                                    ? 'Modifiez les informations de la promotion'
                                    : 'Remplissez les informations pour créer une nouvelle promotion'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Colonne Gauche */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Nom de la promotion *</Label>
                                        <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Institution *</Label>
                                        <Select value={data.institution_id} onValueChange={(value) => setData('institution_id', value)} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionnez une institution">
                                                    {institutions.find((i) => i.id.toString() === data.institution_id)?.name ||
                                                        'Sélectionnez une institution'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {institutions.map((institution) => (
                                                    <SelectItem key={institution.id} value={institution.id.toString()}>
                                                        {institution.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.institution_id && <p className="text-sm text-red-500">{errors.institution_id}</p>}
                                    </div>
                                </div>

                                {/* Colonne Droite */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Faculté *</Label>
                                        <Select value={data.faculty_id} onValueChange={(value) => setData('faculty_id', value)} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionnez une faculté">
                                                    {faculties.find((f) => f.id.toString() === data.faculty_id)?.title || 'Sélectionnez une faculté'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {faculties.map((faculty) => (
                                                    <SelectItem key={faculty.id} value={faculty.id.toString()}>
                                                        {faculty.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.faculty_id && <p className="text-sm text-red-500">{errors.faculty_id}</p>}
                                    </div>
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
                                        ) : currentPromotion ? (
                                            <>
                                                <Edit className="h-4 w-4" />
                                                Mettre à jour
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Créer la promotion
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
                                Êtes-vous sûr de vouloir supprimer la promotion "{promotionToDelete?.title}" ? Cette action est irréversible.
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

                {/* Modal Importation Excel */}
                <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Upload className="h-5 w-5" />
                                Importer des promotions
                            </DialogTitle>
                            <DialogDescription>Téléversez un fichier Excel contenant la liste des promotions</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Institution *</Label>
                                    <Select value={selectedInstitutionId} onValueChange={setSelectedInstitutionId} disabled={!isSuperAdmin} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez une institution">
                                                {institutions.find((i) => i.id.toString() === selectedInstitutionId)?.name ||
                                                    'Sélectionnez une institution'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {institutions.map((institution) => (
                                                <SelectItem key={institution.id} value={institution.id.toString()}>
                                                    {institution.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!isSuperAdmin && (
                                        <p className="text-muted-foreground text-xs">
                                            L'institution est automatiquement sélectionnée selon votre compte
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Fichier Excel *</Label>
                                    <div
                                        className="cursor-pointer rounded-lg border-2 border-dashed bg-gray-50 p-6 text-center dark:bg-gray-800"
                                        onClick={() => document.getElementById('file-upload-promotion')?.click()}
                                    >
                                        <input
                                            id="file-upload-promotion"
                                            type="file"
                                            className="hidden"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    setFile(e.target.files[0]);
                                                }
                                            }}
                                        />
                                        {file ? (
                                            <p className="font-medium">{file.name}</p>
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
                                    <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-950">
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Format attendu :</p>
                                        <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                                            Le fichier doit contenir une colonne "Intitulé Promotion" avec le format :{' '}
                                            <strong>BAC1 INFORMATIQUE</strong>, <strong>BAC2 MÉDECINE</strong>, etc.
                                        </p>
                                        <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                                            Les facultés seront créées automatiquement si elles n'existent pas.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeImportModal}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={isImporting || !file || !selectedInstitutionId} className="gap-2">
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
