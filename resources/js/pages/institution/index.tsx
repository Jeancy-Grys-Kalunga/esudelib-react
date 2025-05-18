import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Trash2, Edit, Plus, Upload, X, Image as ImageIcon, Loader2, Search, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import Dropzone from 'react-dropzone';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from 'cmdk';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Progress } from '@radix-ui/react-progress';
import axios from 'axios';
import _ from 'lodash';

interface Institution {
  id: number;
  name: string;
  phone: string;
  address?: string;
  description?: string;
  image?: string;
  created_at: string;
  active?: boolean;
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

      const results = allInstitutions.filter(institution => 
        institution.name.toLowerCase().includes(term.toLowerCase()) ||
        institution.phone.includes(term)
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
    return filteredInstitutions.filter(institution => {
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
  const activeCount = useMemo(() => 
    filteredInstitutions.filter(i => i.active !== false).length, 
    [filteredInstitutions]
  );
  
  const inactiveCount = useMemo(() => 
    filteredInstitutions.filter(i => i.active === false).length, 
    [filteredInstitutions]
  );

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
      await axios.post(route('dropzone.delete'), {
        file_name: fileName,
      }, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });
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
        setFilteredInstitutions(filteredInstitutions.filter(i => i.id !== institutionToDelete.id));
      }
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

      // Mettre à jour la liste côté client avec les nouvelles institutions
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

      <div className="container mx-auto py-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Gestion des Institutions
            </h1>
            <p className="text-muted-foreground">
              {filteredInstitutions.length} institutions enregistrées
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {can.create && (
              <Button onClick={() => openModal()} className="gap-2 shadow-sm">
                <Plus size={16} />
                Nouvelle Institution
              </Button>
            )}

            {canImport && (
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="gap-2 shadow-sm"
              >
                <Upload size={16} />
                Importer
              </Button>
            )}

            <Button
              variant="outline"
              onClick={resetFilters}
              className="gap-2 shadow-sm"
            >
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
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
                <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start" side="bottom">
                  <Command className="rounded-lg border shadow-md">
                    <CommandInput placeholder="Rechercher une institution..." />
                    <CommandList>
                      {filteredInstitutions.length === 0 ? (
                        <CommandEmpty className="py-6 text-center text-sm">
                          Aucune institution trouvée
                        </CommandEmpty>
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
                              className="cursor-pointer aria-selected:bg-accent"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={institution.image} />
                                  <AvatarFallback>
                                    {institution.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{institution.name}</p>
                                  <p className="text-xs text-muted-foreground">{institution.phone}</p>
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
                    <p className="text-sm text-muted-foreground">Actives</p>
                    <p className="font-semibold">{activeCount}</p>
                  </div>
                  <Badge variant="outline" className="gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {allInstitutions.length > 0 ? Math.round((activeCount / allInstitutions.length) * 100) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Inactives</p>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start gap-2"
                    onClick={() => openModal()}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une institution
                  </Button>
                )}
                {canImport && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start gap-2"
                    onClick={() => setIsImportModalOpen(true)}
                  >
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
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Liste des Institutions</CardTitle>
                <CardDescription>
                  {filteredByStatus.length} institutions correspondant aux critères
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredByStatus.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-md border overflow-hidden">
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
                              <AvatarFallback>
                                {institution.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{institution.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">{institution.phone}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-xs truncate">
                            {institution.description || 'N/A'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-xs truncate">
                            {institution.address || 'N/A'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="text-sm text-muted-foreground">
                              {new Date(institution.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={institution.active !== false ? 'default' : 'destructive'}
                              className="gap-1"
                            >
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
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Aucune institution trouvée</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {can.create ? "Commencez par créer une nouvelle institution." : "Aucune donnée disponible."}
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {currentInstitution ? 'Modifier Institution' : 'Nouvelle Institution'}
              </DialogTitle>
              {uploadProgress > 0 && (
                <div className="pt-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Téléversement {uploadProgress}% complet
                  </p>
                </div>
              )}
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Nom de l'institution"
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    placeholder="Numéro de téléphone"
                    required
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={data.address}
                  onChange={(e) => setData('address', e.target.value)}
                  placeholder="Adresse complète"
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Description de l'institution"
                ></textarea>
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Logo et Images (max 3)</Label>
                <Dropzone
                  maxFiles={3}
                  accept={{
                    'image/*': ['.jpeg', '.jpg', '.png']
                  }}
                  onDrop={async (acceptedFiles) => {
                    const uploadedFiles = [];
                    for (const file of acceptedFiles) {
                      try {
                        const fileName = await handleFileUpload(file);
                        uploadedFiles.push(fileName);
                        setFiles(prev => [...prev, file]);
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
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          Glissez-déposez des images ici, ou cliquez pour sélectionner
                        </p>
                        <p className="text-xs text-gray-400">
                          Formats acceptés: .jpg, .jpeg, .png (max 1MB par image)
                        </p>
                      </div>
                    </div>
                  )}
                </Dropzone>
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {files.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded-md"
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
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {currentInstitution?.image && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-2">Image actuelle:</p>
                    <img
                      src={currentInstitution.image}
                      alt={currentInstitution.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  </div>
                )}
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={processing}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </span>
                  ) : currentInstitution ? (
                    'Mettre à jour'
                  ) : (
                    'Créer l\'institution'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal pour l'import Excel */}
        <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Importer des Institutions</DialogTitle>
              <DialogDescription>
                Importez un fichier Excel pour ajouter plusieurs institutions à la fois.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Fichier Excel</Label>
                <Dropzone
                  maxFiles={1}
                  accept={{
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                    'application/vnd.ms-excel': ['.xls']
                  }}
                  onDrop={(acceptedFiles) => {
                    setImportFile(acceptedFiles[0]);
                  }}
                >
                  {({ getRootProps, getInputProps }) => (
                    <div
                      {...getRootProps()}
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          Glissez-déposez un fichier Excel ici, ou cliquez pour sélectionner
                        </p>
                        <p className="text-xs text-gray-400">
                          Formats acceptés: .xls, .xlsx
                        </p>
                      </div>
                    </div>
                  )}
                </Dropzone>
                {importFile && (
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="gap-2">
                      {importFile.name}
                      <button
                        type="button"
                        onClick={() => setImportFile(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </Badge>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={!importFile || processing}>
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
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
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}