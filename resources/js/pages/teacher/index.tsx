import { Head, router, useForm } from '@inertiajs/react';
import { Calendar, Contact, Edit, GraduationCap, Image as ImageIcon, Loader2, Plus, Search, Trash2, Upload, User, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import Dropzone from 'react-dropzone';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import axios from 'axios';
import _ from 'lodash';

import { MultiSelect } from '@/components/multi-select';

type Teacher = {
    id: number;
    matricule: string;
    name: string;
    gendre: string;
    date_of_birth: string;
    grade: string;
    academic_level: string;
    date_of_hire: string;
    specialty: string;
    address?: string;
    phone?: string;
    institutions?: number[];
    created_at?: string;
    documents?: { url: string; thumb: string }[];
};

type Institution = {
    id: string;
    name: string;
};

type PageProps = {
    teachers: Teacher[];
    institutions: Institution[];
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        access: boolean;
        import?: boolean;
    };
    permissions: string[];
    flash?: {
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    };
    filters?: {
        search?: string;
    };
};

export default function TeacherIndex({ teachers: allTeachers, institutions, can, flash, filters }: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);

    const {
        data: importData,
        setData: setImportData,
        post: postImport,
        processing: importProcessing,
        reset: resetImport,
        errors: importErrors,
    } = useForm({
        file: null as File | null,
        institution_id: '',
    });

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postImport(route('teachers.import'), {
            onSuccess: () => {
                setIsImportModalOpen(false);
                resetImport();
            },
        });
    };
    const [files, setFiles] = useState<File[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>(allTeachers);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [uploadProgress, setUploadProgress] = useState(0);

    const { data, setData, post, put, errors, processing, reset } = useForm({
        matricule: '',
        name: '',
        gendre: 'Masculin',
        date_of_birth: '',
        grade: 'Gradué(e)',
        academic_level: 'Chargé(e) de cours',
        date_of_hire: '',
        specialty: '',
        phone: '',
        address: '',
        institutions: [] as string[],
        document: [] as string[],
    });

    const handleSearch = useMemo(() => {
        return _.debounce((term: string) => {
            if (!term) {
                setFilteredTeachers(allTeachers);
                setCurrentPage(1);
                return;
            }
            const results = allTeachers.filter(
                (teacher) =>
                    teacher.name.toLowerCase().includes(term.toLowerCase()) ||
                    (teacher.matricule && teacher.matricule.toLowerCase().includes(term.toLowerCase())) ||
                    (teacher.phone && teacher.phone.includes(term)),
            );
            setFilteredTeachers(results);
            setCurrentPage(1);
        }, 300);
    }, [allTeachers]);

    useEffect(() => {
        handleSearch(searchTerm);
        return () => handleSearch.cancel();
    }, [searchTerm, handleSearch]);

    const paginatedTeachers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTeachers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTeachers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

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
        if (currentTeacher) {
            setData({
                matricule: currentTeacher.matricule,
                name: currentTeacher.name,
                gendre: currentTeacher.gendre,
                date_of_birth: currentTeacher.date_of_birth,
                grade: currentTeacher.grade,
                academic_level: currentTeacher.academic_level,
                date_of_hire: currentTeacher.date_of_hire,
                specialty: currentTeacher.specialty,
                phone: currentTeacher.phone ?? '',
                address: currentTeacher.address ?? '',
                institutions: (currentTeacher.institutions || []).map(String),
                document: currentTeacher.documents?.map((d) => d.url) || [],
            });
        } else {
            reset();
            setFiles([]);
        }
    }, [currentTeacher]);

    const openModal = (teacher: Teacher | null = null) => {
        if ((teacher && !can.edit) || (!teacher && !can.create)) {
            toast.error("Vous n'avez pas les permissions nécessaires");
            return;
        }
        setCurrentTeacher(teacher);
        setFiles([]);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentTeacher(null);
        reset();
        setUploadProgress(0);
        setFiles([]);
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
            toast.error("Échec de l'upload");
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
            toast.error('Échec de la suppression du fichier');
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        const fields = {
            matricule: data.matricule,
            name: data.name,
            gendre: data.gendre,
            date_of_birth: data.date_of_birth,
            grade: data.grade,
            academic_level: data.academic_level,
            date_of_hire: data.date_of_hire,
            specialty: data.specialty,
            phone: data.phone,
            address: data.address,
            institutions: data.institutions,
            document: data.document,
        };

        Object.entries(fields).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((v) => formData.append(`${key}[]`, v));
            } else if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });

        try {
            if (currentTeacher) {
                await put(route('teachers.update', currentTeacher.id), {
                    onSuccess: () => closeModal(),
                });
            } else {
                await post(route('teachers.store'), {
                    onSuccess: () => closeModal(),
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const openDeleteModal = (teacher: Teacher) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }
        setTeacherToDelete(teacher);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!teacherToDelete) return;

        router.delete(route('teachers.destroy', teacherToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setTeacherToDelete(null);
            },
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilteredTeachers(allTeachers);
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
            <Head title="Gestion des Enseignants" />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestion des Enseignants</h1>
                        <p className="text-muted-foreground">{filteredTeachers.length} enseignants enregistrés</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {can.create && (
                            <Button onClick={() => openModal()} className="gap-2 shadow-sm">
                                <Plus size={16} />
                                Nouvel Enseignant
                            </Button>
                        )}
                        {can.import && (
                            <Button onClick={() => setIsImportModalOpen(true)} variant="secondary" className="gap-2 shadow-sm">
                                <Upload size={16} />
                                Importer
                            </Button>
                        )}
                        <Button variant="outline" onClick={resetFilters} className="gap-2 shadow-sm">
                            <X size={16} />
                            Réinitialiser
                        </Button>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) => {
                                setItemsPerPage(Number(value));
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[180px] shadow-sm">
                                <SelectValue placeholder="Lignes par page" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 lignes</SelectItem>
                                <SelectItem value="50">50 lignes</SelectItem>
                                <SelectItem value="100">100 lignes</SelectItem>
                                <SelectItem value="500">500 lignes</SelectItem>
                                <SelectItem value="1000">1000 lignes</SelectItem>
                            </SelectContent>
                        </Select>
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
                                placeholder="Rechercher un enseignant..."
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
                                <CardTitle>Liste des Enseignants</CardTitle>
                                <CardDescription>{filteredTeachers.length} enseignants correspondant aux critères</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredTeachers.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                            <TableRow>
                                                <TableHead className="w-[80px]">Photo</TableHead>
                                                <TableHead>Matricule</TableHead>
                                                <TableHead>Nom</TableHead>
                                                <TableHead>Genre</TableHead>
                                                <TableHead>Spécialité</TableHead>
                                                <TableHead>Grade</TableHead>
                                                <TableHead>Engagement</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedTeachers.map((teacher) => (
                                                <TableRow key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <TableCell>
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={teacher.documents?.[0]?.thumb || ''} alt={teacher.name} />
                                                            <AvatarFallback>{teacher.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                    </TableCell>
                                                    <TableCell>{teacher.matricule}</TableCell>
                                                    <TableCell>{teacher.name}</TableCell>
                                                    <TableCell>{teacher.gendre}</TableCell>
                                                    <TableCell>{teacher.specialty}</TableCell>
                                                    <TableCell>{teacher.academic_level}</TableCell>
                                                    <TableCell>
                                                        {teacher.date_of_hire && new Date(teacher.date_of_hire).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {can.edit && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => openModal(teacher)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {can.delete && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => openDeleteModal(teacher)}
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
                                    <ImageIcon className="h-10 w-10 text-gray-400" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium">Aucun enseignant trouvé</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {can.create ? 'Commencez par créer un nouvel enseignant.' : 'Aucune donnée disponible.'}
                                </p>
                                {can.create && (
                                    <Button onClick={() => openModal()} className="gap-2">
                                        <Plus size={16} />
                                        Ajouter un enseignant
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <GraduationCap className="h-5 w-5" />
                                {currentTeacher ? 'Modifier Enseignant' : 'Nouvel Enseignant'}
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
                                                <User className="h-4 w-4" />
                                                Nom complet *
                                            </Label>
                                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="matricule" className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                Matricule *
                                            </Label>
                                            <Input
                                                id="matricule"
                                                value={data.matricule}
                                                onChange={(e) => setData('matricule', e.target.value)}
                                                required
                                            />
                                            {errors.matricule && <p className="text-sm text-red-500">{errors.matricule}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Date de naissance *
                                            </Label>
                                            <Input
                                                type="date"
                                                value={data.date_of_birth}
                                                onChange={(e) => setData('date_of_birth', e.target.value)}
                                                required
                                            />
                                            {errors.date_of_birth && <p className="text-sm text-red-500">{errors.date_of_birth}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-1">
                                                <Contact className="h-4 w-4" />
                                                Téléphone *
                                            </Label>
                                            <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} required />
                                            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                        </div>

                                        <div className="space-y-3">
                                            <Label>Institutions</Label>
                                            <MultiSelect
                                                options={institutions.map((i) => ({
                                                    value: i.id.toString(),
                                                    label: i.name,
                                                }))}
                                                selected={data.institutions.map(String)}
                                                onChange={(selected) => setData('institutions', selected)}
                                                placeholder="Sélectionnez des institutions..."
                                            />
                                        </div>
                                        {errors.institutions && <p className="text-sm text-red-500">{errors.institutions}</p>}
                                    </div>

                                    {/* Colonne Droite */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Genre *</Label>
                                            <Select value={data.gendre} onValueChange={(value) => setData('gendre', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionnez un genre" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Masculin">Masculin</SelectItem>
                                                    <SelectItem value="Féminin">Féminin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.gendre && <p className="text-sm text-red-500">{errors.gendre}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Niveau d'étude *</Label>
                                            <Select value={data.grade} onValueChange={(value) => setData('grade', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionnez un niveau" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Gradué(e)">Gradué(e)</SelectItem>
                                                    <SelectItem value="Licencié(e)">Licencié(e)</SelectItem>
                                                    <SelectItem value="Master">Master</SelectItem>
                                                    <SelectItem value="Doctorat">Doctorat</SelectItem>
                                                    <SelectItem value="PhD">PhD</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.grade && <p className="text-sm text-red-500">{errors.grade}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Grade académique *</Label>
                                            <Select value={data.academic_level} onValueChange={(value) => setData('academic_level', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionnez un grade" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Chargé(e) de cours">Chargé(e) de cours</SelectItem>
                                                    <SelectItem value="Assistant(e)">Assistant(e)</SelectItem>
                                                    <SelectItem value="Chef de travaux">Chef de travaux</SelectItem>
                                                    <SelectItem value="Professeur associé">Professeur associé</SelectItem>
                                                    <SelectItem value="Professeur">Professeur</SelectItem>
                                                    <SelectItem value="Professeur ordinaire">Professeur ordinaire</SelectItem>
                                                    <SelectItem value="Professeur émerite">Professeur émerite</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.academic_level && <p className="text-sm text-red-500">{errors.academic_level}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Spécialité *</Label>
                                            <Input value={data.specialty} onChange={(e) => setData('specialty', e.target.value)} required />
                                            {errors.specialty && <p className="text-sm text-red-500">{errors.specialty}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Adresse</Label>
                                            <textarea
                                                className="focus:ring-primary-500 w-full rounded-md border p-2 focus:border-transparent focus:ring-2"
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                                rows={3}
                                            />
                                            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Section des images */}
                                <div className="space-y-4">
                                    <Label>Photos (max 3)</Label>
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
                                        {currentTeacher?.documents?.map((doc, idx) => (
                                            <div key={idx} className="relative">
                                                <img
                                                    src={doc.thumb}
                                                    alt={currentTeacher.name}
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
                                        ) : currentTeacher ? (
                                            <>
                                                <Edit className="h-4 w-4" />
                                                Mettre à jour
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Créer l'enseignant
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={isImportModalOpen}
                    onOpenChange={(open) => {
                        setIsImportModalOpen(open);
                        if (!open) {
                            setFiles([]);
                            resetImport();
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Importer des enseignants
                            </DialogTitle>
                            <DialogDescription>
                                Sélectionnez un fichier Excel (.xlsx, .xls) contenant la liste des enseignants à importer.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleImportSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="institution">Institution de rattachement</Label>
                                <Select value={importData.institution_id} onValueChange={(value) => setImportData('institution_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une institution" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {institutions.map((institution) => (
                                            <SelectItem key={institution.id} value={institution.id.toString()}>
                                                {institution.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {importErrors.institution_id && <p className="text-sm text-red-500">{importErrors.institution_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="file">Fichier Excel</Label>
                                <div
                                    className="cursor-pointer rounded-lg border-2 border-dashed bg-gray-50 p-6 text-center dark:bg-gray-800"
                                    onClick={() => !importProcessing && document.getElementById('file-upload-teacher')?.click()}
                                >
                                    <input
                                        id="file-upload-teacher"
                                        type="file"
                                        className="hidden"
                                        accept=".xlsx, .xls"
                                        disabled={importProcessing}
                                        onChange={(e) => setImportData('file', e.target.files ? e.target.files[0] : null)}
                                    />
                                    {importData.file ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="font-medium">{importData.file.name}</p>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImportData('file', null);
                                                }}
                                            >
                                                Retirer le fichier
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                                                <Upload className="h-6 w-6" />
                                            </div>
                                            <p className="font-medium">Cliquer pour sélectionner un fichier</p>
                                            <p className="text-muted-foreground mt-1 text-xs">XLSX, XLS (max 10MB)</p>
                                        </>
                                    )}
                                </div>
                                {importErrors.file && <p className="text-sm text-red-500">{importErrors.file}</p>}

                                <div className="mt-4 rounded-md bg-blue-50 p-3 dark:bg-blue-950">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Format attendu :</p>
                                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                                        Colonnes requises : <strong>nom_complet, matricule, date_naissance, sexe</strong>.
                                    </p>
                                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                                        Autres colonnes : <strong>grade, niveau_etude, specialite, telephone</strong>.
                                    </p>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={importProcessing}>
                                    {importProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importation...
                                        </>
                                    ) : (
                                        'Importer'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Confirmer la suppression</DialogTitle>
                            <DialogDescription>
                                Êtes-vous sûr de vouloir supprimer l'enseignant "{teacherToDelete?.name}" ? Cette action est irréversible.
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
