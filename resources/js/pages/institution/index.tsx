import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Trash2, Edit, Plus, Upload, X, Image as ImageIcon, Loader2, Search } from 'lucide-react';
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

interface Institution {
    id: number;
    name: string;
    phone: string;
    address?: string;
    description?: string;
    image?: string;
    created_at: string;
}

interface PageProps {
    institutions: {
        data: Institution[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
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

export default function InstitutionIndex({ institutions, can, permissions, flash, filters }: PageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [institutionToDelete, setInstitutionToDelete] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        phone: '',
        address: '',
        description: '',
        document: [] as string[],
        search: filters?.search || '',
    });

    // Vérification des permissions
    const canImport = permissions.includes('create_institutions');
    const canView = permissions.includes('access_institutions');

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
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('phone', data.phone);
        formData.append('address', data.address || '');
        formData.append('description', data.description || '');
        
        files.forEach((file) => {
            formData.append('document[]', file);
        });

        if (currentInstitution) {
            put(route('institutions.update', currentInstitution.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('institutions.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (!can.delete) {
            toast.error("Vous n'avez pas la permission de supprimer");
            return;
        }

        setInstitutionToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!institutionToDelete) return;
        
        router.delete(route('institutions.destroy', institutionToDelete), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setInstitutionToDelete(null);
            }
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('institutions.index'), { search: searchTerm }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!canImport) {
            toast.error("Vous n'avez pas la permission d'importer");
            return;
        }

        if (!importFile) return;

        const formData = new FormData();
        formData.append('excel_file', importFile);

        router.post(route('institutions.import'), formData, {
            onSuccess: () => {
                setIsImportModalOpen(false);
                setImportFile(null);
            },
        });
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

            <div className="container mx-auto py-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Gestion des Institutions</h1>
                    
                    <div className="flex gap-2">
                        {can.create && (
                            <Button onClick={() => openModal()} className="gap-2">
                                <Plus size={16} />
                                Nouvelle Institution
                            </Button>
                        )}
                        
                        {canImport && (
                            <Button 
                                variant="outline" 
                                onClick={() => setIsImportModalOpen(true)}
                                className="gap-2"
                            >
                                <Upload size={16} />
                                Importer Excel
                            </Button>
                        )}
                    </div>
                </div>

                {/* Barre de recherche */}
                <div className="mb-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="search"
                                placeholder="Rechercher par nom, téléphone ou adresse..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Rechercher
                        </Button>
                        {searchTerm && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setSearchTerm('');
                                    router.get(route('institutions.index'));
                                }}
                            >
                                Réinitialiser
                            </Button>
                        )}
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {institutions.data.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Téléphone</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Adresse</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {institutions.data.map((institution) => (
                                        <TableRow key={institution.id}>
                                            <TableCell>
                                                {institution.image ? (
                                                    <img 
                                                        src={institution.image} 
                                                        alt={institution.name}
                                                        className="w-12 h-12 rounded-md object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
                                                        <ImageIcon className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{institution.name}</TableCell>
                                            <TableCell>{institution.phone}</TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {institution.description || 'N/A'}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {institution.address || 'N/A'}
                                            </TableCell>
                                            <TableCell>{new Date(institution.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {can.edit && (
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => openModal(institution)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {can.delete && (
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => handleDelete(institution.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                <div className="text-sm text-gray-500">
                                    Affichage de {institutions.from} à {institutions.to} sur {institutions.total} institutions
                                </div>
                                <div className="flex gap-1">
                                    {institutions.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                        >
                                            {index === 0 ? '« Précédent' : 
                                             index === institutions.links.length - 1 ? 'Suivant »' : 
                                             link.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            Aucune institution trouvée. {can.create && "Veuillez en créer une nouvelle."}
                        </div>
                    )}
                </div>

                {/* Modal pour créer/modifier une institution */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {currentInstitution ? 'Modifier Institution' : 'Nouvelle Institution'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
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
                                    className="w-full rounded border border-gray-300 p-2"
                                ></textarea>
                                {errors.description && (
                                    <p className="text-sm text-red-500">{errors.description}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Images (max 3)</Label>
                                <Dropzone
                                    maxFiles={3}
                                    accept={{
                                        'image/*': ['.jpeg', '.jpg', '.png']
                                    }}
                                    onDrop={(acceptedFiles) => {
                                        setFiles(acceptedFiles);
                                    }}
                                >
                                    {({ getRootProps, getInputProps }) => (
                                        <div
                                            {...getRootProps()}
                                            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
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
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {files.map((file, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={file.name}
                                                    className="w-16 h-16 object-cover rounded-md"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newFiles = [...files];
                                                        newFiles.splice(index, 1);
                                                        setFiles(newFiles);
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
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
                                        'Modifier'
                                    ) : (
                                        'Enregistrer'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal pour la confirmation de suppression */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Êtes-vous absolument sûr ?</DialogTitle>
                            <DialogDescription>
                                Cette action ne peut pas être annulée. Cela supprimera définitivement l'institution et toutes ses données associées.
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
                            >
                                Supprimer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal pour l'import Excel */}
                <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Importer des Institutions</DialogTitle>
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
                                            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
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
                                    <div className="mt-2 flex items-center gap-2">
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
                                <Button type="submit" disabled={!importFile}>
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