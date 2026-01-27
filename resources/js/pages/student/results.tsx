import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Download, FileWarning, GraduationCap, IdCard, User } from 'lucide-react';

type Note = {
    course_id: number;
    course: string;
    cote: number;
    session: string;
    observation: string;
    situation: string;
    can_appeal: boolean;
};

type PageProps = {
    notes: Note[];
    student: {
        name: string;
        matricule: string;
        promotion: string;
    };
};

export default function Results({ notes, student }: PageProps) {
    const downloadTranscript = () => {
        window.location.href = '/student/transcript/download';
    };

    return (
        <AppLayout>
            <Head title="Mes Résultats" />
            <div className="relative container mx-auto py-8">
                {/* Floating Download Button */}
                <div className="fixed right-8 bottom-8 z-50 flex flex-col gap-4">
                    {notes.some((n) => n.can_appeal) && (
                        <Button
                            onClick={() => (window.location.href = '/student/appeals/create')}
                            className="bg-white text-blue-700 shadow-xl transition-transform hover:scale-105 hover:bg-blue-50"
                            size="lg"
                        >
                            <FileWarning size={20} className="mr-2" />
                            Déposer un recours
                        </Button>
                    )}
                    <Button
                        onClick={downloadTranscript}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl transition-transform hover:scale-105"
                        size="lg"
                    >
                        <Download size={20} className="mr-2" />
                        Télécharger le bulletin
                    </Button>
                </div>

                <Card className="border-0 bg-white/80 shadow-2xl backdrop-blur-lg">
                    <CardHeader className="rounded-t-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md">
                        <CardTitle>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                                    <GraduationCap size={28} className="animate-pulse" />
                                    Mes Résultats Académiques
                                </span>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="mb-8 rounded-xl border bg-gradient-to-r from-blue-50 to-blue-100 p-6 shadow-inner">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="flex items-center gap-3">
                                    <User className="text-blue-700" />
                                    <div>
                                        <p className="text-xs text-gray-500">Nom</p>
                                        <p className="text-lg font-semibold">{student.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <IdCard className="text-blue-700" />
                                    <div>
                                        <p className="text-xs text-gray-500">Matricule</p>
                                        <p className="text-lg font-semibold">{student.matricule}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="text-blue-700" />
                                    <div>
                                        <p className="text-xs text-gray-500">Promotion</p>
                                        <p className="text-lg font-semibold">{student.promotion}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {notes.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl shadow">
                                <Table className="min-w-full border-separate border-spacing-y-2">
                                    <TableHeader className="bg-gradient-to-r from-blue-100 to-blue-200">
                                        <TableRow>
                                            <TableHead className="w-1/3 font-bold text-blue-800">Cours</TableHead>
                                            <TableHead className="font-bold text-blue-800">Cote</TableHead>
                                            <TableHead className="font-bold text-blue-800">Session</TableHead>
                                            <TableHead className="font-bold text-blue-800">Observation</TableHead>
                                            <TableHead className="font-bold text-blue-800">Situation</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {notes.map((note, index) => (
                                            <TableRow key={index} className="rounded-lg shadow-sm transition-colors duration-200 hover:bg-blue-50">
                                                <TableCell className="font-medium">{note.course}</TableCell>
                                                <TableCell>
                                                    <span className={`font-bold ${note.cote >= 10 ? 'text-blue-700' : 'text-red-600'}`}>
                                                        {note.cote}/20
                                                    </span>
                                                </TableCell>
                                                <TableCell>{note.session}</TableCell>
                                                <TableCell>{note.observation || <span className="text-gray-400 italic">-</span>}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={note.situation === 'Réussite' ? 'secondary' : 'destructive'}
                                                        className={`px-3 py-1 text-base ${
                                                            note.situation === 'Réussite' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-700'
                                                        }`}
                                                    >
                                                        {note.situation}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <div className="mx-auto mb-6 flex h-20 w-20 animate-pulse items-center justify-center rounded-full border-4 border-dashed border-blue-200 bg-blue-50">
                                    <GraduationCap size={36} className="text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-blue-800">Aucun résultat disponible</h3>
                                <p className="mt-2 text-gray-500">Vos résultats n'ont pas encore été publiés.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
