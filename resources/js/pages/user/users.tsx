import { Head, router, useForm } from '@inertiajs/react';
import { Edit, Loader2, Plus, Search, Trash2, Users, X } from 'lucide-react';
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const { data, setData, post, put, errors, processing, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        is_active: true as boolean,
        institutions: [] as number[],
        avatar: null as File | null,
    });

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png'],
        },
        maxFiles: 1,
        maxSize: 1024 * 1024, // 1MB
        onDrop: (acceptedFiles) => {
            if (acceptedFiles?.[0]) {
                // Libérer l'ancienne URL si existante
                if (avatarPreview) URL.revokeObjectURL(avatarPreview);

                const newFile = acceptedFiles[0];
                setData('avatar', newFile);
                setAvatarPreview(URL.createObjectURL(newFile));
            }
        },
    });

    // Cleanup des URL d'aperçu
    useEffect(() => {
        return () => {
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview]);

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
                    user.role.toLowerCase().includes(term.toLowerCase()),
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
            // Trouver l'ID du rôle correspondant au nom
            const roleId = roles.find((r) => r.name === currentUser.role)?.id.toString() || '';

            setData({
                name: currentUser.name,
                email: currentUser.email,
                password: '',
                password_confirmation: '',
                role: roleId,
                is_active: currentUser.is_active,
                institutions: currentUser.institutions.map((i) => i.id),
                avatar: null,
            });
            if (currentUser.avatar) {
                // Vérifier si c'est une URL complète ou un chemin relatif
                const isFullUrl = /^https?:\/\//.test(currentUser.avatar);
                setAvatarPreview(isFullUrl ? currentUser.avatar : `/storage/${currentUser.avatar}`);
            } else {
                setAvatarPreview(null);
            }
        } else {
            reset();
            setAvatarPreview(null);
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
        clearErrors();
        setAvatarPreview(null);
        // Réinitialiser spécifiquement les institutions
        setData('institutions', []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const cleanData = {
                ...data,
                is_active: data.is_active ? 1 : 0,
                institutions: data.institutions,
                document: data.avatar ? [data.avatar.name] : [],
            };
            if (currentUser) {
                await put(route('users.update', currentUser.id), {
                    ...cleanData,
                    onSuccess: () => closeModal(),
                    onError: () => setIsModalOpen(true),
                });
            } else {
                await post(route('users.store'), {
                    ...cleanData,
                    onSuccess: () => closeModal(),
                    onError: () => setIsModalOpen(true),
                });
            }
        } catch (error) {
            setIsModalOpen(true);
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
        setData('avatar', null);
        setAvatarPreview(null);
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
                                                            <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.role}</TableCell>
                                                    <TableCell>
                                                        <div className="group relative">
                                                            <div className="flex flex-col">
                                                                {user.institutions.slice(0, 2).map((inst) => (
                                                                    <span key={inst.id} className="py-0.5 text-xs">
                                                                        {inst.name}
                                                                    </span>
                                                                ))}
                                                                {user.institutions.length > 2 && (
                                                                    <span className="text-muted-foreground mt-1 text-xs">
                                                                        +{user.institutions.length - 2} autres
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {user.institutions.length > 0 && (
                                                                <div className="absolute z-10 hidden rounded border border-gray-200 bg-white p-2 shadow-lg group-hover:block dark:border-gray-700 dark:bg-gray-800">
                                                                    <div className="mb-1 text-xs font-medium">Institutions:</div>
                                                                    <ul className="space-y-1">
                                                                        {user.institutions.map((inst) => (
                                                                            <li key={inst.id} className="text-xs">
                                                                                {inst.name}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`rounded-full px-2 py-1 text-xs ${
                                                                user.is_active
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}
                                                        >
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
                    <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden !p-0 sm:max-w-2xl">
                        <DialogHeader className="border-b border-gray-100 px-8 pt-8 pb-2 dark:border-gray-800">
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                {currentUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                {currentUser
                                    ? "Modifiez les informations de l'utilisateur"
                                    : 'Remplissez les informations pour créer un nouvel utilisateur'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                            <div className="min-h-0 flex-1">
                                <ScrollArea.Root className="h-full w-full" type="auto">
                                    <ScrollArea.Viewport className="max-h-[60vh] w-full px-8 py-6">
                                        {/* Bloc d'erreurs globales */}
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

                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                                <div className="space-y-5">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="name" className="font-semibold text-gray-700 dark:text-gray-200">
                                                            Nom complet *
                                                        </Label>
                                                        <Input
                                                            id="name"
                                                            value={data.name}
                                                            onChange={(e) => setData('name', e.target.value)}
                                                            required
                                                            className={`rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 ${errors.name ? 'border-red-500 dark:border-red-500' : ''}`}
                                                        />
                                                        {errors.name && <p className="text-xs text-red-500 dark:text-red-400">{errors.name}</p>}
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="email" className="font-semibold text-gray-700 dark:text-gray-200">
                                                            Email *
                                                        </Label>
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            value={data.email}
                                                            onChange={(e) => setData('email', e.target.value)}
                                                            required
                                                            className={`rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 ${errors.email ? 'border-red-500 dark:border-red-500' : ''}`}
                                                        />
                                                        {errors.email && <p className="text-xs text-red-500 dark:text-red-400">{errors.email}</p>}
                                                    </div>

                                                    {!currentUser && (
                                                        <>
                                                            <div className="space-y-1.5">
                                                                <Label htmlFor="password" className="font-semibold text-gray-700 dark:text-gray-200">
                                                                    Mot de passe *
                                                                </Label>
                                                                <Input
                                                                    id="password"
                                                                    type="password"
                                                                    value={data.password}
                                                                    onChange={(e) => setData('password', e.target.value)}
                                                                    required={!currentUser}
                                                                    className={`rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 ${errors.password ? 'border-red-500 dark:border-red-500' : ''}`}
                                                                />
                                                                {errors.password && (
                                                                    <p className="text-xs text-red-500 dark:text-red-400">{errors.password}</p>
                                                                )}
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label
                                                                    htmlFor="password_confirmation"
                                                                    className="font-semibold text-gray-700 dark:text-gray-200"
                                                                >
                                                                    Confirmer le mot de passe *
                                                                </Label>
                                                                <Input
                                                                    id="password_confirmation"
                                                                    type="password"
                                                                    value={data.password_confirmation}
                                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                                    required={!currentUser}
                                                                    className={`rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 ${errors.password_confirmation ? 'border-red-500 dark:border-red-500' : ''}`}
                                                                />
                                                                {errors.password_confirmation && (
                                                                    <p className="text-xs text-red-500 dark:text-red-400">
                                                                        {errors.password_confirmation}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="space-y-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="font-semibold text-gray-700 dark:text-gray-200">Rôle *</Label>
                                                        <Select value={data.role} onValueChange={(value) => setData('role', value)} required>
                                                            <SelectTrigger className="rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400">
                                                                <SelectValue placeholder="Sélectionner un rôle">
                                                                    {roles.find((r) => r.id.toString() === data.role)?.name || 'Sélectionner un rôle'}
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
                                                        {errors.role && <p className="text-xs text-red-500 dark:text-red-400">{errors.role}</p>}
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="font-semibold text-gray-700 dark:text-gray-200">Statut *</Label>
                                                        <Select
                                                            value={data.is_active ? '1' : '0'}
                                                            onValueChange={(value) => setData('is_active', value === '1')}
                                                            required
                                                        >
                                                            <SelectTrigger className="rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400">
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
                                                <Label className="font-semibold text-gray-700 dark:text-gray-200">Institutions</Label>
                                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                                    {institutions.map((institution) => (
                                                        <div key={institution.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`institution-${institution.id}`}
                                                                checked={data.institutions.includes(institution.id)}
                                                                onCheckedChange={(checked) => {
                                                                    setData(
                                                                        'institutions',
                                                                        checked
                                                                            ? [...data.institutions, institution.id]
                                                                            : data.institutions.filter((id) => id !== institution.id),
                                                                    );
                                                                }}
                                                            />
                                                            <label
                                                                htmlFor={`institution-${institution.id}`}
                                                                className="text-sm leading-none font-medium text-gray-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                                                            >
                                                                {institution.name}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="font-semibold text-gray-700 dark:text-gray-200">Photo de profil</Label>
                                                <div
                                                    {...getRootProps()}
                                                    className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                                                        isDragActive
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                                                    } hover:border-blue-400 hover:bg-blue-50/50`}
                                                >
                                                    <input {...getInputProps()} />
                                                    {avatarPreview ? (
                                                        <div className="flex flex-col items-center">
                                                            <img
                                                                src={avatarPreview}
                                                                alt="Preview"
                                                                className="mb-2 h-24 w-24 rounded-full border-4 border-blue-200 object-cover shadow-lg dark:border-blue-900"
                                                            />
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeAvatar();
                                                                }}
                                                                className="mt-1"
                                                            >
                                                                <Trash2 className="mr-1 h-4 w-4" />
                                                                Supprimer
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-300 shadow dark:from-blue-900 dark:to-blue-800">
                                                                <Users className="h-8 w-8 text-blue-400 dark:text-blue-200" />
                                                            </div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {isDragActive
                                                                    ? 'Déposez votre fichier ici...'
                                                                    : 'Glissez-déposez ou cliquez pour sélectionner une image'}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                                Formats acceptés: JPG, PNG (max 1Mo)
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </ScrollArea.Viewport>
                                    <ScrollArea.Scrollbar
                                        orientation="vertical"
                                        className="flex w-2.5 touch-none rounded-full bg-gray-100 transition-colors duration-150 ease-in-out select-none hover:bg-blue-200 dark:bg-gray-800 dark:hover:bg-blue-900"
                                    >
                                        <ScrollArea.Thumb className="relative flex-1 rounded-full bg-blue-300 dark:bg-blue-700" />
                                    </ScrollArea.Scrollbar>
                                </ScrollArea.Root>
                            </div>

                            {/* Footer */}
                            <DialogFooter className="border-t border-gray-100 px-8 py-5 dark:border-gray-800">
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={closeModal} disabled={processing}>
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={processing} className="bg-blue-600 text-white hover:bg-blue-700">
                                        {processing ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : currentUser ? (
                                            <>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Mettre à jour
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="mr-2 h-4 w-4" />
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
