import { Head, router, useForm } from '@inertiajs/react';
import { ChevronDown, Edit, Loader2, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import * as ScrollArea from '@radix-ui/react-scroll-area';

type Role = {
    id: number;
    name: string;
    permissions: string[];
    created_at: string;
};

type PageProps = {
    roles: Role[];
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

// Structure des catégories de permissions
const permissionCategories = [
    {
        title: 'Tableau de Bord',
        permissions: [
            { id: 'show_total_stats', label: 'Total Stats' },
            { id: 'show_notifications', label: 'Notifications' },
            { id: 'show_month_overview', label: 'Aperçu Mensuel' },
            { id: 'show_monthly_cashflow', label: 'Mouvement Mensuel' },
        ],
    },
    {
        title: 'Gestion Utilisateurs',
        permissions: [
            { id: 'access_user_management', label: 'Accès' },
            { id: 'edit_own_profile', label: 'Seulement son Profile' },
        ],
    },
    {
        title: 'Étudiants',
        permissions: [
            { id: 'access_students', label: 'Accès' },
            { id: 'show_students', label: 'Voir' },
            { id: 'create_students', label: 'Créer' },
            { id: 'edit_students', label: 'Edition' },
            { id: 'delete_students', label: 'Suppréssion' },
            { id: 'import_students', label: 'Importer étudiants' },
            { id: 'payment_fees', label: 'Payer Frais Recours' },
            { id: 'create_appeals', label: 'Introduire Recours' },
            { id: 'edit_appeals', label: 'Edition Recours' },
        ],
    },
    {
        title: 'Année Académique',
        permissions: [
            { id: 'access_academic_years', label: 'Accès' },
            { id: 'create_academic_years', label: 'Créer' },
            { id: 'show_academic_years', label: 'Voir' },
            { id: 'edit_academic_years', label: 'Edition' },
            { id: 'delete_academic_years', label: 'Supprimer' },
        ],
    },
    {
        title: 'Départements',
        permissions: [
            { id: 'access_departments', label: 'Accès' },
            { id: 'create_departments', label: 'Créer' },
            { id: 'edit_departments', label: 'Edition' },
            { id: 'delete_departments', label: 'Supprimer' },
        ],
    },
    {
        title: 'Promotions',
        permissions: [
            { id: 'access_promotions', label: 'Accès' },
            { id: 'create_promotions', label: 'Créer' },
            { id: 'show_promotions', label: 'Voir' },
            { id: 'edit_promotions', label: 'Edition' },
            { id: 'delete_promotions', label: 'Supprimer' },
        ],
    },
    {
        title: 'Institutions',
        permissions: [
            { id: 'access_institutions', label: 'Accès' },
            { id: 'create_institutions', label: 'Créer' },
            { id: 'show_institutions', label: 'Voir' },
            { id: 'edit_institutions', label: 'Edition' },
            { id: 'delete_institutions', label: 'Supprimer' },
        ],
    },
    {
        title: 'Jury',
        permissions: [
            { id: 'access_juries', label: 'Accès' },
            { id: 'create_juries', label: 'Créer' },
            { id: 'show_juries', label: 'Voir' },
            { id: 'edit_juries', label: 'Edition' },
            { id: 'delete_juries', label: 'Supprimer' },
            { id: 'import_notes', label: 'Importer Notes Etudiants' },
            { id: 'send_results', label: 'Publier Résultats' },
            { id: 'access_expert_system', label: 'Système Expert' },
            { id: 'add_observation', label: 'Ajouter Observation Jury' },
            { id: 'access_appeals', label: 'Accéder aux Recours' },
            { id: 'show_appeals', label: 'Voir Recours Introduit' },
            { id: 'delete_appeals', label: 'Supprimer Recours' },
        ],
    },
    {
        title: 'Cours',
        permissions: [
            { id: 'access_courses', label: 'Accès' },
            { id: 'create_courses', label: 'Créer' },
            { id: 'show_courses', label: 'Voir' },
            { id: 'edit_courses', label: 'Edition' },
            { id: 'delete_courses', label: 'Supprimer' },
            { id: 'import_courses', label: 'Importer Cours' },
        ],
    },
    {
        title: 'Inscriptions',
        permissions: [
            { id: 'access_inscriptions', label: 'Accès' },
            { id: 'create_inscriptions', label: 'Créer' },
            { id: 'show_inscriptions', label: 'Voir' },
            { id: 'edit_inscriptions', label: 'Edition' },
            { id: 'delete_inscriptions', label: 'Supprimer' },
            { id: 'import_inscriptions', label: 'Importer Inscriptions' },
        ],
    },
    {
        title: 'Facultés',
        permissions: [
            { id: 'access_faculties', label: 'Accès' },
            { id: 'create_faculties', label: 'Créer' },
            { id: 'show_faculties', label: 'Voir' },
            { id: 'edit_faculties', label: 'Edition' },
            { id: 'delete_faculties', label: 'Supprimer' },
            { id: 'import_faculties', label: 'Importer Facultés' },
        ],
    },
    {
        title: 'Enseignants',
        permissions: [
            { id: 'access_teachers', label: 'Accès' },
            { id: 'create_teachers', label: 'Créer' },
            { id: 'show_teachers', label: 'Voir' },
            { id: 'edit_teachers', label: 'Edition' },
            { id: 'delete_teachers', label: 'Supprimer' },
            { id: 'import_teachers', label: 'Importer Enseignants' },
        ],
    },
    {
        title: 'Charge Horaire',
        permissions: [
            { id: 'access_attributions', label: 'Accès' },
            { id: 'create_attributions', label: 'Créer' },
            { id: 'show_attributions', label: 'Voir' },
            { id: 'edit_attributions', label: 'Edition' },
            { id: 'delete_attributions', label: 'Supprimer' },
        ],
    },
    {
        title: 'Programmes',
        permissions: [
            { id: 'access_programs', label: 'Accès' },
            { id: 'create_programs', label: 'Créer' },
            { id: 'show_programs', label: 'Voir' },
            { id: 'edit_programs', label: 'Edition' },
            { id: 'delete_programs', label: 'Supprimer' },
        ],
    },
    {
        title: "Unités d'Enseignements",
        permissions: [
            { id: 'access_unit_teachings', label: 'Accès' },
            { id: 'create_unit_teachings', label: 'Créer' },
            { id: 'show_unit_teachings', label: 'Voir' },
            { id: 'edit_unit_teachings', label: 'Edition' },
            { id: 'delete_unit_teachings', label: 'Supprimer' },
            { id: 'import_unit_teachings', label: 'Importer Unités' },
        ],
    },
    {
        title: 'Dévises',
        permissions: [
            { id: 'access_currencies', label: 'Accès' },
            { id: 'create_currencies', label: 'Créer' },
            { id: 'edit_currencies', label: 'Edition' },
            { id: 'delete_currencies', label: 'Supprimer' },
        ],
    },
    {
        title: 'Rapports',
        permissions: [{ id: 'access_reports', label: 'Accès' }],
    },
    {
        title: 'Paramètres',
        permissions: [
            { id: 'access_settings', label: 'Accès' },
            { id: 'access_semestre', label: 'Semestres' },
        ],
    },
    {
        title: 'Palmarès',
        permissions: [{ id: 'access_palmares', label: 'Accès' }],
    },
];

export default function RolesIndex({ roles: allRoles, can, flash }: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRole, setCurrentRole] = useState<Role | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredRoles, setFilteredRoles] = useState<Role[]>(allRoles);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [openCategories, setOpenCategories] = useState<string[]>([]);

    const { data, setData, post, put, errors, processing, reset } = useForm({
        name: '',
        permissions: [] as string[],
    });

    // Toggle l'ouverture d'une catégorie
    const toggleCategory = (title: string) => {
        setOpenCategories((prev) => (prev.includes(title) ? prev.filter((cat) => cat !== title) : [...prev, title]));
    };

    // Sélectionner/désélectionner toutes les permissions
    const toggleSelectAll = () => {
        if (data.permissions.length === allPermissions.length) {
            setData('permissions', []);
        } else {
            setData('permissions', [...allPermissions]);
        }
    };

    // Toggle une permission individuelle
    const togglePermission = (permission: string) => {
        if (data.permissions.includes(permission)) {
            setData(
                'permissions',
                data.permissions.filter((p) => p !== permission),
            );
        } else {
            setData('permissions', [...data.permissions, permission]);
        }
    };

    // Liste de toutes les permissions
    const allPermissions = useMemo(() => {
        return permissionCategories.flatMap((category) => category.permissions.map((p) => p.id));
    }, []);

    // Gestion de la recherche
    const handleSearch = useMemo(() => {
        return (term: string) => {
            if (!term) {
                setFilteredRoles(allRoles);
                setCurrentPage(1);
                return;
            }
            const results = allRoles.filter((role) => role.name.toLowerCase().includes(term.toLowerCase()));
            setFilteredRoles(results);
            setCurrentPage(1);
        };
    }, [allRoles]);

    useEffect(() => {
        handleSearch(searchTerm);
    }, [searchTerm, handleSearch]);

    const paginatedRoles = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRoles.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredRoles, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

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

    // Pré-remplir le formulaire quand on édite un rôle
    useEffect(() => {
        if (currentRole) {
            setData({
                name: currentRole.name,
                permissions: [...currentRole.permissions],
            });
        } else {
            reset();
        }
    }, [currentRole]);

    const openModal = (role: Role | null = null) => {
        if ((role && !can.edit) || (!role && !can.create)) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }
        setCurrentRole(role);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentRole(null);
        reset();
        setOpenCategories([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (currentRole) {
                await put(route('roles.update', currentRole.id), {
                    onSuccess: () => closeModal(),
                });
            } else {
                await post(route('roles.store'), {
                    onSuccess: () => closeModal(),
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const openDeleteModal = (role: Role) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }
        setRoleToDelete(role);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!roleToDelete) return;

        router.delete(route('roles.destroy', roleToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setRoleToDelete(null);
            },
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilteredRoles(allRoles);
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
            <Head title="Gestion des Rôles" />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestion des Rôles</h1>
                        <p className="text-muted-foreground">{filteredRoles.length} rôles enregistrés</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {can.create && (
                            <Button onClick={() => openModal()} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Ajouter un rôle
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
                                placeholder="Rechercher un rôle..."
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
                                <CardTitle>Liste des Rôles</CardTitle>
                                <CardDescription>{filteredRoles.length} rôles correspondant aux critères</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredRoles.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>#</TableHead>
                                                <TableHead>Rôle</TableHead>
                                                <TableHead>Permissions</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedRoles.map((role) => (
                                                <TableRow key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell className="font-medium">{role.id}</TableCell>
                                                    <TableCell className="font-medium">{role.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {role.permissions.slice(0, 3).map((permission) => (
                                                                <Badge key={permission} variant="outline">
                                                                    {permission}
                                                                </Badge>
                                                            ))}
                                                            {role.permissions.length > 3 && (
                                                                <Badge variant="secondary">+{role.permissions.length - 3}</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => openModal(role)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(role)}
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
                                <h3 className="mb-2 text-lg font-medium">Aucun rôle trouvé</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer un nouveau rôle.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={() => openModal()} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter un rôle
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modal pour créer/modifier un rôle */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-6xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">{currentRole ? 'Modifier Rôle' : 'Nouveau Rôle'}</DialogTitle>
                            <DialogDescription>
                                {currentRole ? 'Modifiez les informations du rôle' : 'Remplissez les informations pour créer un nouveau rôle'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                            {/* Bloc d'erreurs globales */}
                            {Object.keys(errors).length > 0 && (
                                <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Erreurs de validation</h3>
                                    <ul className="mt-2 list-disc space-y-1 pl-5">
                                        {Object.entries(errors).map(([key, error]) => (
                                            <li key={key} className="text-sm text-red-700 dark:text-red-300">
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 md:grid-cols-3">
                                {/* Colonne gauche - Nom du rôle et sélection globale */}
                                <div className="space-y-4 md:col-span-1">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nom du rôle *</Label>
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
                                        <Label>Permissions *</Label>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="select-all"
                                                checked={data.permissions.length === allPermissions.length}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                            <label
                                                htmlFor="select-all"
                                                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Assigner toutes les permissions
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Colonne droite - Liste des permissions */}
                                <div className="flex min-h-0 flex-col md:col-span-2">
                                    <ScrollArea.Root className="flex-1 overflow-hidden" type="auto">
                                        <ScrollArea.Viewport className="h-full w-full pr-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                {permissionCategories.map((category) => (
                                                    <Collapsible
                                                        key={category.title}
                                                        open={openCategories.includes(category.title)}
                                                        onOpenChange={() => toggleCategory(category.title)}
                                                        className="rounded-md border"
                                                    >
                                                        <CollapsibleTrigger asChild>
                                                            <div className="flex cursor-pointer items-center justify-between bg-gray-50 p-4 dark:bg-gray-800">
                                                                <h3 className="font-semibold">{category.title}</h3>
                                                                <ChevronDown
                                                                    className={`transform transition-transform ${
                                                                        openCategories.includes(category.title) ? 'rotate-180' : ''
                                                                    }`}
                                                                />
                                                            </div>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                                                                {category.permissions.map((permission) => (
                                                                    <div key={permission.id} className="flex items-center space-x-2">
                                                                        <Checkbox
                                                                            id={permission.id}
                                                                            checked={data.permissions.includes(permission.id)}
                                                                            onCheckedChange={() => togglePermission(permission.id)}
                                                                        />
                                                                        <label
                                                                            htmlFor={permission.id}
                                                                            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                                        >
                                                                            {permission.label}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                ))}
                                            </div>
                                        </ScrollArea.Viewport>
                                        <ScrollArea.Scrollbar
                                            orientation="vertical"
                                            className="flex w-2.5 touch-none bg-gray-100 transition-colors duration-150 ease-in-out select-none hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                                        >
                                            <ScrollArea.Thumb className="relative flex-1 rounded-full bg-gray-300 before:absolute before:top-1/2 before:left-1/2 before:h-full before:min-h-[44px] before:w-full before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] dark:bg-gray-600" />
                                        </ScrollArea.Scrollbar>
                                        <ScrollArea.Corner />
                                    </ScrollArea.Root>

                                    {errors.permissions && <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.permissions}</p>}
                                </div>
                            </div>

                            {/* Footer */}
                            <DialogFooter className="bg-background mt-6 py-4">
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={closeModal} disabled={processing}>
                                        Annuler
                                    </Button>
                                    <Button type="submit" disabled={processing} className="gap-2">
                                        {processing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : currentRole ? (
                                            <>
                                                <Edit className="h-4 w-4" />
                                                Mettre à jour
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Créer le rôle
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
                                Êtes-vous sûr de vouloir supprimer le rôle "{roleToDelete?.name}" ? Cette action est irréversible.
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
