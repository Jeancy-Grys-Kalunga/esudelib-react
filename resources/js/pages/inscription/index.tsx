import { Head, router, useForm } from '@inertiajs/react';
import { BookOpen, Calendar, Download, Edit, Loader2, Plus, Search, Trash2, Upload, User, X } from 'lucide-react';
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

type Inscription = {
    id: number;
    student_name: string;
    student_matricule: string;
    academic_year: string;
    institution: string;
    promotion: string;
    created_at: string;
};

type Institution = {
    id: string;
    name: string;
};

type AcademicYear = {
    id: string;
    title: string;
};

type Promotion = {
    id: string;
    title: string;
};

type PageProps = {
    inscriptions: Inscription[];
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        import: boolean;
        access: boolean;
    };
    flash?: {
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    };
    institutions: Institution[];
    academicYears: AcademicYear[];
    promotions: Promotion[];
};

export default function InscriptionIndex({ inscriptions: allInscriptions, can, flash, institutions, academicYears, promotions }: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [inscriptionToDelete, setInscriptionToDelete] = useState<Inscription | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredInscriptions, setFilteredInscriptions] = useState<Inscription[]>(allInscriptions);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const { data, setData, post, errors, processing, reset } = useForm({
        name: '',
        gendre: 'Masculin',
        date_of_birth: '',
        phone: '',
        institution_id: '',
        academic_year_id: '',
        promotion_id: '',
    });

    const importForm = useForm<{
        file: File | null;
        academic_year_id: string;
        institution_id: string;
        promotion_id: string;
    }>({
        file: null,
        academic_year_id: '',
        institution_id: '',
        promotion_id: '',
    });

    useEffect(() => {
        if (!searchTerm) {
            setFilteredInscriptions(allInscriptions);
            setCurrentPage(1);
            return;
        }
        
        const results = allInscriptions.filter(
            (ins) =>
                ins.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ins.student_matricule.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        setFilteredInscriptions(results);
        setCurrentPage(1);
    }, [searchTerm, allInscriptions]);

    const paginatedInscriptions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredInscriptions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredInscriptions, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredInscriptions.length / itemsPerPage);

    useEffect(() => {
        if (flash?.message) {
            toast[flash.type || 'info'](flash.message);
        }
    }, [flash]);

    const openModal = () => {
        if (!can.create) {
            toast.error("Permission refusée");
            return;
        }
        setIsModalOpen(true);
    };

    const openImportModal = () => {
        if (!can.import) {
            toast.error("Permission refusée");
            return;
        }
        setIsImportModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const closeImportModal = () => {
        setIsImportModalOpen(false);
        importForm.reset();
        setFile(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('subscriptions.store'), {
            onSuccess: () => closeModal(),
        });
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsImporting(true);

        importForm.post(route('subscriptions.import'), {
            onSuccess: () => {
                closeImportModal();
                setIsImporting(false);
            },
            onError: () => setIsImporting(false),
        });
    };

    const openDeleteModal = (inscription: Inscription) => {
        if (!can.delete) {
            toast.error("Permission refusée");
            return;
        }
        setInscriptionToDelete(inscription);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!inscriptionToDelete) return;

        router.delete(route('subscriptions.destroy', inscriptionToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setInscriptionToDelete(null);
            },
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilteredInscriptions(allInscriptions);
        setCurrentPage(1);
    };

    if (!can.access) {
        return (
            <AppLayout>
                <Head title="Accès refusé" />
                <div className="container mx-auto py-6 text-center">
                    <h1 className="text-2xl font-bold text-red-500">Accès refusé</h1>
                    <p className="mt-4">Permissions insuffisantes pour accéder à cette page.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Gestion des Inscriptions" />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestion des Inscriptions</h1>
                        <p className="text-muted-foreground">{allInscriptions.length} inscriptions enregistrées</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {can.create && (
                            <Button onClick={openModal} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Nouvelle Inscription
                            </Button>
                        )}
                        {can.import && (
                            <Button onClick={openImportModal} className="gap-2 shadow-sm">
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
                                placeholder="Rechercher une inscription..."
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
                                <CardTitle>Liste des Inscriptions</CardTitle>
                                <CardDescription>{filteredInscriptions.length} inscriptions correspondantes</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredInscriptions.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>Matricule</TableHead>
                                                <TableHead>Étudiant</TableHead>
                                                <TableHead>Année Académique</TableHead>
                                                <TableHead>Institution</TableHead>
                                                <TableHead>Promotion</TableHead>
                                                <TableHead>Date d'inscription</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedInscriptions.map((ins) => (
                                                <TableRow key={ins.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell className="font-medium">{ins.student_matricule}</TableCell>
                                                    <TableCell>{ins.student_name}</TableCell>
                                                    <TableCell>{ins.academic_year}</TableCell>
                                                    <TableCell>{ins.institution}</TableCell>
                                                    <TableCell>{ins.promotion}</TableCell>
                                                    <TableCell>{ins.created_at}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={openModal}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(ins)}
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
                                                onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    onClick={() => setCurrentPage(page)}
                                                    isActive={page === currentPage}
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
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
                                <h3 className="mb-2 text-lg font-medium">Aucune inscription trouvée</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer une nouvelle inscription.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={openModal} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter une inscription
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal Nouvelle Inscription */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-h-[90vh] sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <BookOpen className="h-5 w-5" />
                                Nouvelle Inscription
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom complet *</Label>
                                    <Input 
                                        id="name" 
                                        value={data.name} 
                                        onChange={(e) => setData('name', e.target.value)} 
                                        required 
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Genre *</Label>
                                    <Select 
                                        value={data.gendre} 
                                        onValueChange={(value) => setData('gendre', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez un genre" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Masculin">Masculin</SelectItem>
                                            <SelectItem value="Féminin">Féminin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Date de naissance</Label>
                                    <Input 
                                        type="date" 
                                        value={data.date_of_birth} 
                                        onChange={(e) => setData('date_of_birth', e.target.value)} 
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Téléphone</Label>
                                    <Input 
                                        value={data.phone} 
                                        onChange={(e) => setData('phone', e.target.value)} 
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Institution *</Label>
                                    <Select 
                                        value={data.institution_id} 
                                        onValueChange={(value) => setData('institution_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez une institution" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {institutions.map((inst) => (
                                                <SelectItem key={inst.id} value={inst.id}>
                                                    {inst.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Année académique *</Label>
                                    <Select 
                                        value={data.academic_year_id} 
                                        onValueChange={(value) => setData('academic_year_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez une année" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {academicYears.map((year) => (
                                                <SelectItem key={year.id} value={year.id}>
                                                    {year.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Promotion *</Label>
                                    <Select 
                                        value={data.promotion_id} 
                                        onValueChange={(value) => setData('promotion_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez une promotion" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {promotions.map((promo) => (
                                                <SelectItem key={promo.id} value={promo.id}>
                                                    {promo.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeModal}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={processing} className="gap-2">
                                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    Créer l'inscription
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal Importation Excel */}
                <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Upload className="h-5 w-5" />
                                Importer des inscriptions
                            </DialogTitle>
                            <DialogDescription>
                                Téléversez un fichier Excel contenant la liste des étudiants
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Fichier Excel *</Label>
                                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer bg-gray-50"
                                     onClick={() => document.getElementById('file-upload')?.click()}>
                                    <input 
                                        id="file-upload"
                                        type="file" 
                                        className="hidden" 
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setFile(e.target.files[0]);
                                                importForm.setData('file', e.target.files[0]);
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
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Institution *</Label>
                                    <Select 
                                        value={importForm.data.institution_id} 
                                        onValueChange={(value) => importForm.setData('institution_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Institution" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {institutions.map((inst) => (
                                                <SelectItem key={inst.id} value={inst.id}>
                                                    {inst.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Année académique *</Label>
                                    <Select 
                                        value={importForm.data.academic_year_id} 
                                        onValueChange={(value) => importForm.setData('academic_year_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Année" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {academicYears.map((year) => (
                                                <SelectItem key={year.id} value={year.id}>
                                                    {year.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Promotion *</Label>
                                    <Select 
                                        value={importForm.data.promotion_id} 
                                        onValueChange={(value) => importForm.setData('promotion_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Promotion" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {promotions.map((promo) => (
                                                <SelectItem key={promo.id} value={promo.id}>
                                                    {promo.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeImportModal}>
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

                {/* Modal Suppression */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Confirmer la suppression</DialogTitle>
                            <DialogDescription>
                                Êtes-vous sûr de vouloir supprimer l'inscription de {inscriptionToDelete?.student_name} ?
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
