import { Head, router, usePage } from '@inertiajs/react';
import { useState, Dispatch, SetStateAction, ChangeEvent, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileInput } from '@/components/ui/file-input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

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
};

const CreateAppeal = ({ course, note, appeal_fee }: PageProps) => {
    const [objects, setObjects] = useState(['']);
    const [justification, setJustification] = useState('');
    const [documents, setDocuments] = useState<File[]>([]);

    const handleAddObject = () => {
        setObjects([...objects, '']);
    };

    const handleRemoveObject = (index: number) => {
        const newObjects = [...objects];
        newObjects.splice(index, 1);
        setObjects(newObjects);
    };

    const handleObjectChange = (index: number, value: string) => {
        const newObjects = [...objects];
        newObjects[index] = value;
        setObjects(newObjects);
    };

    const submit = () => {
        const formData = new FormData();
        formData.append('justification', justification);
        objects.forEach((obj, index) => {
            formData.append(`objects[${index}]`, obj);
        });
        documents.forEach((file, index) => {
            formData.append(`documents[${index}]`, file);
        });

        router.post(`/student/appeals/${course.id}`, formData);
    };

    const { props } = usePage();
    useEffect(() => {
        if (typeof props.redirect_url === 'string' && props.redirect_url) {
            window.location.href = props.redirect_url;
        }
    }, [props.redirect_url]);

    return (
        <AppLayout>
            <Head title="Déposer un Recours" />
            <div className="container mx-auto">
                <div className="py-8">
                    <h1 className="text-3xl font-bold mb-6">Déposer un Recours</h1>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Section Informations du Cours */}
                        <Card className="border border-gray-200 rounded-xl">
                            <CardHeader className="bg-gray-50 px-6 py-4 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-xl font-semibold">Détails du Cours</span>
                                    <Badge variant="secondary" className="text-sm">
                                        {course.code}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-gray-500">Titre du Cours</Label>
                                    <p className="font-medium">{course.title}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-gray-500">Note</Label>
                                        <p className="p-2 bg-gray-100 rounded-md font-semibold">
                                            {note.cote}/20
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-gray-500">Session</Label>
                                        <p>{note.session}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <Label className="text-gray-500">Situation</Label>
                                    <Badge variant={note.situation === "Échec" ? "destructive" : "secondary"}>
                                        {note.situation}
                                    </Badge>
                                </div>
                                
                                <div className="space-y-1 pt-4 border-t">
                                    <Label className="text-gray-500">Frais de Recours</Label>
                                    <p className="text-lg font-semibold text-red-600">{appeal_fee} CDF</p>
                                    <p className="text-sm text-gray-500 italic">(Non remboursable)</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Formulaire de Recours */}
                        <Card className="border border-gray-200 rounded-xl">
                            <CardHeader className="bg-gray-50 px-6 py-4 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-xl font-semibold">Votre Recours</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <form
                                    onSubmit={e => {
                                        e.preventDefault();
                                        submit();
                                    }}
                                    className="space-y-6"
                                >
                                    {/* Objets du Recours */}
                                    <div className="space-y-3">
                                        <Label className="font-medium text-gray-700">
                                            Objets du Recours *
                                        </Label>
                                        {objects.map((obj, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <Input
                                                    value={obj}
                                                    onChange={(e) => handleObjectChange(index, e.target.value)}
                                                    placeholder={`Objet ${index + 1}`}
                                                    required
                                                />
                                                {objects.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => handleRemoveObject(index)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button 
                                            type="button"
                                            variant="secondary"
                                            onClick={handleAddObject}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Ajouter un autre objet
                                        </Button>
                                    </div>

                                    {/* Champ Justification */}
                                    <div className="space-y-2">
                                        <Label htmlFor="justification" className="font-medium text-gray-700">
                                            Justification Détaillée *
                                        </Label>
                                        <Textarea
                                            id="justification"
                                            value={justification}
                                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setJustification(e.target.value)}
                                            placeholder="Décrivez précisément les raisons de votre recours..."
                                            required
                                            rows={6}
                                            className="border-gray-300 focus:border-blue-500 min-h-[150px]"
                                        />
                                    </div>

                                    {/* Téléchargement de Documents */}
                                    <div className="space-y-2">
                                        <Label htmlFor="documents" className="font-medium text-gray-700">
                                            Pièces Jointes
                                        </Label>
                                        <FileInput
                                            id="documents"
                                            multiple
                                            accept=".pdf,.docx,.jpg,.png"
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocuments(Array.from(e.target.files || []))}
                                            className="border border-dashed border-gray-300 rounded-lg p-4 cursor-pointer"
                                        />
                                        <div className="mt-10 flex flex-col gap-2">
                                            {documents.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                    <span className="text-sm truncate max-w-[70%]">{file.name}</span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => setDocuments(docs => docs.filter((_, i) => i !== index))}
                                                    >
                                                        Supprimer
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Formats acceptés: PDF, DOCX, JPG, PNG (max 5MB par fichier)
                                        </p>
                                    </div>

                                    {/* Bouton de Soumission */}
                                    <div className="flex justify-end pt-4">
                                        <Button 
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg font-semibold"
                                            disabled={objects.length === 0 || !justification}
                                        >
                                            Soumettre le Recours
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
