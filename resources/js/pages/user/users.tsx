import { Head, router, useForm } from '@inertiajs/react';
import { ChevronDown, Edit, Loader2, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { useDropzone } from 'react-dropzone';

type User = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    avatar: string;
    role: string;
    institutions: { id: number; name: string }[];
    created_at: string;
};

type PageProps = {
    users: User[];
    institutions: { id: number; name: string }[];
    roles: { id: number; name: string }[];
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

export default function UsersIndex({ users: allUsers, institutions, roles, can, flash }: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState<User[]>(allUsers);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    const { data, setData, post, put, errors, processing, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        is_active: true as boolean,
        institutions: [] as number[],
        document: [] as string[],
    });

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png']
        },
        maxFiles: 1,
        maxSize: 500 * 1024, // 500KB
        onDrop: (acceptedFiles) => {
            setUploadedFiles(acceptedFiles);
            setData('document', [URL.createObjectURL(acceptedFiles[0])]);
        }
    });

    // Gestion de la recherche
    const handleSearch = useMemo(() => {
        return (term: string) => {
            if (!term) {
                setFilteredUsers(allUsers);
                setCurrentPage(1);
                return;
            }
            const results = allUsers.filter(
                (user) =>
                    user.name.toLowerCase().includes(term.toLowerCase()) ||
                    user.email.toLowerCase().includes(term.toLowerCase()) ||
                    user.role.toLowerCase().includes(term.toLowerCase())
            );
            setFilteredUsers(results);
            setCurrentPage(1);
        };
    }, [allUsers]);

    useEffect(() => {
        handleSearch(searchTerm);
    }, [searchTerm, handleSearch]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    // Gestion des messages flash
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

    // Pré-remplir le formulaire quand on édite un utilisateur
    useEffect(() => {
        if (currentUser) {
            setData({
                name: currentUser.name,
                email: currentUser.email,
                password: '',
                password_confirmation: '',
                role: currentUser.role,
                is_active: currentUser.is_active,
                institutions: currentUser.institutions.map(i => i.id),
                document: currentUser.avatar ? [currentUser.avatar] : [],
            });
            if (currentUser.avatar) {
                setUploadedFiles([]);
            }
        } else {
            reset();
            setUploadedFiles([]);
        }
    }, [currentUser]);

    const openModal = (user: User | null = null) => {
        if ((user && !can.edit) || (!user && !can.create)) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
        reset();
        setUploadedFiles([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('email', data.email);
            formData.append('role', data.role);
            formData.append('is_active', data.is_active ? '1' : '0');
            formData.append('institutions', JSON.stringify(data.institutions));
            
            if (data.password) {
                formData.append('password', data.password);
                formData.append('password_confirmation', data.password_confirmation);
            }
            
            if (uploadedFiles.length > 0) {
                formData.append('avatar', uploadedFiles[0]);
            }

            if (currentUser) {
                await router.put(route('users.update', currentUser.id), formData, {
                    onSuccess: () => closeModal(),
                });
            } else {
                formData.append('password', data.password);
                await router.post(route('users.store'), formData, {
                    onSuccess: () => closeModal(),
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const openDeleteModal = (user: User) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!userToDelete) return;

        router.delete(route('users.destroy', userToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
            },
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilteredUsers(allUsers);
        setCurrentPage(1);
    };

    const removeAvatar = () => {
        setUploadedFiles([]);
        setData('document', []);
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
            <Head title="Gestion des Utilisateurs" />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestion des Utilisateurs</h1>
                        <p className="text-muted-foreground">{filteredUsers.length} utilisateurs enregistrés</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {can.create && (
                            <Button onClick={() => openModal()} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Nouvel Utilisateur
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
                                placeholder="Rechercher un utilisateur..."
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
                                <CardTitle>Liste des Utilisateurs</CardTitle>
                                <CardDescription>{filteredUsers.length} utilisateurs correspondant aux critères</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredUsers.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>Avatar</TableHead>
                                                <TableHead>Nom</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Rôle</TableHead>
                                                <TableHead>Institutions</TableHead>
                                                <TableHead>Statut</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedUsers.map((user) => (
                                                <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell>
                                                        {user.avatar && (
                                                            <img 
                                                                src={user.avatar} 
                                                                alt={user.name} 
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.role}</TableCell>
                                                    <TableCell>
                                                        {user.institutions.slice(0, 2).map(inst => inst.name).join(', ')}
                                                        {user.institutions.length > 2 && ` +${user.institutions.length - 2}`}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            user.is_active 
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                            {user.is_active ? 'Actif' : 'Inactif'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => openModal(user)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(user)}
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
                                <h3 className="mb-2 text-lg font-medium">Aucun utilisateur trouvé</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer un nouvel utilisateur.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={() => openModal()} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter un utilisateur
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal pour créer/modifier un utilisateur */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                {currentUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
                            </DialogTitle>
                            <DialogDescription>
                                {currentUser 
                                    ? 'Modifiez les informations de l\'utilisateur' 
                                    : 'Remplissez les informations pour créer un nouvel utilisateur'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                            {/* Bloc d'erreurs globales */}
                            {Object.keys(errors).length > 0 && (
                                <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                        Erreurs de validation
                                    </h3>
                                    <ul className="mt-2 list-disc space-y-1 pl-5">
                                        {Object.entries(errors).map(([key, error]) => (
                                            <li key={key} className="text-sm text-red-700 dark:text-red-300">
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <ScrollArea.Root className="flex-1 overflow-hidden" type="auto">
                                <ScrollArea.Viewport className="h-full w-full pr-4">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Nom complet *</Label>
                                                    <Input 
                                                        id="name" 
                                                        value={data.name} 
                                                        onChange={(e) => setData('name', e.target.value)} 
                                                        required 
                                                        className={errors.name ? 'border-red-500 dark:border-red-500' : ''}
                                                    />
                                                    {errors.name && <p className="text-sm text-red-500 dark:text-red-400">{errors.name}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email *</Label>
                                                    <Input 
                                                        id="email" 
                                                        type="email"
                                                        value={data.email} 
                                                        onChange={(e) => setData('email', e.target.value)} 
                                                        required 
                                                        className={errors.email ? 'border-red-500 dark:border-red-500' : ''}
                                                    />
                                                    {errors.email && <p className="text-sm text-red-500 dark:text-red-400">{errors.email}</p>}
                                                </div>

                                                {!currentUser && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="password">Mot de passe *</Label>
                                                            <Input 
                                                                id="password" 
                                                                type="password"
                                                                value={data.password} 
                                                                onChange={(e) => setData('password', e.target.value)} 
                                                                required={!currentUser}
                                                                className={errors.password ? 'border-red-500 dark:border-red-500' : ''}
                                                            />
                                                            {errors.password && <p className="text-sm text-red-500 dark:text-red-400">{errors.password}</p>}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="password_confirmation">Confirmer le mot de passe *</Label>
                                                            <Input 
                                                                id="password_confirmation" 
                                                                type="password"
                                                                value={data.password_confirmation} 
                                                                onChange={(e) => setData('password_confirmation', e.target.value)} 
                                                                required={!currentUser}
                                                                className={errors.password_confirmation ? 'border-red-500 dark:border-red-500' : ''}
                                                            />
                                                            {errors.password_confirmation && <p className="text-sm text-red-500 dark:text-red-400">{errors.password_confirmation}</p>}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Rôle *</Label>
                                                    <Select 
                                                        value={data.role} 
                                                        onValueChange={(value) => setData('role', value)} 
                                                        required
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner un rôle">
                                                                {roles.find(r => r.id.toString() === data.role)?.name || 'Sélectionner un rôle'}
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {roles.map((role) => (
                                                                <SelectItem key={role.id} value={role.id.toString()}>
                                                                    {role.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.role && <p className="text-sm text-red-500 dark:text-red-400">{errors.role}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Statut *</Label>
                                                    <Select 
                                                        value={data.is_active ? '1' : '0'} 
                                                        onValueChange={(value) => setData('is_active', value === '1')} 
                                                        required
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner un statut">
                                                                {data.is_active ? 'Actif' : 'Inactif'}
                                                            </SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1">Actif</SelectItem>
                                                            <SelectItem value="0">Inactif</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Institutions</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {institutions.map((institution) => (
                                                    <div key={institution.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`institution-${institution.id}`}
                                                            checked={data.institutions.includes(institution.id)}
                                                            onCheckedChange={(checked) => {
                                                                setData('institutions', 
                                                                    checked 
                                                                        ? [...data.institutions, institution.id] 
                                                                        : data.institutions.filter(id => id !== institution.id)
                                                                );
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor={`institution-${institution.id}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            {institution.name}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Photo de profil</Label>
                                            <div 
                                                {...getRootProps()} 
                                                className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${
                                                    isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300'
                                                }`}
                                            >
                                                <input {...getInputProps()} />
                                                {data.document.length > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <img 
                                                            src={data.document[0]} 
                                                            alt="Preview" 
                                                            className="h-24 w-24 rounded-full object-cover mb-2"
                                                        />
                                                        <Button 
                                                            variant="destructive" 
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeAvatar();
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Supprimer
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex flex-col items-center justify-center gap-1">
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                                                <Users className="h-6 w-6 text-gray-400" />
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {isDragActive 
                                                                    ? 'Déposez votre fichier ici...' 
                                                                    : 'Glissez-déposez votre fichier ici, ou cliquez pour sélectionner'
                                                                }
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Formats acceptés: JPG, PNG (max 500KB)
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea.Viewport>
                                <ScrollArea.Scrollbar
                                    orientation="vertical"
                                    className="flex w-2.5 touch-none select-none bg-gray-100 transition-colors duration-150 ease-in-out hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                                >
                                    <ScrollArea.Thumb className="relative flex-1 rounded-full bg-gray-300 before:absolute before:top-1/2 before:left-1/2 before:h-full before:min-h-[44px] before:w-full before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] dark:bg-gray-600" />
                                </ScrollArea.Scrollbar>
                                <ScrollArea.Corner />
                            </ScrollArea.Root>

                            {/* Footer */}
                            <DialogFooter className="bg-background mt-6 py-4">
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={closeModal} disabled={processing}>
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={processing} className="gap-2">
                                        {processing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : currentUser ? (
                                            <>
                                                <Edit className="h-4 w-4" />
                                                Mettre à jour
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Créer l'utilisateur
                                            </>
                                        )}
                                    </Button>
                                </div>
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
                                Êtes-vous sûr de vouloir supprimer l'utilisateur "{userToDelete?.name}" ? Cette action est irréversible.
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
