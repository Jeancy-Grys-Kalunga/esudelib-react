import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileInput } from '@/components/ui/file-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { AlertCircle, BookText, CheckCircle2, File, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

// Types
type ErrorsType = {
    items?: string;
    payment_error?: string;
    payment_method?: string;
    phone_number?: string;
};

type Course = {
    id: number;
    title: string;
    code: string;
    cote: number;
    session: string;
};

type PageProps = {
    courses: Course[];
    appeal_fee: number;
    has_pending_payment: boolean;
    pending_payment_url?: string;
    payment_reference?: string;
    errors?: ErrorsType;
};

type AppealItem = {
    course_id: number | null;
    object: string;
    justification: string;
    documents: File[];
};

const CreateAppeal = () => {
    const { props } = usePage<PageProps>();
    const { courses, appeal_fee, has_pending_payment, payment_reference } = props;

    const [items, setItems] = useState<AppealItem[]>([{ course_id: null, object: '', justification: '', documents: [] }]);

    // Payment State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'mobile' | 'card'>('mobile');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
    const [currentReference, setCurrentReference] = useState<string | null>(payment_reference || null);

    // Initial check for pending payment
    useEffect(() => {
        if (has_pending_payment && payment_reference) {
            // setIsPaymentModalOpen(true); // Disabled as per requirement to only show on click
            setPaymentStatus('pending');
            setCurrentReference(payment_reference);
        }
    }, [has_pending_payment, payment_reference]);

    // Polling for payment status
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (paymentStatus === 'pending' && currentReference) {
            interval = setInterval(async () => {
                try {
                    const response = await fetch(route('student.appeals.check_status', currentReference));
                    const data = await response.json();
                    if (data.status === 'paid') {
                        setPaymentStatus('success');
                        clearInterval(interval);
                        setTimeout(() => (window.location.href = route('student.courses.index')), 2000); // Redirect after success
                    }
                } catch (error) {
                    console.error('Status check failed', error);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [paymentStatus, currentReference]);

    const handleAddItem = () => {
        setItems([...items, { course_id: null, object: '', justification: '', documents: [] }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof AppealItem, value: string) => {
        const newItems = [...items];

        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleDocumentsChange = (index: number, files: File[]) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], documents: files };
        setItems(newItems);
    };

    const initiatePayment = async () => {
        console.log('=== DEBUT initiatePayment ===');
        console.log('Payment method:', paymentMethod);
        console.log('Phone number:', phoneNumber);
        console.log('Items:', items);

        setIsProcessingPayment(true);
        const formData = new FormData();

        items.forEach((item, index) => {
            formData.append(`items[${index}][course_id]`, item.course_id?.toString() || '');
            formData.append(`items[${index}][object]`, item.object);
            formData.append(`items[${index}][justification]`, item.justification);
            item.documents.forEach((file) => {
                formData.append(`items[${index}][documents][]`, file);
            });
        });

        formData.append('payment_method', paymentMethod);
        if (paymentMethod === 'mobile') {
            formData.append('phone_number', phoneNumber);
        }

        console.log('FormData prepared, sending request to:', route('student.appeals.store'));

        try {
            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch(route('student.appeals.store'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    Accept: 'application/json',
                },
                body: formData,
                credentials: 'same-origin',
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erreur réseau' }));
                console.error('Error response:', errorData);
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response received:', data);

            if (data.success) {
                setCurrentReference(data.reference);
                setPaymentStatus('pending');
                setIsProcessingPayment(false);
                console.log('Payment initiated successfully, reference:', data.reference);
            } else {
                throw new Error(data.message || "Échec de l'initiation du paiement");
            }
        } catch (error: any) {
            console.error('Payment initiation failed', error);
            alert(error.message || "Erreur lors de l'initiation du paiement");
            setIsProcessingPayment(false);
            setPaymentStatus('idle');
        }

        console.log('=== FIN initiatePayment ===');
    };

    return (
        <AppLayout>
            <Head title="Déposer un Recours" />

            <div className="container mx-auto px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-8 flex items-center gap-3">
                        <AlertCircle className="h-10 w-10 text-indigo-600" />
                        <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
                            Déposer une Réclamation
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Left Column: Form */}
                        <div className="space-y-6 lg:col-span-2">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();

                                    // Custom Validation
                                    const isValid = items.every(
                                        (item) => item.course_id && item.object.trim() !== '' && item.justification.trim() !== '',
                                    );

                                    if (!isValid) {
                                        // Trigger browser default validation UI by finding first invalid input
                                        const form = e.currentTarget;
                                        if (form.checkValidity()) {
                                            // Fallback if browser thinks it's valid but our logic doesn't (though required attributes should handle this)
                                            alert(
                                                'Veuillez remplir tous les champs obligatoires (Cours, Objet, Justification) pour chaque réclamation.',
                                            );
                                        } else {
                                            form.reportValidity();
                                        }
                                        return;
                                    }

                                    setIsPaymentModalOpen(true);
                                }}
                                className="space-y-6"
                            >
                                {items.map((item, index) => (
                                    <Card key={index} className="overflow-hidden rounded-2xl border-0 shadow-lg">
                                        <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50 px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-indigo-600">{index + 1}</Badge>
                                                <h3 className="font-semibold text-gray-700">Détails de la réclamation</h3>
                                            </div>
                                            {items.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="text-red-500 hover:bg-red-50"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-6 p-6">
                                            {/* Course Selection */}
                                            <div className="space-y-3">
                                                <Label>
                                                    Cours concerné <span className="text-red-500">*</span>
                                                </Label>
                                                <select
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    value={item.course_id || ''}
                                                    onChange={(e) => handleItemChange(index, 'course_id', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Sélectionner un cours...</option>
                                                    {courses.map((course) => (
                                                        <option key={course.id} value={course.id}>
                                                            {course.code} - {course.title} (Note: {course.cote}/20)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-3">
                                                <Label>
                                                    Objet <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    value={item.object}
                                                    onChange={(e) => handleItemChange(index, 'object', e.target.value)}
                                                    placeholder="Ex: Erreur de calcul..."
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <Label>
                                                    Justification <span className="text-red-500">*</span>
                                                </Label>
                                                <Textarea
                                                    value={item.justification}
                                                    onChange={(e) => handleItemChange(index, 'justification', e.target.value)}
                                                    placeholder="Expliquez le problème..."
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <Label>Preuves (Optionnel)</Label>
                                                <FileInput
                                                    multiple
                                                    accept=".pdf,.jpg,.png"
                                                    onChange={(e) => handleDocumentsChange(index, Array.from(e.target.files || []))}
                                                />
                                                {item.documents.length > 0 && (
                                                    <div className="text-sm text-gray-500">{item.documents.length} fichier(s) sélectionné(s)</div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                <Button type="button" variant="outline" onClick={handleAddItem} className="w-full border-dashed py-6">
                                    <Plus className="mr-2 h-4 w-4" /> Ajouter une autre réclamation
                                </Button>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" size="lg" className="bg-indigo-600 text-white shadow-xl hover:bg-indigo-700">
                                        Passer au paiement ({appeal_fee} FC)
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Right Column: Summary */}
                        <div className="space-y-6">
                            <Card className="sticky top-8 rounded-2xl border-0 bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg">
                                <CardContent className="p-6">
                                    <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                                        <BookText className="h-5 w-5" /> Résumé
                                    </h2>
                                    <div className="space-y-4 text-indigo-100">
                                        <div className="flex items-center justify-between border-b border-indigo-500/30 pb-4">
                                            <span>Frais de dossier unique</span>
                                            <span className="text-lg font-bold">{appeal_fee} FC</span>
                                        </div>
                                        <div className="text-sm">Ce montant couvre l'ensemble de vos réclamations pour cette session.</div>
                                    </div>
                                    <div className="mt-8 border-t border-indigo-500/30 pt-4">
                                        <div className="flex items-end justify-between">
                                            <span className="text-lg">Total à payer</span>
                                            <span className="text-3xl font-bold">{appeal_fee} FC</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <Dialog
                open={isPaymentModalOpen}
                onOpenChange={(open) => {
                    if (!isProcessingPayment && paymentStatus !== 'pending') setIsPaymentModalOpen(open);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Paiement Sécurisé</DialogTitle>
                        <DialogDescription>
                            Montant total à payer : <span className="font-bold text-indigo-600">{appeal_fee} FC</span>
                        </DialogDescription>
                    </DialogHeader>

                    {paymentStatus === 'success' ? (
                        <div className="space-y-4 py-6 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Paiement Réussi !</h3>
                            <p className="text-gray-500">Votre réclamation a été enregistrée avec succès.</p>
                        </div>
                    ) : paymentStatus === 'pending' ? (
                        <div className="space-y-6 py-8 text-center">
                            <div className="relative mx-auto h-20 w-20">
                                <Loader2 className="h-20 w-20 animate-spin text-indigo-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">En attente de validation</h3>
                                <p className="mx-auto max-w-xs text-sm text-gray-500">
                                    Veuillez valider la transaction sur votre téléphone. Ne fermez pas cette fenêtre.
                                </p>
                            </div>
                            <Badge variant="outline" className="animate-pulse">
                                Vérification automatique...
                            </Badge>
                        </div>
                    ) : (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${paymentMethod === 'mobile' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => setPaymentMethod('mobile')}
                                >
                                    <div className="font-semibold text-gray-900">Mobile Money</div>
                                    <div className="text-xs text-gray-500">M-Pesa, Airtel, Orange</div>
                                </div>
                                <div
                                    className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => setPaymentMethod('card')}
                                >
                                    <div className="font-semibold text-gray-900">Carte Bancaire</div>
                                    <div className="text-xs text-gray-500">Visa, Mastercard</div>
                                </div>
                            </div>

                            {paymentMethod === 'mobile' && (
                                <div className="space-y-2">
                                    <Label>Numéro de téléphone</Label>
                                    <Input placeholder="Ex: 099..." value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                                </div>
                            )}

                            {paymentMethod === 'card' && (
                                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                                    Le paiement par carte sera bientôt disponible.
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {paymentStatus === 'idle' && (
                            <Button
                                className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                                onClick={initiatePayment}
                                disabled={isProcessingPayment || (paymentMethod === 'mobile' && !phoneNumber) || paymentMethod === 'card'}
                            >
                                {isProcessingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isProcessingPayment ? 'Traitement...' : 'Payer maintennant'}
                            </Button>
                        )}
                        {paymentStatus === 'pending' && (
                            <div className="mt-2 w-full">
                                <p className="mb-2 text-center text-xs text-gray-400">Si vous n'avez rien reçu après 30s</p>
                                <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                                    Actualiser la page
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default CreateAppeal;
