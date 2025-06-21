import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Download, User, IdCard, GraduationCap, FileWarning } from 'lucide-react';

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
            <div className="container mx-auto py-8 relative">
                {/* Floating Download Button */}
                <Button
                    onClick={downloadTranscript}
                    className="fixed bottom-8 right-8 z-50 shadow-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white animate-bounce hover:scale-105 transition-transform"
                    size="lg"
                >
                    <Download size={20} className="mr-2" />
                    Télécharger le bulletin
                </Button>

                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl shadow-md">
                        <CardTitle className="flex items-center justify-between text-2xl font-bold tracking-tight">
                            <span className="flex items-center gap-2">
                                <GraduationCap size={28} className="animate-pulse" />
                                Mes Résultats Académiques
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="mb-8 rounded-xl border bg-gradient-to-r from-blue-50 to-blue-100 p-6 shadow-inner">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="flex items-center gap-3">
                                    <User className="text-blue-700" />
                                    <div>
                                        <p className="text-xs text-gray-500">Nom</p>
                                        <p className="font-semibold text-lg">{student.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <IdCard className="text-blue-700" />
                                    <div>
                                        <p className="text-xs text-gray-500">Matricule</p>
                                        <p className="font-semibold text-lg">{student.matricule}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <GraduationCap className="text-blue-700" />
                                    <div>
                                        <p className="text-xs text-gray-500">Promotion</p>
                                        <p className="font-semibold text-lg">{student.promotion}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {notes.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl shadow">
                                <Table className="min-w-full border-separate border-spacing-y-2">
                                    <TableHeader className="bg-gradient-to-r from-blue-100 to-blue-200">
                                        <TableRow>
                                            <TableHead className="w-1/3 text-blue-800 font-bold">Cours</TableHead>
                                            <TableHead className="text-blue-800 font-bold">Cote</TableHead>
                                            <TableHead className="text-blue-800 font-bold">Session</TableHead>
                                            <TableHead className="text-blue-800 font-bold">Observation</TableHead>
                                            <TableHead className="text-blue-800 font-bold">Situation</TableHead>
                                            <TableHead className="text-right text-blue-800 font-bold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {notes.map((note, index) => (
                                            <TableRow
                                                key={index}
                                                className="hover:bg-blue-50 transition-colors duration-200 rounded-lg shadow-sm"
                                            >
                                                <TableCell className="font-medium">{note.course}</TableCell>
                                                <TableCell>
                                                    <span className={`font-bold ${note.cote >= 10 ? 'text-blue-700' : 'text-red-600'}`}>
                                                        {note.cote}/20
                                                    </span>
                                                </TableCell>
                                                <TableCell>{note.session}</TableCell>
                                                <TableCell>
                                                    {note.observation || (
                                                        <span className="text-gray-400 italic">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={note.situation === 'Réussite' ? 'secondary' : 'destructive'}
                                                        className={`px-3 py-1 text-base ${
                                                            note.situation === 'Réussite'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}
                                                    >
                                                        {note.situation}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {note.can_appeal && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-blue-600 text-blue-700 hover:bg-blue-50"
                                                            onClick={() =>
                                                                (window.location.href = `/student/appeals/create/${note.course_id}`)
                                                            }
                                                        >
                                                            <FileWarning className="mr-1" size={16} />
                                                            Déposer un recours
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-dashed border-blue-200 bg-blue-50 animate-pulse">
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
