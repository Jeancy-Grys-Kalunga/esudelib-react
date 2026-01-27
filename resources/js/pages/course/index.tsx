import { Head, router, useForm } from '@inertiajs/react';
import { BookOpen, Download, Edit, Loader2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import _ from 'lodash';

type Course = {
    id: number;
    title: string;
    orientation?: string;
    created_at: string;
};

type PageProps = {
    courses: Course[];
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

export default function CourseIndex({ courses: allCourses, can, flash, filters }: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [filteredCourses, setFilteredCourses] = useState<Course[]>(allCourses);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const { data, setData, post, put, errors, processing, reset } = useForm({
        title: '',
        orientation: '',
    });

    const importForm = useForm<{
        file: File | null;
    }>({
        file: null,
    });

    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleSearch = useMemo(() => {
        return _.debounce((term: string) => {
            if (!term) {
                setFilteredCourses(allCourses);
                setCurrentPage(1);
                return;
            }
            const results = allCourses.filter(
                (course) =>
                    course.title.toLowerCase().includes(term.toLowerCase()) ||
                    (course.orientation && course.orientation.toLowerCase().includes(term.toLowerCase())),
            );
            setFilteredCourses(results);
            setCurrentPage(1);
        }, 300);
    }, [allCourses]);

    useEffect(() => {
        handleSearch(searchTerm);
        return () => handleSearch.cancel();
    }, [searchTerm, handleSearch]);

    const paginatedCourses = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCourses, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

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
        if (currentCourse) {
            setData({
                title: currentCourse.title,
                orientation: currentCourse.orientation || '',
            });
        } else {
            reset();
        }
    }, [currentCourse]);

    const openModal = (course: Course | null = null) => {
        if ((course && !can.edit) || (!course && !can.create)) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }
        setCurrentCourse(course);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentCourse(null);
        reset();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (currentCourse) {
                await put(route('courses.update', currentCourse.id), {
                    onSuccess: () => closeModal(),
                });
            } else {
                await post(route('courses.store'), {
                    onSuccess: () => closeModal(),
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const openDeleteModal = (course: Course) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }
        setCourseToDelete(course);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!courseToDelete) return;

        router.delete(route('courses.destroy', courseToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setCourseToDelete(null);
            },
        });
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
        importForm.reset();
        setFile(null);
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast.error('Veuillez sélectionner un fichier');
            return;
        }

        setIsImporting(true);

        const formData = new FormData();
        formData.append('file', file);

        router.post(route('courses.import'), formData, {
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

    const resetFilters = () => {
        setSearchTerm('');
        setFilteredCourses(allCourses);
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
            <Head title="Gestion des Cours" />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestion des Cours</h1>
                        <p className="text-muted-foreground">{filteredCourses.length} cours enregistrés</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {can.create && (
                            <Button onClick={() => openModal()} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Nouveau Cours
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
                                placeholder="Rechercher un cours ou orientation..."
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
                                <CardTitle>Liste des Cours</CardTitle>
                                <CardDescription>{filteredCourses.length} cours correspondant aux critères</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredCourses.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead>Titre</TableHead>
                                                <TableHead>Orientation</TableHead>
                                                <TableHead>Date de création</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedCourses.map((course) => (
                                                <TableRow key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell className="font-medium">{course.title}</TableCell>
                                                    <TableCell>{course.orientation || '-'}</TableCell>
                                                    <TableCell>{course.created_at}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => openModal(course)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(course)}
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
                                <h3 className="mb-2 text-lg font-medium">Aucun cours trouvé</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer un nouveau cours.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={() => openModal()} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter un cours
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
                                <BookOpen className="h-5 w-5" />
                                {currentCourse ? 'Modifier Cours' : 'Nouveau Cours'}
                            </DialogTitle>
                            <DialogDescription>
                                {currentCourse ? 'Modifiez les informations du cours' : 'Remplissez les informations pour créer un nouveau cours'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="flex items-center gap-1">
                                        <BookOpen className="h-4 w-4" />
                                        Titre du cours *
                                    </Label>
                                    <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="orientation">Orientation (optionnel)</Label>
                                    <Input id="orientation" value={data.orientation} onChange={(e) => setData('orientation', e.target.value)} />
                                    {errors.orientation && <p className="text-sm text-red-500">{errors.orientation}</p>}
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
                                        ) : currentCourse ? (
                                            <>
                                                <Edit className="h-4 w-4" />
                                                Mettre à jour
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Créer le cours
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
                                Êtes-vous sûr de vouloir supprimer le cours "{courseToDelete?.title}" ? Cette action est irréversible.
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
                                Importer des cours
                            </DialogTitle>
                            <DialogDescription>Téléversez un fichier Excel contenant la liste des cours</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Fichier Excel *</Label>
                                <div
                                    className="cursor-pointer rounded-lg border-2 border-dashed bg-gray-50 p-6 text-center dark:bg-gray-800"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
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
                                <p className="text-sm text-gray-500">
                                    Le fichier doit contenir une colonne "Intitulé Cours" avec les noms des cours.
                                </p>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeImportModal}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={isImporting || !file} className="gap-2">
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
