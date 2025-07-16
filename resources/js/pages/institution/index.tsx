import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import axios from 'axios';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import _ from 'lodash';
import { AlertCircle, Building2, CheckCircle2, Edit, Globe, Image as ImageIcon, Loader2, MapPin, Phone, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Dropzone from 'react-dropzone';
import { toast } from 'react-toastify';

interface Institution {
    id: number;
    name: string;
    phone: string;
    address?: string;
    description?: string;
    image?: string;
    created_at: string;
    active?: boolean;
    documents?: { thumb: string }[]; 
}

interface PageProps {
    allInstitutions: Institution[];
    institutions: {
        data: Institution[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
    permissions: string[];
    flash?: {
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    };
    filters?: {
        search?: string;
    };
}

export default function InstitutionIndex({ allInstitutions, can, permissions, flash, filters }: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [institutionToDelete, setInstitutionToDelete] = useState<Institution | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [openSearchPopover, setOpenSearchPopover] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>(allInstitutions);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        phone: '',
        address: '',
        description: '',
        document: [] as string[],
        search: filters?.search || '',
        active: true as boolean,
    });

    // Vérification des permissions
    const canImport = permissions.includes('create_institutions');
    const canView = permissions.includes('access_institutions');

    // Fonction de recherche avec debounce
    const handleSearch = useMemo(() => {
        return _.debounce((term: string) => {
            if (!term) {
                setFilteredInstitutions(allInstitutions);
                setCurrentPage(1);
                return;
            }

            const results = allInstitutions.filter(
                (institution) => institution.name.toLowerCase().includes(term.toLowerCase()) || institution.phone.includes(term),
            );

            setFilteredInstitutions(results);
            setCurrentPage(1);
        }, 300);
    }, [allInstitutions]);

    useEffect(() => {
        handleSearch(searchTerm);
        return () => handleSearch.cancel();
    }, [searchTerm, handleSearch]);

    // Filtrage des institutions par statut
    const filteredByStatus = useMemo(() => {
        return filteredInstitutions.filter((institution) => {
            if (statusFilter === 'all') return true;
            if (statusFilter === 'active') return institution.active !== false;
            return institution.active === false;
        });
    }, [filteredInstitutions, statusFilter]);

    // Pagination
    const paginatedInstitutions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredByStatus.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredByStatus, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredByStatus.length / itemsPerPage);

    // Compteurs pour les badges de statut
    const activeCount = useMemo(() => filteredInstitutions.filter((i) => i.active !== false).length, [filteredInstitutions]);

    const inactiveCount = useMemo(() => filteredInstitutions.filter((i) => i.active === false).length, [filteredInstitutions]);

    useEffect(() => {
        if (flash) {
            switch (flash.type) {
                case 'success':
                    toast.success(flash.message);
                    break;
                case 'error':
                    toast.error(flash.message);
                    break;
                case 'warning':
                    toast.warning(flash.message);
                    break;
                case 'info':
                    toast.info(flash.message);
                    break;
                default:
                    toast(flash.message);
            }
        }
    }, [flash]);

    useEffect(() => {
        if (currentInstitution) {
            setData({
                name: currentInstitution.name,
                phone: currentInstitution.phone,
                address: currentInstitution.address || '',
                description: currentInstitution.description || '',
                document: [],
                search: searchTerm,
                active: currentInstitution.active !== false,
            });
        } else {
            reset();
        }
    }, [currentInstitution]);

    const openModal = (institution: Institution | null = null) => {
        if ((institution && !can.edit) || (!institution && !can.create)) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }
        setCurrentInstitution(institution);
        setFiles([]);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentInstitution(null);
        reset();
        setUploadProgress(0);
    };

    const handleFileUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(route('dropzone.upload'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(progress);
                    }
                },
            });

            return response.data.name;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    };

    const handleFileDelete = async (fileName: string) => {
        try {
            await axios.post(
                route('dropzone.delete'),
                {
                    file_name: fileName,
                },
                {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                },
            );
        } catch (error) {
            console.error('Delete failed:', error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('phone', data.phone);
        formData.append('address', data.address || '');
        formData.append('description', data.description || '');
        formData.append('active', String(data.active));

        data.document.forEach((file) => {
            formData.append('document[]', file);
        });

        try {
            if (currentInstitution) {
                await put(route('institutions.update', currentInstitution.id), {
                    onSuccess: () => closeModal(),
                });
            } else {
                await post(route('institutions.store'), {
                    onSuccess: () => closeModal(),
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const openDeleteModal = (institution: Institution) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }
        setInstitutionToDelete(institution);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!institutionToDelete) return;

        router.delete(route('institutions.destroy', institutionToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setInstitutionToDelete(null);
                // Mettre à jour la liste côté client
                setFilteredInstitutions(filteredInstitutions.filter((i) => i.id !== institutionToDelete.id));
            },
        });
    };

    const handleImportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!canImport) {
            toast.error("Vous n'avez pas la permission d'importer");
            return;
        }

        if (!importFile) return;

        try {
            const formData = new FormData();
            formData.append('excel_file', importFile);

            const response = await axios.post(route('institutions.import'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(progress);
                    }
                },
            });

          
            setFilteredInstitutions([...filteredInstitutions, ...response.data.institutions]);
            setIsImportModalOpen(false);
            setImportFile(null);
            toast.success(response.data.message);
        } catch (error) {
            console.error('Import failed:', error);
            toast.error("Échec de l'importation");
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setFilteredInstitutions(allInstitutions);
        setCurrentPage(1);
    };

    if (!canView) {
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
            <Head title="Gestion des Institutions" />

            <div className="container mx-auto space-y-6 py-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestion des Institutions</h1>
                        <p className="text-muted-foreground">{filteredInstitutions.length} institutions enregistrées</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {can.create && (
                            <Button onClick={() => openModal()} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Nouvelle Institution
                            </Button>
                        )}

                        {canImport && (
                            <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="gap-2 shadow-sm">
                                <Upload size={16} />
                                Importer
                            </Button>
                        )}

                        <Button variant="outline" onClick={resetFilters} className="gap-2 shadow-sm">
                            <X size={16} />
                            Réinitialiser
                        </Button>
                    </div>
                </div>

                {/* Search and Filters Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Search Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle>Recherche</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Popover open={openSearchPopover} onOpenChange={setOpenSearchPopover}>
                                <PopoverTrigger asChild>
                                    <div className="relative">
                                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            placeholder="Rechercher une institution..."
                                            className="pl-10"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setOpenSearchPopover(e.target.value.length > 0);
                                            }}
                                            onFocus={() => setOpenSearchPopover(searchTerm.length > 0)}
                                        />
                                        {searchTerm && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2"
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setFilteredInstitutions(allInstitutions);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" side="bottom">
                                    <Command className="rounded-lg border shadow-md">
                                        <CommandInput placeholder="Rechercher une institution..." />
                                        <CommandList>
                                            {filteredInstitutions.length === 0 ? (
                                                <CommandEmpty className="py-6 text-center text-sm">Aucune institution trouvée</CommandEmpty>
                                            ) : (
                                                <CommandGroup heading="Suggestions">
                                                    {filteredInstitutions.slice(0, 5).map((institution) => (
                                                        <CommandItem
                                                            key={institution.id}
                                                            value={institution.name}
                                                            onSelect={() => {
                                                                setSearchTerm(institution.name);
                                                                setOpenSearchPopover(false);
                                                            }}
                                                            className="aria-selected:bg-accent cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={institution.image} />
                                                                    <AvatarFallback>{institution.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium">{institution.name}</p>
                                                                    <p className="text-muted-foreground text-xs">{institution.phone}</p>
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </CardContent>
                    </Card>

                    {/* Status Filter Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle>Statut</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Button
                                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter('all')}
                                    className="gap-1"
                                >
                                    <Globe className="h-4 w-4" />
                                    Tous
                                </Button>
                                <Button
                                    variant={statusFilter === 'active' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter('active')}
                                    className="gap-1"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Actives
                                </Button>
                                <Button
                                    variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter('inactive')}
                                    className="gap-1"
                                >
                                    <AlertCircle className="h-4 w-4" />
                                    Inactives
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle>Statistiques</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <p className="text-muted-foreground text-sm">Actives</p>
                                        <p className="font-semibold">{activeCount}</p>
                                    </div>
                                    <Badge variant="outline" className="gap-1 text-green-600">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {allInstitutions.length > 0 ? Math.round((activeCount / allInstitutions.length) * 100) : 0}%
                                    </Badge>
                                </div>
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <p className="text-muted-foreground text-sm">Inactives</p>
                                        <p className="font-semibold">{inactiveCount}</p>
                                    </div>
                                    <Badge variant="outline" className="gap-1 text-red-600">
                                        <AlertCircle className="h-3 w-3" />
                                        {allInstitutions.length > 0 ? Math.round((inactiveCount / allInstitutions.length) * 100) : 0}%
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle>Actions rapides</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                {can.create && (
                                    <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => openModal()}>
                                        <Plus className="h-4 w-4" />
                                        Ajouter une institution
                                    </Button>
                                )}
                                {canImport && (
                                    <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => setIsImportModalOpen(true)}>
                                        <Upload className="h-4 w-4" />
                                        Importer des données
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Liste des Institutions</CardTitle>
                                <CardDescription>{filteredByStatus.length} institutions correspondant aux critères</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredByStatus.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead className="w-[80px]">Logo</TableHead>
                                                <TableHead>Nom</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead className="hidden md:table-cell">Description</TableHead>
                                                <TableHead className="hidden lg:table-cell">Adresse</TableHead>
                                                <TableHead className="hidden sm:table-cell">Date</TableHead>
                                                <TableHead>Statut</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedInstitutions.map((institution) => (
                                                <TableRow key={institution.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell>
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={institution.image} alt={institution.name} />
                                                            <AvatarFallback>{institution.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{institution.name}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-muted-foreground text-sm">{institution.phone}</div>
                                                    </TableCell>
                                                    <TableCell className="hidden max-w-xs truncate md:table-cell">
                                                        {institution.description || 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="hidden max-w-xs truncate lg:table-cell">
                                                        {institution.address || 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <div className="text-muted-foreground text-sm">
                                                            {new Date(institution.created_at).toLocaleDateString()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={institution.active !== false ? 'default' : 'destructive'} className="gap-1">
                                                            {institution.active !== false ? (
                                                                <>
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                    Active
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    Inactive
                                                                </>
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => openModal(institution)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(institution)}
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

                                {/* Pagination */}
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
                                    <ImageIcon className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium">Aucune institution trouvée</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer une nouvelle institution.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={() => openModal()} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter une institution
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal pour créer/modifier une institution */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Building2 className="h-5 w-5" />
                                {currentInstitution ? 'Modifier Institution' : 'Nouvelle Institution'}
                            </DialogTitle>
                            {uploadProgress > 0 && (
                                <div className="pt-2">
                                    <div className="h-2 w-full rounded-full bg-gray-200">
                                        <div
                                            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-xs">Téléversement {uploadProgress}% complet</p>
                                </div>
                            )}
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-hidden">
                            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Colonne Gauche */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="flex items-center gap-1">
                                                <Building2 className="h-4 w-4" />
                                                Nom *
                                            </Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Nom de l'institution"
                                                required
                                            />
                                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="flex items-center gap-1">
                                                <Phone className="h-4 w-4" />
                                                Téléphone *
                                            </Label>
                                            <Input
                                                id="phone"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                placeholder="Numéro de téléphone"
                                                required
                                            />
                                            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="address" className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                Adresse
                                            </Label>
                                            <Input
                                                id="address"
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                                placeholder="Adresse complète"
                                            />
                                            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                                        </div>
                                    </div>

                                    {/* Colonne Droite */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-1">
                                                <Edit className="h-4 w-4" />
                                                Description
                                            </Label>
                                            <textarea
                                                className="focus:ring-primary-500 w-full rounded-md border p-2 focus:border-transparent focus:ring-2"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                rows={3}
                                                placeholder="Description de l'institution"
                                            />
                                            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Statut</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant={data.active ? 'default' : 'outline'}
                                                    type="button"
                                                    onClick={() => setData('active', true)}
                                                    className="gap-1"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Active
                                                </Button>
                                                <Button
                                                    variant={!data.active ? 'destructive' : 'outline'}
                                                    type="button"
                                                    onClick={() => setData('active', false)}
                                                    className="gap-1"
                                                >
                                                    <AlertCircle className="h-4 w-4" />
                                                    Inactive
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section des images */}
                                <div className="space-y-4">
                                    <Label>Logo et Images (max 3)</Label>
                                    <Dropzone
                                        maxFiles={3}
                                        accept={{ 'image/*': ['.jpeg', '.jpg', '.png'] }}
                                        onDrop={async (acceptedFiles) => {
                                            const uploadedFiles = [];
                                            for (const file of acceptedFiles) {
                                                try {
                                                    const fileName = await handleFileUpload(file);
                                                    uploadedFiles.push(fileName);
                                                    setFiles((prev) => [...prev, file]);
                                                } catch {
                                                    toast.error(`Échec de l'upload de ${file.name}`);
                                                }
                                            }
                                            setData('document', [...data.document, ...uploadedFiles]);
                                        }}
                                    >
                                        {({ getRootProps, getInputProps }) => (
                                            <div
                                                {...getRootProps()}
                                                className="border-primary-100 bg-primary-50/50 hover:bg-primary-50 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center"
                                            >
                                                <input {...getInputProps()} />
                                                <div className="text-primary-600 flex flex-col items-center gap-2">
                                                    <Upload className="h-8 w-8" />
                                                    <p className="font-medium">Glissez vos fichiers ici</p>
                                                    <p className="text-primary-400 text-sm">Formats supportés: JPEG, PNG (max 1MB par fichier)</p>
                                                </div>
                                            </div>
                                        )}
                                    </Dropzone>

                                    <div className="grid max-h-[200px] grid-cols-3 gap-2 overflow-y-auto pb-2">
                                        {files.map((file, index) => (
                                            <div key={index} className="group relative">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={file.name}
                                                    className="h-24 w-full rounded-lg border object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const fileName = data.document[index];
                                                        try {
                                                            await handleFileDelete(fileName);
                                                            const newFiles = [...files];
                                                            const newDocuments = [...data.document];
                                                            newFiles.splice(index, 1);
                                                            newDocuments.splice(index, 1);
                                                            setFiles(newFiles);
                                                            setData('document', newDocuments);
                                                        } catch {
                                                            toast.error('Échec de la suppression du fichier');
                                                        }
                                                    }}
                                                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {currentInstitution?.documents?.map((doc, idx) => (
                                            <div key={idx} className="relative">
                                                <img
                                                    src={doc.thumb}
                                                    alt={currentInstitution.name}
                                                    className="h-24 w-full rounded-lg border object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Footer fixe */}
                            <DialogFooter className="bg-background mt-auto border-t pt-4">
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={closeModal} disabled={processing}>
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={processing} className="gap-2">
                                        {processing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : currentInstitution ? (
                                            <>
                                                <Edit className="h-4 w-4" />
                                                Mettre à jour
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Créer l'institution
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal pour l'import Excel */}
                <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Importer des Institutions</DialogTitle>
                            <DialogDescription>Importez un fichier Excel pour ajouter plusieurs institutions à la fois.</DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Fichier Excel</Label>
                                <Dropzone
                                    maxFiles={1}
                                    accept={{
                                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                                        'application/vnd.ms-excel': ['.xls'],
                                    }}
                                    onDrop={(acceptedFiles) => {
                                        setImportFile(acceptedFiles[0]);
                                    }}
                                >
                                    {({ getRootProps, getInputProps }) => (
                                        <div
                                            {...getRootProps()}
                                            className="cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <input {...getInputProps()} />
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload className="h-6 w-6 text-gray-400" />
                                                <p className="text-sm text-gray-500">
                                                    Glissez-déposez un fichier Excel ici, ou cliquez pour sélectionner
                                                </p>
                                                <p className="text-xs text-gray-400">Formats acceptés: .xls, .xlsx</p>
                                            </div>
                                        </div>
                                    )}
                                </Dropzone>
                                {importFile && (
                                    <div className="mt-1 flex items-center gap-2">
                                        <Badge variant="outline" className="gap-2">
                                            {importFile.name}
                                            <button type="button" onClick={() => setImportFile(null)} className="text-gray-400 hover:text-gray-600">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={!importFile || processing}>
                                    {processing ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Importation...
                                        </span>
                                    ) : (
                                        'Importer'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal de confirmation de suppression */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Confirmer la suppression</DialogTitle>
                            <DialogDescription>
                                Êtes-vous sûr de vouloir supprimer l'institution "{institutionToDelete?.name}" ? Cette action est irréversible.
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
