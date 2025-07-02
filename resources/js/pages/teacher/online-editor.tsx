import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Download, Loader2, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

type StudentGrade = {
    uid: string;
    id: number;
    matricule: string;
    name: string;
    cote: number | null;
    observation: string | null;
    situation: string | null;
    participation: string | null;
};

type ExamSession = {
    id: number;
    title: string;
    status: string;
    acceptance_rate: number;
};

type PageProps = {
    course: {
        id: number;
        title: string;
        code: string;
    };
    academicYears: { id: number; title: string }[];
    promotion: { id: number; title: string } | null; // Changé en objet unique
    examSessions: ExamSession[];
    flash?: {
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    };
};

export default function OnlineEditor({ 
    course, 
    academicYears, 
    promotion,  // Promotion unique associée au cours
    examSessions, 
    flash 
}: PageProps) {
    const [students, setStudents] = useState<StudentGrade[]>([]);
    const [academicYearId, setAcademicYearId] = useState<string>('');
    const [promotionId, setPromotionId] = useState<string>(promotion ? promotion.id.toString() : '');
    const [examSessionId, setExamSessionId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
    const [sessionStatus, setSessionStatus] = useState<string>('');
    const [acceptanceRate, setAcceptanceRate] = useState<number>(0);
    const [successRate, setSuccessRate] = useState<number>(0);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [changeLog, setChangeLog] = useState<{ [key: string]: Partial<StudentGrade> }>({});

    // Initialiser la promotion du cours
    useEffect(() => {
        if (promotion) {
            setPromotionId(promotion.id.toString());
        }
    }, [promotion]);

    // Calculer le taux de réussite en temps réel
    useEffect(() => {
        const totalStudents = students.length;
        const successCount = students.filter(s => 
            s.cote !== null && !isNaN(s.cote) && s.cote >= 10
        ).length;
        
        const rate = totalStudents > 0 ? (successCount / totalStudents) * 100 : 0;
        setSuccessRate(parseFloat(rate.toFixed(2)));
    }, [students]);

    // Mettre à jour le statut de session
    useEffect(() => {
        if (examSessionId) {
            const session = examSessions.find((s) => s.id === parseInt(examSessionId));
            if (session) {
                setSessionStatus(session.status);
                setAcceptanceRate(session.acceptance_rate);
            }
        } else {
            setSessionStatus('');
            setAcceptanceRate(0);
        }
    }, [examSessionId, examSessions]);

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

    // Recharger les étudiants lorsque les filtres changent
    useEffect(() => {
        if (academicYearId && promotionId && examSessionId) {
            reloadStudents();
        } else {
            setStudents([]);
        }
    }, [academicYearId, examSessionId]); // Retirer promotionId car il est fixe

    // Auto-save toutes les 15 secondes si il y a des modifications
    useEffect(() => {
        if (Object.keys(changeLog).length > 0 && academicYearId && promotionId && examSessionId) {
            const autoSaveTimer = setTimeout(() => {
                handleAutoSave();
            }, 15000);

            return () => clearTimeout(autoSaveTimer);
        }
    }, [changeLog, academicYearId, promotionId, examSessionId]);

    const handleAutoSave = async () => {
        if (Object.keys(changeLog).length === 0) return;
        
        setIsSaving(true);
        const gradesToSave = Object.values(changeLog).map(change => ({
            student_id: change.id!,
            cote: change.cote,
            observation: change.observation,
            situation: change.situation,
            participation: change.participation
        }));

        try {
            const response = await axios.post(route('teacher.courses.save-grades', course.id), {
                grades: gradesToSave,
                academic_year_id: academicYearId,
                promotion_id: promotionId,
                exam_session_id: examSessionId,
            });

            setLastAutoSave(new Date().toLocaleTimeString());
            setChangeLog({});
            setSuccessRate(response.data.success_rate);
            
            toast.success(response.data.message || 'Sauvegarde automatique réussie !');
        } catch (error: any) {
            console.error('Erreur sauvegarde automatique:', error);
            let errorMessage = 'Échec de la sauvegarde automatique';

            if (error.response) {
                if (error.response.status === 422) {
                    if (error.response.data.errors) {
                        const firstError = Object.values(error.response.data.errors)[0];
                        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                    } else if (error.response.data.message) {
                        errorMessage = error.response.data.message;
                    }
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }

            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const reloadStudents = async () => {
        setIsLoadingStudents(true);
        try {
            const response = await axios.get(route('teacher.courses.online-editor.data', {
                course: course.id,
                academic_year_id: academicYearId,
                exam_session_id: examSessionId
            }));
            
            // Fusionner avec les modifications locales non sauvegardées
            const mergedStudents = (response.data.students || []).map((student: StudentGrade) => {
                const studentKey = `student-${student.id}`;
                const localChanges = changeLog[studentKey];
                return localChanges ? { ...student, ...localChanges } : student;
            });

            setStudents(mergedStudents);
        } catch (error) {
            console.error('Erreur rechargement étudiants:', error);
            toast.error('Échec du rechargement des données');
        } finally {
            setIsLoadingStudents(false);
        }
    };

    // Fonction spéciale pour gérer les changements de notes
    const handleCoteChange = (studentId: number, rawValue: string) => {
        // Remplacer les virgules par des points
        let value = rawValue.replace(',', '.');
        
        // Convertir en float ou null si vide
        let numericValue: number | null = null;
        
        if (value !== '') {
            // Vérifier si c'est un nombre valide
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
                // Limiter à 2 décimales et entre 0 et 20
                numericValue = Math.min(20, Math.max(0, Math.round(parsed * 100) / 100));
            }
        }
        
        handleGradeChange(studentId, 'cote', numericValue);
    };

    const handleGradeChange = (studentId: number, field: keyof StudentGrade, value: any) => {
        const studentKey = `student-${studentId}`;
        
        setChangeLog(prev => ({
            ...prev,
            [studentKey]: {
                ...(prev[studentKey] || {}),
                id: studentId,
                [field]: value
            }
        }));

        setStudents(prev => 
            prev.map(student => 
                student.id === studentId ? { ...student, [field]: value } : student
            )
        );
    };

    const handleSave = async () => {
        if (!academicYearId || !promotionId || !examSessionId) {
            toast.error('Veuillez remplir tous les champs requis');
            return;
        }

        setIsSaving(true);

        try {
            const response = await axios.post(route('teacher.courses.save-grades', course.id), {
                grades: students.map((student) => ({
                    student_id: student.id,
                    cote: student.cote,
                    observation: student.observation,
                    situation: student.situation,
                    participation: student.participation,
                })),
                academic_year_id: academicYearId,
                promotion_id: promotionId,
                exam_session_id: examSessionId,
            });

            setChangeLog({}); // Vider le journal des modifications
            setLastSaved(new Date().toLocaleTimeString());
            setLastAutoSave(null); // Réinitialiser l'auto-save après sauvegarde manuelle
            
            if (response.data.students) {
                setStudents(response.data.students);
            }

            toast.success(response.data.message || 'Sauvegarde réussie !');
        } catch (error: any) {
            console.error('Erreur sauvegarde:', error);
            let errorMessage = 'Échec de la sauvegarde';

            if (error.response) {
                if (error.response.status === 422) {
                    if (error.response.data.errors) {
                        const firstError = Object.values(error.response.data.errors)[0];
                        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                    } else if (error.response.data.message) {
                        errorMessage = error.response.data.message;
                    }
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }

            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(route('teacher.courses.export', { course: course.id }), {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileName = `cotation_${course.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                if (link.parentNode) {
                    link.parentNode.removeChild(link);
                }
            }, 100);

            toast.success('Fiche de cotation exportée avec succès');
        } catch (error) {
            console.error('Erreur export:', error);
            toast.error("Échec de l'exportation");
        }
    };

    return (
        <AppLayout>
            <Head title={`Éditeur en ligne - ${course.title}`} />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-10">
                <div className="container mx-auto max-w-6xl">
                    <Card className="rounded-3xl border-0 bg-white/90 shadow-2xl backdrop-blur-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-purple-700">
                                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                                        <path d="M12 3L2 9l10 6 10-6-10-6zm0 13.5l-10-6V21h20V10.5l-10 6z" fill="#a21caf" />
                                    </svg>
                                    Éditeur de cotation en ligne
                                </CardTitle>

                                <div className="flex items-center gap-3">
                                    {lastSaved && (
                                        <div className="flex items-center text-sm text-green-600">
                                            <CheckCircle className="mr-1 h-4 w-4" />
                                            Sauvegardé à {lastSaved}
                                        </div>
                                    )}
                                    {lastAutoSave && (
                                        <div className="flex items-center text-sm text-blue-600">
                                            <CheckCircle className="mr-1 h-4 w-4" />
                                            Sauvegarde automatique à {lastAutoSave}
                                        </div>
                                    )}
                                    <Button variant="secondary" onClick={handleExport} className="bg-green-100 text-green-700 hover:bg-green-200">
                                        <Download className="mr-1 h-4 w-4" />
                                        Exporter
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving || Object.keys(changeLog).length === 0 || sessionStatus === 'closed'}
                                        className="bg-purple-600 text-white hover:bg-purple-700"
                                    >
                                        {isSaving ? (
                                            <span className="flex items-center">
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sauvegarde...
                                            </span>
                                        ) : (
                                            <span className="flex items-center">
                                                <Save className="mr-1 h-4 w-4" />
                                                Sauvegarder
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {course.title} ({course.code})
                                </h2>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div>
                                    <Label>Année Académique *</Label>
                                    <Select value={academicYearId} onValueChange={setAcademicYearId}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Sélectionnez une année" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {academicYears.map((year) => (
                                                <SelectItem key={year.id} value={year.id.toString()}>
                                                    {year.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Promotion statique */}
                                <div>
                                    <Label>Promotion *</Label>
                                    {promotion ? (
                                        <div className="flex items-center p-2 bg-gray-100 rounded-md border border-gray-200">
                                            <span className="font-medium">{promotion.title}</span>
                                        </div>
                                    ) : (
                                        <div className="text-red-500">Aucune promotion associée à ce cours</div>
                                    )}
                                </div>

                                <div>
                                    <Label>Session d'examen *</Label>
                                    <Select value={examSessionId} onValueChange={setExamSessionId}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Sélectionnez une session" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {examSessions.map((session) => (
                                                <SelectItem
                                                    key={session.id}
                                                    value={session.id.toString()}
                                                    className={session.status === 'closed' ? 'text-red-500' : ''}
                                                >
                                                    {session.title} {session.status === 'closed' ? '(Fermée)' : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Avertissement si aucune promotion */}
                            {!promotion && (
                                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                                    <div className="flex items-center">
                                        <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
                                        <span className="text-red-700">
                                            Ce cours n'est associé à aucune promotion. Veuillez contacter l'administration.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Indicateurs de session */}
                            {examSessionId && (
                                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Statut de la session:</Label>
                                            <div className={`font-bold ${sessionStatus === 'open' ? 'text-green-600' : 'text-red-600'}`}>
                                                {sessionStatus === 'open' ? 'Ouverte' : 'Fermée'}
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Taux d'acceptation requis:</Label>
                                            <div className="font-bold text-blue-700">{acceptanceRate}%</div>
                                        </div>

                                        <div>
                                            <Label>Taux de réussite actuel:</Label>
                                            <div className={`font-bold ${successRate >= acceptanceRate ? 'text-green-600' : 'text-red-600'}`}>
                                                {successRate}%{successRate >= acceptanceRate ? ' ✅ Satisfait' : ' ❌ Insuffisant'}
                                            </div>
                                        </div>

                                        {sessionStatus === 'closed' && (
                                            <div className="col-span-2">
                                                <div className="flex items-center rounded-lg bg-red-100 p-3">
                                                    <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
                                                    <span className="text-red-700">
                                                        Cette session est fermée. Vous ne pouvez pas soumettre de modifications.
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow">
                                <Table>
                                    <TableHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
                                        <TableRow>
                                            <TableHead className="w-[120px] text-purple-700">Matricule</TableHead>
                                            <TableHead className="text-purple-700">Nom</TableHead>
                                            <TableHead className="text-purple-700">Note/20</TableHead>
                                            <TableHead className="text-purple-700">Participation</TableHead>
                                            <TableHead className="text-purple-700">Observation</TableHead>
                                            <TableHead className="text-purple-700">Situation</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingStudents ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center h-24">
                                                    <div className="flex items-center justify-center">
                                                        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                                                        <span>Chargement des étudiants...</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : students.length > 0 ? (
                                            students.map((student) => (
                                                <TableRow key={student.uid} className="hover:bg-purple-50/50">
                                                    <TableCell className="font-semibold">{student.matricule}</TableCell>
                                                    <TableCell>{student.name}</TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="text"
                                                            value={student.cote ?? ''}
                                                            onChange={(e) => handleCoteChange(student.id, e.target.value)}
                                                            className="w-24 bg-white"
                                                            disabled={sessionStatus === 'closed'}
                                                            placeholder="0-20"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="text"
                                                            value={student.participation ?? ''}
                                                            onChange={(e) => handleGradeChange(student.id, 'participation', e.target.value)}
                                                            className="bg-white"
                                                            disabled={sessionStatus === 'closed'}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="text"
                                                            value={student.observation ?? ''}
                                                            onChange={(e) => handleGradeChange(student.id, 'observation', e.target.value)}
                                                            className="bg-white"
                                                            disabled={sessionStatus === 'closed'}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="text"
                                                            value={student.situation ?? ''}
                                                            onChange={(e) => handleGradeChange(student.id, 'situation', e.target.value)}
                                                            className="bg-white"
                                                            disabled={sessionStatus === 'closed'}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center h-24 text-gray-500">
                                                    {academicYearId && examSessionId
                                                        ? "Aucun étudiant trouvé pour cette sélection."
                                                        : "Veuillez sélectionner une année académique et une session d'examen."}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button asChild variant="outline" className="border-red-500 text-red-600 hover:bg-red-50">
                                    <Link href={route('teacher.courses')}>
                                        <X className="mr-1 h-4 w-4" />
                                        Quitter sans sauvegarder
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}