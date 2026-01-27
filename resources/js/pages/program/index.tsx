import { Head, router, usePage } from '@inertiajs/react';
import { BookOpen, Download, Edit, Loader2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
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

type Program = {
    id: number;
    name: string;
    institution_id: number;
    institution: string;
    courses_count: number;
    created_at: string;
};

type Institution = {
    id: number;
    name: string;
};

type PageProps = {
    programs: Program[];
    institutions: Institution[];
    defaultInstitution?: number;
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        access: boolean;
        selectInstitution: boolean;
        import: boolean; // Ajout permission
    };
    flash?: {
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    };
};

export default function ProgramIndex({ programs: allPrograms, institutions, defaultInstitution, can, flash }: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false); // Modal import
    const [file, setFile] = useState<File | null>(null); // Fichier upload
    const [isImporting, setIsImporting] = useState(false); // Loading import
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPrograms, setFilteredPrograms] = useState<Program[]>(allPrograms);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pour gérer l'institution sélectionnée dans le modal d'import (similaire à create)
    const [selectedImportInstitution, setSelectedImportInstitution] = useState<string>(defaultInstitution ? defaultInstitution.toString() : '');

    // Déterminer si l'utilisateur est Super Admin en utilisant les props globales auth
    const { props } = usePage<{ auth: { user: any } }>();
    const isSuperAdmin = props.auth?.user?.roles?.some((role: any) => role.name === 'Super Admin') || false;

    // Pré-remplir l'institution pour les non Super Admin lors de l'import
    useEffect(() => {
        if (!isSuperAdmin && props.auth?.user?.institutions && props.auth.user.institutions.length > 0) {
            setSelectedImportInstitution(props.auth.user.institutions[0].id.toString());
        }
    }, [isSuperAdmin, props.auth]);

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

    // Filtrage des programmes
    useEffect(() => {
        let results = [...allPrograms];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(
                (program) =>
                    program.name.toLowerCase().includes(term) ||
                    program.institution.toLowerCase().includes(term) ||
                    program.created_at.includes(term),
            );
        }

        setFilteredPrograms(results);
        setCurrentPage(1);
    }, [allPrograms, searchTerm]);

    const paginatedPrograms = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPrograms.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPrograms, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);

    const openModal = () => {
        if (!can.create) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const openImportModal = () => {
        if (!can.import) {
            // Utilisation de la nouvelle permission
            toast.error("Vous n'avez pas la permission d'importer");
            return;
        }
        setIsImportModalOpen(true);
    };

    const closeImportModal = () => {
        setIsImportModalOpen(false);
        setFile(null);
        if (isSuperAdmin) {
            setSelectedImportInstitution('');
        }
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast.error('Veuillez sélectionner un fichier');
            return;
        }

        if (!selectedImportInstitution) {
            toast.error('Veuillez sélectionner une institution');
            return;
        }

        setIsImporting(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('institution_id', selectedImportInstitution);

        router.post(route('programs.import'), formData, {
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
            },
        });
    };

    const openDeleteModal = (program: Program) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }
        setProgramToDelete(program);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!programToDelete) return;

        setIsDeleting(true);
        router.delete(route('programs.destroy', programToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setIsDeleting(false);
            },
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilteredPrograms(allPrograms);
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
            <Head title="Gestion des Programmes" />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestion des Programmes</h1>
                        <p className="text-muted-foreground">{filteredPrograms.length} programmes enregistrés</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {can.create && (
                            <Button onClick={openModal} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Nouveau Programme
                            </Button>
                        )}
                        {can.import && (
                            <Button variant="secondary" onClick={openImportModal} className="gap-2 shadow-sm">
                                <Upload size={16} />
                                Importer Excel
                            </Button>
                        )}
                        <Button asChild variant="outline" className="gap-2 shadow-sm">
                            <a href="/storage/templates/programs_import_template.csv" download>
                                <Download size={16} />
                                Modèle CSV
                            </a>
                        </Button>
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
                                placeholder="Rechercher un programme..."
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
                                <CardTitle>Liste des Programmes</CardTitle>
                                <CardDescription>{filteredPrograms.length} programmes correspondant aux critères</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredPrograms.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>Nom du programme</TableHead>
                                                <TableHead>Institution</TableHead>
                                                <TableHead>Nombre de cours</TableHead>
                                                <TableHead>Date de création</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedPrograms.map((program) => (
                                                <TableRow key={program.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell className="font-medium">{program.name}</TableCell>
                                                    <TableCell>{program.institution}</TableCell>
                                                    <TableCell>{program.courses_count}</TableCell>
                                                    <TableCell>{program.created_at}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        // Redirection conditionnelle
                                                                        if (program.courses_count > 0) {
                                                                            router.get(route('programs.edit', program.id));
                                                                        } else {
                                                                            router.get(route('programs.details.create', program.id));
                                                                        }
                                                                    }}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(program)}
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
                                <h3 className="mb-2 text-lg font-medium">Aucun programme trouvé</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer un nouveau programme.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={openModal} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter un programme
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <BookOpen className="h-5 w-5" />
                                Nouveau Programme
                            </DialogTitle>
                            <DialogDescription>Renseignez les informations pour créer un nouveau programme</DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                setIsSubmitting(true);
                                const form = e.target as HTMLFormElement;
                                const name = (form.elements.namedItem('name') as HTMLInputElement)?.value;
                                const institutionId = (form.elements.namedItem('institution_id') as HTMLSelectElement)?.value;

                                router.post(
                                    route('programs.store'),
                                    {
                                        name,
                                        institution_id: institutionId,
                                    },
                                    {
                                        onSuccess: () => {
                                            closeModal();
                                            setIsSubmitting(false);
                                        },
                                        onFinish: () => setIsSubmitting(false),
                                    },
                                );
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom du programme *</Label>
                                    <Input id="name" name="name" placeholder="Licence Informatique" required />
                                </div>
                                {can.selectInstitution ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="institution_id">Institution *</Label>
                                        <select
                                            id="institution_id"
                                            name="institution_id"
                                            className="w-full rounded-md border p-2"
                                            required
                                            defaultValue={defaultInstitution}
                                        >
                                            <option value="">Sélectionnez une institution</option>
                                            {institutions.map((institution) => (
                                                <option key={institution.id} value={institution.id}>
                                                    {institution.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>Institution</Label>
                                        {institutions.length > 0 ? (
                                            <>
                                                <Input readOnly value={institutions[0].name} />
                                                <input type="hidden" name="institution_id" value={institutions[0].id} />
                                            </>
                                        ) : (
                                            <p className="text-red-500">Aucune institution disponible</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={closeModal}>
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={isDeleting} className="gap-2">
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        Créer et ajouter des cours
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal Importation */}
                <Dialog open={isImportModalOpen} onOpenChange={closeImportModal}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Importer des Programmes
                            </DialogTitle>
                            <DialogDescription>
                                Sélectionnez un fichier Excel ou CSV contenant les programmes à importer. Le fichier doit avoir les colonnes :
                                Intitulé Cours, Promotion, CMI, TP, CREDIT, Unité, Catégorie.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="import-institution">Institution *</Label>
                                {can.selectInstitution ? (
                                    <Select value={selectedImportInstitution} onValueChange={setSelectedImportInstitution} disabled={isImporting}>
                                        <SelectTrigger id="import-institution">
                                            <SelectValue placeholder="Sélectionnez une institution" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {institutions.map((institution) => (
                                                <SelectItem key={institution.id} value={institution.id.toString()}>
                                                    {institution.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input value={institutions.length > 0 ? institutions[0].name : ''} disabled />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Fichier Excel/CSV *</Label>
                                <div
                                    className="cursor-pointer rounded-lg border-2 border-dashed bg-gray-50 p-6 text-center dark:bg-gray-800"
                                    onClick={() => !isImporting && document.getElementById('file-upload-program')?.click()}
                                >
                                    <input
                                        id="file-upload-program"
                                        type="file"
                                        className="hidden"
                                        accept=".xlsx,.xls,.csv"
                                        disabled={isImporting}
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    {file ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="font-medium">{file.name}</p>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFile(null);
                                                }}
                                            >
                                                Retirer le fichier
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Download className="mx-auto h-8 w-8 text-gray-400" />
                                            <p className="mt-2 font-medium">Glissez votre fichier ici</p>
                                            <p className="text-sm text-gray-500">Formats supportés: XLSX, XLS, CSV</p>
                                            <Button type="button" variant="outline" className="mt-2" disabled={isImporting}>
                                                Sélectionner un fichier
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <div className="mt-4 rounded-md bg-blue-50 p-3 dark:bg-blue-950">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Format attendu :</p>
                                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                                        Le fichier doit contenir les colonnes : <strong>Intitulé Cours, Promotion, TP, CREDIT</strong>.
                                    </p>
                                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                                        Colonnes optionnelles : <strong>CMI, Unité, Catégorie</strong>.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeImportModal} disabled={isImporting}>
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

                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Confirmer la suppression</DialogTitle>
                            <DialogDescription>Êtes-vous sûr de vouloir supprimer ce programme ? Cette action est irréversible.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete} className="gap-2" disabled={isDeleting}>
                                {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
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
            </div>
        </AppLayout>
    );
}
