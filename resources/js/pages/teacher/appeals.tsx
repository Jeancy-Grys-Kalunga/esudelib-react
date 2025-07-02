import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';

type Document = {
    name: string;
    url: string;
};

type Appeal = {
    id: number;
    object: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    student: string;
    matricule: string;
    documents: Document[];
};

type Course = {
    id: number;
    title: string;
};

type PageProps = {
    appeals: Appeal[];
    course: Course;
};

export default function TeacherAppeals({ appeals, course }: PageProps) {
    const getStatusBadge = (status: Appeal['status']) => {
        switch (status) {
            case 'pending':
                return (
                    <Badge className="animate-pulse bg-yellow-100 text-yellow-800 border-yellow-300">
                        En attente
                    </Badge>
                );
            case 'accepted':
                return (
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                        Accepté
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
                        Rejeté
                    </Badge>
                );
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <AppLayout>
            <Head title={`Recours - ${course.title}`} />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-10">
                <div className="container mx-auto max-w-5xl">
                    <div className="mb-6">
                        <Button asChild variant="outline" className="border-purple-300 text-purple-700 shadow-sm hover:bg-purple-50 transition-all">
                            <Link href={route('teacher.courses')} preserveScroll>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour aux cours
                            </Link>
                        </Button>
                    </div>
                    <Card className="rounded-3xl border-0 bg-white/90 shadow-2xl backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-purple-700">
                                    <FileText className="h-7 w-7 text-purple-400" />
                                    Recours pour {course.title}
                                </span>
                                <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-gray-500 shadow">
                                    {appeals.length} recours
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {appeals.length > 0 ? (
                                <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow">
                                    <Table>
                                        <TableHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
                                            <TableRow>
                                                <TableHead className="text-base font-bold text-purple-700">Étudiant</TableHead>
                                                <TableHead className="text-base font-bold text-purple-700">Matricule</TableHead>
                                                <TableHead className="text-base font-bold text-purple-700">Objet</TableHead>
                                                <TableHead className="text-base font-bold text-purple-700">Date</TableHead>
                                                <TableHead className="text-base font-bold text-purple-700">Statut</TableHead>
                                                <TableHead className="text-right text-base font-bold text-purple-700">Documents</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {appeals.map((appeal) => (
                                                <TableRow key={appeal.id} className="transition hover:bg-purple-50/60">
                                                    <TableCell className="font-semibold text-gray-900">{appeal.student}</TableCell>
                                                    <TableCell className="text-gray-700">{appeal.matricule}</TableCell>
                                                    <TableCell className="text-gray-700">{appeal.object}</TableCell>
                                                    <TableCell className="text-gray-700">{appeal.created_at}</TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(appeal.status)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex flex-wrap justify-end gap-2">
                                                            {appeal.documents.length > 0 ? (
                                                                appeal.documents.map((doc, index) => (
                                                                    <Button
                                                                        key={index}
                                                                        asChild
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="border-blue-400 text-blue-700 shadow-sm hover:scale-105 hover:bg-blue-50 transition-all"
                                                                    >
                                                                        <a
                                                                            href={doc.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            <FileText className="mr-1 h-4 w-4" />
                                                                            {doc.name}
                                                                        </a>
                                                                    </Button>
                                                                ))
                                                            ) : (
                                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                                                                    Aucun
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="py-16 text-center">
                                    <div className="mb-6 flex justify-center">
                                        <div className="rounded-full bg-gradient-to-br from-purple-100 to-blue-100 p-6 shadow-lg">
                                            <FileText className="h-14 w-14 text-purple-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800">Aucun recours</h3>
                                    <p className="mt-2 text-gray-500">
                                        Aucun recours n'a été déposé pour ce cours.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
