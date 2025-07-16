import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileInput } from '@/components/ui/file-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, BadgeCheck, BookText, File, Loader2, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';

// Définir le type pour les erreurs
type ErrorsType = {
    objects?: string;
    justification?: string;
    documents?: string;
    payment_error?: string;
};

// Définir le type pour les props de la page
type PageProps = {
    course: {
        id: number;
        title: string;
        code: string;
    };
    note: {
        cote: number;
        session: string;
        situation: string;
    };
    appeal_fee: number;
    has_pending_payment: boolean;
    pending_payment_url?: string;
    payment_redirect?: string; // Nouvelle propriété
    errors?: ErrorsType;
};

const CreateAppeal = () => {
    // Récupérer les props de la page
    const { props } = usePage<PageProps>();
    const {
        course,
        note,
        appeal_fee,
        has_pending_payment,
        pending_payment_url,
        payment_redirect, // Récupérer la nouvelle prop
    } = props;

    // Extraire les erreurs avec un type sûr
    const errors = props.errors || ({} as ErrorsType);

    const [objects, setObjects] = useState(['']);
    const [justification, setJustification] = useState('');
    const [documents, setDocuments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRedirectOverlay, setShowRedirectOverlay] = useState(false);

    // Redirection si payment_redirect est présent
    useEffect(() => {
        if (payment_redirect) {
            setShowRedirectOverlay(true);
            window.location.href = payment_redirect;
        }
    }, [payment_redirect]);

    const handleAddObject = () => {
        setObjects([...objects, '']);
    };

    const handleRemoveObject = (index: number) => {
        const newObjects = objects.filter((_, i) => i !== index);
        setObjects(newObjects);
    };

    const handleObjectChange = (index: number, value: string) => {
        const newObjects = [...objects];
        newObjects[index] = value;
        setObjects(newObjects);
    };

    const submit = () => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('justification', justification);

        // Envoyer les objets sous forme de tableau
        objects.forEach((obj, index) => {
            formData.append(`objects[${index}]`, obj);
        });

        documents.forEach((file) => {
            formData.append('documents[]', file);
        });

        router.post(`/student/appeals/${course.id}`, formData, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Si un paiement est en attente, afficher un message
    if (has_pending_payment) {
        return (
            <AppLayout>
                <Head title="Déposer un Recours" />
                <div className="container mx-auto px-4 py-12 sm:px-6">
                    <div className="mx-auto max-w-4xl text-center">
                        <AlertTriangle className="mx-auto mb-6 h-16 w-16 text-yellow-500" />
                        <h1 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl">Paiement en attente</h1>
                        <p className="mb-8 text-lg text-gray-600">
                            Vous avez déjà initié un recours pour ce cours. Veuillez compléter le processus de paiement avant de soumettre un nouveau
                            recours.
                        </p>

                        {/* Bouton pour accéder au paiement en attente */}
                        {pending_payment_url ? (
                            <Button
                                onClick={() => (window.location.href = pending_payment_url)}
                                className="bg-indigo-600 px-8 py-4 text-lg text-white hover:bg-indigo-700"
                            >
                                Accéder au paiement
                            </Button>
                        ) : (
                            <Button
                                onClick={() => window.location.reload()}
                                className="bg-indigo-600 px-8 py-4 text-lg text-white hover:bg-indigo-700"
                            >
                                Actualiser la page
                            </Button>
                        )}
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Déposer un Recours" />
            <div className="container mx-auto px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-8 flex items-center gap-3">
                        <AlertCircle className="h-10 w-10 text-indigo-600" strokeWidth={1.5} />
                        <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                            Déposer un Recours
                        </h1>
                    </div>

                    {/* Afficher les erreurs globales */}
                    {errors?.payment_error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
                            <AlertCircle className="mr-2 inline" />
                            {errors.payment_error}
                        </div>
                    )}

                    {/* Overlay de redirection */}
                    {showRedirectOverlay && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                            <div className="bg-white rounded-xl p-8 text-center max-w-md">
                                <Loader2 className="animate-spin w-12 h-12 mx-auto text-indigo-600 mb-4" />
                                <h2 className="text-xl font-bold mb-2">Redirection vers le paiement</h2>
                                <p className="mb-6">Vous allez être redirigé vers la plateforme de paiement CinetPay...</p>
                                <Button 
                                    onClick={() => window.location.href = payment_redirect!}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    Cliquez ici si la redirection ne fonctionne pas
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Section Informations du Cours */}
                        <Card className="overflow-hidden rounded-2xl border-0 shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
                                <CardTitle className="flex items-center gap-3">
                                    <BookText className="h-6 w-6" />
                                    <div>
                                        <h2 className="text-xl font-bold">Détails du Cours</h2>
                                        <Badge className="mt-1 bg-indigo-800 text-white hover:bg-indigo-900">{course.code}</Badge>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 p-6">
                                <div className="space-y-2">
                                    <Label className="font-medium text-gray-500">Titre du Cours</Label>
                                    <p className="text-lg font-semibold text-gray-800">{course.title}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label className="font-medium text-gray-500">Note</Label>
                                        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                                            <span className={`text-xl font-bold ${note.cote < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                                {note.cote}/20
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-medium text-gray-500">Session</Label>
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                            <p className="font-medium">{note.session}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-medium text-gray-500">Situation</Label>
                                    <Badge variant={note.situation === 'Échec' ? 'destructive' : 'default'} className="px-4 py-2 text-base">
                                        {note.situation}
                                    </Badge>
                                </div>

                                <div className="space-y-2 border-t border-gray-100 pt-4">
                                    <Label className="font-medium text-gray-500">Frais de Recours</Label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-red-600">{appeal_fee} CDF</span>
                                        <Badge variant="secondary" className="text-xs">
                                            Non remboursable
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Formulaire de Recours */}
                        <Card className="overflow-hidden rounded-2xl border-0 shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
                                <CardTitle className="flex items-center gap-3">
                                    <BadgeCheck className="h-6 w-6" />
                                    <h2 className="text-xl font-bold">Votre Recours</h2>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        submit();
                                    }}
                                    className="space-y-6"
                                >
                                    {/* Objets du Recours */}
                                    <div className="space-y-4">
                                        <Label className="flex items-center gap-2 font-semibold text-gray-700">
                                            <span>Objets du Recours</span>
                                            <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="space-y-3">
                                            {objects.map((obj, index) => (
                                                <div key={index} className="flex items-start gap-3">
                                                    <div className="relative flex-1">
                                                        <Input
                                                            value={obj}
                                                            onChange={(e) => handleObjectChange(index, e.target.value)}
                                                            placeholder={`Objet ${index + 1}`}
                                                            required
                                                            className="border-gray-300 py-5 pl-10 text-base focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                        <span className="absolute top-1/2 left-3 -translate-y-1/2 transform font-medium text-gray-400">
                                                            {index + 1}.
                                                        </span>
                                                    </div>
                                                    {objects.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="mt-1"
                                                            onClick={() => handleRemoveObject(index)}
                                                        >
                                                            <X className="h-5 w-5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {errors?.objects && <p className="mt-2 text-sm text-red-500">{errors.objects}</p>}
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleAddObject}
                                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                        >
                                            <Plus className="mr-2 h-5 w-5" />
                                            Ajouter un autre objet
                                        </Button>
                                    </div>

                                    {/* Champ Justification */}
                                    <div className="space-y-3">
                                        <Label htmlFor="justification" className="flex items-center gap-2 font-semibold text-gray-700">
                                            <span>Justification Détaillée</span>
                                            <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="justification"
                                            value={justification}
                                            onChange={(e) => setJustification(e.target.value)}
                                            placeholder="Décrivez précisément les raisons de votre recours..."
                                            required
                                            rows={6}
                                            className="min-h-[150px] border-gray-300 text-base focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                        {errors?.justification && <p className="mt-2 text-sm text-red-500">{errors.justification}</p>}
                                    </div>

                                    {/* Téléchargement de Documents */}
                                    <div className="space-y-3">
                                        <Label htmlFor="documents" className="flex items-center gap-2 font-semibold text-gray-700">
                                            <File className="h-5 w-5 text-indigo-600" />
                                            <span>Pièces Jointes</span>
                                        </Label>

                                        <div className="mt-1">
                                            <div className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50 px-6 py-8">
                                                <FileInput
                                                    id="documents"
                                                    multiple
                                                    accept=".pdf,.docx,.jpg,.png"
                                                    onChange={(e) => setDocuments(Array.from(e.target.files || []))}
                                                    className="absolute cursor-pointer opacity-0"
                                                />
                                                <div className="text-center">
                                                    <File className="mx-auto mb-3 h-12 w-12 text-indigo-500" />
                                                    <p className="font-medium text-indigo-700">
                                                        <span className="text-indigo-600 underline">Cliquez pour télécharger</span> ou glissez-déposez
                                                    </p>
                                                    <p className="mt-2 text-sm text-gray-500">Formats: PDF, DOCX, JPG, PNG (max 5MB par fichier)</p>
                                                </div>
                                            </div>

                                            {documents.length > 0 && (
                                                <div className="mt-6 space-y-3">
                                                    <Label className="font-medium text-gray-600">Fichiers sélectionnés:</Label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {documents.map((file, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <File className="h-5 w-5 text-indigo-600" />
                                                                    <span className="max-w-[220px] truncate text-sm">{file.name}</span>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-500 hover:text-red-700"
                                                                    onClick={() => setDocuments((docs) => docs.filter((_, i) => i !== index))}
                                                                >
                                                                    Supprimer
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {errors?.documents && <p className="mt-2 text-sm text-red-500">{errors.documents}</p>}
                                    </div>

                                    {/* Bouton de Soumission */}
                                    <div className="flex justify-end pt-6">
                                        <Button
                                            type="submit"
                                            className="transform bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-lg font-semibold shadow-lg transition-all hover:scale-[1.02] hover:from-indigo-700 hover:to-purple-700"
                                            disabled={isSubmitting || objects.length === 0 || !justification}
                                        >
                                            {isSubmitting ? 'Traitement...' : 'Soumettre le Recours'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default CreateAppeal;