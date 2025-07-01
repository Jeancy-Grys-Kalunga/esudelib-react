import { Head, router, useForm } from '@inertiajs/react';
import { Edit, Loader2, Plus, Search, Trash2, Users, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

type ExamSession = {
    id: number;
    title: string;
    status: 'open' | 'closed';
    acceptance_rate: number;
    institution: string;
    institution_id: number;
    created_at: string;
};

type Institution = {
    id: number;
    name: string;
};

type PageProps = {
    examSessions: ExamSession[];
    institutions: Institution[];
    userInstitution?: { 
        id: number;
        name: string;
    } | null;
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

export default function ExamSessionIndex({ examSessions: allExamSessions, institutions, can, flash, filters,  userInstitution }: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentExamSession, setCurrentExamSession] = useState<ExamSession | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [examSessionToDelete, setExamSessionToDelete] = useState<ExamSession | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [filteredExamSessions, setFilteredExamSessions] = useState<ExamSession[]>(allExamSessions);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const { data, setData, post, put, errors, processing, reset } = useForm({
        title: '',
        status: 'open',
        acceptance_rate: 0,
        institution_id: userInstitution ? userInstitution.id.toString() : '',
    });

    const handleSearch = useMemo(() => {
        return _.debounce((term: string) => {
            if (!term) {
                setFilteredExamSessions(allExamSessions);
                setCurrentPage(1);
                return;
            }
            const results = allExamSessions.filter(
                (session) =>
                    session.title.toLowerCase().includes(term.toLowerCase()) ||
                    session.institution.toLowerCase().includes(term.toLowerCase()),
            );
            setFilteredExamSessions(results);
            setCurrentPage(1);
        }, 300);
    }, [allExamSessions]);

    useEffect(() => {
        handleSearch(searchTerm);
        return () => handleSearch.cancel();
    }, [searchTerm, handleSearch]);

    const paginatedExamSessions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredExamSessions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredExamSessions, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredExamSessions.length / itemsPerPage);

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
        if (currentExamSession) {
            setData({
                title: currentExamSession.title,
                status: currentExamSession.status,
                acceptance_rate: currentExamSession.acceptance_rate,
                institution_id: currentExamSession.institution_id.toString(),
            });
        } else {
            reset();
        }
    }, [currentExamSession]);

    const openModal = (session: ExamSession | null = null) => {
        if ((session && !can.edit) || (!session && !can.create)) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }
        setCurrentExamSession(session);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentExamSession(null);
        reset();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (currentExamSession) {
                await put(route('exam-sessions.update', currentExamSession.id), {
                    onSuccess: () => closeModal(),
                });
            } else {
                await post(route('exam-sessions.store'), {
                    onSuccess: () => closeModal(),
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const openDeleteModal = (session: ExamSession) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }
        setExamSessionToDelete(session);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!examSessionToDelete) return;

        router.delete(route('exam-sessions.destroy', examSessionToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setExamSessionToDelete(null);
            },
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilteredExamSessions(allExamSessions);
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
            <Head title="Gestion des Sessions d'Examens" />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestion des Sessions d'Examens</h1>
                        <p className="text-muted-foreground">{filteredExamSessions.length} sessions enregistrées</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {can.create && (
                            <Button onClick={() => openModal()} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Nouvelle Session
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
                                placeholder="Rechercher une session..."
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
                                <CardTitle>Liste des Sessions</CardTitle>
                                <CardDescription>{filteredExamSessions.length} sessions correspondant aux critères</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredExamSessions.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>Nom</TableHead>
                                                <TableHead>Statut</TableHead>
                                                <TableHead>Taux d'acceptation</TableHead>
                                                <TableHead>Institution</TableHead>
                                                <TableHead>Date de création</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedExamSessions.map((session) => (
                                                <TableRow key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell className="font-medium">{session.title}</TableCell>
                                                    <TableCell>
                                                    
                                                        <Badge 
                                                        // @ts-ignore
                                                        variant={session.status === 'open' ? 'success' : 'destructive'}>
                                                            {session.status === 'open' ? 'Ouverte' : 'Fermée'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{session.acceptance_rate}%</TableCell>
                                                    <TableCell>{session.institution}</TableCell>
                                                    <TableCell>{session.created_at}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => openModal(session)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(session)}
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
                                <h3 className="mb-2 text-lg font-medium">Aucune session trouvée</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer une nouvelle session.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={() => openModal()} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter une session
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
                                {currentExamSession ? 'Modifier Session' : 'Nouvelle Session'}
                            </DialogTitle>
                            <DialogDescription>
                                {currentExamSession ? 'Modifiez les informations de la session' : 'Remplissez les informations pour créer une nouvelle session'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">
                                        Nom de la session *
                                    </Label>
                                    <Input 
                                        id="title" 
                                        value={data.title} 
                                        onChange={(e) => setData('title', e.target.value)} 
                                        required 
                                    />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                </div>

                                  <div className="space-y-2">
                                <Label>
                                    Institution *
                                </Label>
                                {userInstitution ? (
                                    // Afficher l'institution de l'utilisateur sans possibilité de modification
                                    <div className="flex flex-col gap-1">
                                        <Input 
                                            value={userInstitution.name} 
                                            readOnly 
                                            className="bg-gray-100 dark:bg-gray-800"
                                        />
                                        <input 
                                            type="hidden" 
                                            value={userInstitution.id} 
                                            name="institution_id" 
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Vous êtes associé à cette institution
                                        </p>
                                    </div>
                                ) : (
                                    // Afficher le sélecteur pour les administrateurs
                                    <Select 
                                        value={data.institution_id} 
                                        onValueChange={(value) => setData('institution_id', value)} 
                                        required
                                    >
                                        <SelectTrigger>
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
                                )}
                                {errors.institution_id && <p className="text-sm text-red-500">{errors.institution_id}</p>}
                            </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>
                                            Statut *
                                        </Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={(value) => setData('status', value as 'open' | 'closed')}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionnez un statut" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="open">Ouverte</SelectItem>
                                                <SelectItem value="closed">Fermée</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="acceptance_rate">
                                            Taux d'acceptation (%) *
                                        </Label>
                                        <Input
                                            id="acceptance_rate"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={data.acceptance_rate}
                                            onChange={(e) => setData('acceptance_rate', parseInt(e.target.value))}
                                            required
                                        />
                                        {errors.acceptance_rate && <p className="text-sm text-red-500">{errors.acceptance_rate}</p>}
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
                                        ) : currentExamSession ? (
                                            <>
                                                <Edit className="h-4 w-4" />
                                                Mettre à jour
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Créer la session
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
                                Êtes-vous sûr de vouloir supprimer la session "{examSessionToDelete?.title}" ? Cette action est irréversible.
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