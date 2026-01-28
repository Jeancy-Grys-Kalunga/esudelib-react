'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import axios, { AxiosError } from 'axios';
import {
    AlertTriangle,
    ArrowRight,
    Award,
    BarChart3,
    BookOpen,
    BrainCircuit,
    Check,
    Cpu,
    Download,
    FileText,
    GraduationCap,
    Info,
    RefreshCw,
    Sparkles,
    Target,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// Type definitions
interface AcademicYear {
    id: number;
    title: string;
}

interface Promotion {
    id: number;
    title: string;
}

interface MasterPrediction {
    id: number;
    predicted_master: string;
    confidence_score: number;
    predicted_at: string;
    prediction_details?: {
        all_probabilities: Record<string, number>;
        top_3_programs: Array<[string, number]>;
        explanation: PredictionExplanation;
    };
}

interface Student {
    id: number;
    name: string;
    matricule: string;
    average?: number;
    gender?: string;
    master_prediction?: MasterPrediction;
}

interface PaginatedStudents {
    data: Student[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Stats {
    total_predictions: number;
    high_confidence_count: number;
    medium_confidence_count: number;
    low_confidence_count: number;
    average_confidence: number;
    programs_distribution: Record<string, number>;
}

interface AlternativeOption {
    program: string;
    probability: number;
    reason?: string;
}

interface PredictionExplanation {
    main_reason: string;
    supporting_factors: string[];
    recommendation: string;
    alternative_options: AlternativeOption[];
}

interface PredictionData {
    predicted_master: string;
    confidence_score: number;
    top_3_programs: [string, number][];
    all_probabilities: Record<string, number>;
    predicted_at: string;
    explanation?: PredictionExplanation;
}

interface PredictionResponse {
    success: boolean;
    student: {
        id: number;
        name: string;
        matricule: string;
    };
    prediction: PredictionData;
}

interface OrientationPredictionProps {
    academicYear: AcademicYear;
    promotion: Promotion;
    students: PaginatedStudents;
    stats: Stats;
}

interface ModelStatus {
    model_exists: boolean;
    model_path: string;
    model_info: {
        size?: number;
        modified?: string;
        exists: boolean;
        error?: string;
    };
}

export default function OrientationPrediction({ academicYear, promotion, students, stats }: OrientationPredictionProps) {
    const [predictions, setPredictions] = useState<Record<number, PredictionResponse>>({});
    const [loading, setLoading] = useState<Record<number, boolean>>({});
    const [activeStudent, setActiveStudent] = useState<number | null>(null);
    const [isTraining, setIsTraining] = useState(false);
    const [isBatchPredicting, setIsBatchPredicting] = useState(false);
    const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
    const [checkingModel, setCheckingModel] = useState(false);
    const [activeTab, setActiveTab] = useState<'students' | 'stats' | 'model'>('students');
    const [exporting, setExporting] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState(0);
    const [trainingMessage, setTrainingMessage] = useState('');

    // Vérifier le statut du modèle au chargement
    useEffect(() => {
        checkModelStatus();
    }, []);

    const checkModelStatus = async () => {
        setCheckingModel(true);
        try {
            const response = await axios.get('/jury/predictions/model-status');
            if (response.data.success) {
                setModelStatus(response.data.data);
            }
        } catch (error) {
            toast.error('Erreur lors de la vérification du modèle');
            console.error('Model status error:', error);
        } finally {
            setCheckingModel(false);
        }
    };

    const predictOrientation = async (studentId: number) => {
        setLoading((prev) => ({ ...prev, [studentId]: true }));
        setActiveStudent(studentId);

        try {
            const response = await axios.get(`/jury/predictions/students/${studentId}/predict`);
            if (response.data.success) {
                setPredictions((prev) => ({
                    ...prev,
                    [studentId]: response.data,
                }));
                toast.success('Prédiction générée avec succès!');
            } else {
                toast.error(response.data.error || 'Erreur lors de la prédiction');
            }
        } catch (err) {
            const error = err as AxiosError<{ error: string }>;
            toast.error(error.response?.data?.error || 'Erreur lors de la prédiction');
            console.error('Prediction error:', error);
        } finally {
            setLoading((prev) => ({ ...prev, [studentId]: false }));
        }
    };

    const trainModel = async () => {
        if (!window.confirm('Voulez-vous vraiment entraîner le modèle? Cela peut prendre plusieurs minutes.')) {
            return;
        }

        setIsTraining(true);
        setTrainingProgress(0);
        setTrainingMessage("Initialisation de l'entraînement...");

        // Simuler une progression
        const progressInterval = setInterval(() => {
            setTrainingProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return prev;
                }
                return prev + 5;
            });
        }, 1000);

        try {
            const response = await axios.post('/jury/predictions/train-model');

            clearInterval(progressInterval);
            setTrainingProgress(100);
            setTrainingMessage('Entraînement terminé!');

            if (response.data.success) {
                const accuracy = (response.data.data.accuracy * 100).toFixed(2);
                toast.success(`Modèle XGBoost entraîné avec succès! Précision: ${accuracy}%`);

                // Mettre à jour le statut du modèle
                await checkModelStatus();

                // Recharger les prédictions
                router.reload({ only: ['students'] });
            } else {
                toast.error(response.data.error || "Erreur lors de l'entraînement");
            }
        } catch (err) {
            clearInterval(progressInterval);
            const error = err as AxiosError<{ error: string }>;
            toast.error(error.response?.data?.error || "Erreur lors de l'entraînement du modèle");
            console.error('Training error:', error);
        } finally {
            setTimeout(() => {
                setIsTraining(false);
                setTrainingProgress(0);
                setTrainingMessage('');
            }, 2000);
        }
    };

    const predictBatch = async () => {
        if (!window.confirm('Voulez-vous générer des prédictions pour tous les étudiants? Cela peut prendre quelques minutes.')) {
            return;
        }

        setIsBatchPredicting(true);
        try {
            const response = await axios.post('/jury/predictions/predict-batch');
            if (response.data.success) {
                const { successful, failed, total } = response.data.data;
                toast.success(`Prédictions générées: ${successful}/${total} réussies`);
                if (failed > 0) {
                    toast.warning(`${failed} prédictions ont échoué`);
                }
                router.reload({ only: ['students', 'stats'] });
            } else {
                toast.error(response.data.error || 'Erreur lors de la prédiction en lot');
            }
        } catch (err) {
            const error = err as AxiosError<{ error: string }>;
            toast.error(error.response?.data?.error || 'Erreur lors de la prédiction en lot');
            console.error('Batch prediction error:', error);
        } finally {
            setIsBatchPredicting(false);
        }
    };

    const exportPredictionReport = async (studentId?: number) => {
        setExporting(true);
        try {
            let url = '/jury/predictions/export-all';
            let filename = `predictions-master-${promotion.title}-${new Date().toISOString().slice(0, 10)}.pdf`;

            if (studentId) {
                url = `/jury/predictions/export/${studentId}`;
                const student = students.data.find((s) => s.id === studentId);
                filename = `prediction-${student?.matricule || studentId}-${new Date().toISOString().slice(0, 10)}.pdf`;
            }

            const response = await axios.get(url, {
                responseType: 'blob',
            });

            const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Rapport exporté avec succès!');
        } catch (error) {
            toast.error("Erreur lors de l'exportation");
            console.error('Export error:', error);
        } finally {
            setExporting(false);
        }
    };

    const getOrientationColor = (orientation: string) => {
        const colors: Record<string, string> = {
            Informatique: 'bg-blue-100 text-blue-800 border-blue-300',
            'Génie Civil': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            Électromécanique: 'bg-orange-100 text-orange-800 border-orange-300',
            Médecine: 'bg-red-100 text-red-800 border-red-300',
            Droit: 'bg-purple-100 text-purple-800 border-purple-300',
            Économie: 'bg-green-100 text-green-800 border-green-300',
            Gestion: 'bg-teal-100 text-teal-800 border-teal-300',
            'Sciences Politiques': 'bg-indigo-100 text-indigo-800 border-indigo-300',
        };

        return colors[orientation] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 75) return 'text-green-600';
        if (confidence >= 60) return 'text-yellow-600';
        return 'text-orange-600';
    };

    const getConfidenceBadge = (confidence: number) => {
        if (confidence >= 75) return 'bg-green-100 text-green-800';
        if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-orange-100 text-orange-800';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <AppLayout>
            <div className="container mx-auto px-4 py-8">
                <Head title="Analyse Prédictive - Filières de Master" />

                {/* En-tête moderne */}
                <div className="mb-8">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3">
                                    <BrainCircuit className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Analyse Prédictive des Filières de Master</h1>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                                            <GraduationCap className="mr-1 h-4 w-4" />
                                            {academicYear.title}
                                        </Badge>
                                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                            {promotion.title}
                                        </Badge>
                                        {modelStatus?.model_exists && (
                                            <Badge className="bg-green-100 text-green-800">
                                                <Cpu className="mr-1 h-4 w-4" />
                                                Modèle disponible
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className="text-lg text-gray-600 dark:text-gray-400">
                                Système intelligent basé sur XGBoost pour prédire les filières de Master optimales
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button onClick={trainModel} disabled={isTraining} variant="outline" className="flex items-center gap-2">
                                {isTraining ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        <span>Entraînement... {trainingProgress}%</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="h-4 w-4" />
                                        Entraîner le modèle
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={predictBatch}
                                disabled={isBatchPredicting || !modelStatus?.model_exists}
                                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
                            >
                                {isBatchPredicting ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Analyse en cours...
                                    </>
                                ) : (
                                    <>
                                        <Users className="h-4 w-4" />
                                        Analyser tous les étudiants
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => exportPredictionReport()}
                                disabled={exporting}
                                className="flex items-center gap-2"
                            >
                                {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Exporter tout
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Onglets */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'students' | 'stats' | 'model')} className="mb-8">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="students" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Étudiants
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Statistiques
                        </TabsTrigger>
                        <TabsTrigger value="model" className="flex items-center gap-2">
                            <Cpu className="h-4 w-4" />
                            Modèle
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Contenu des onglets */}
                {activeTab === 'students' && (
                    <>
                        {/* Tableau des étudiants */}
                        <Card className="mb-8 overflow-hidden shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-indigo-600" />
                                            Liste des étudiants ({students.total})
                                        </CardTitle>
                                        <CardDescription>
                                            Cliquez sur "Analyser" pour générer une prédiction personnalisée pour chaque étudiant
                                        </CardDescription>
                                    </div>
                                    {!modelStatus?.model_exists && (
                                        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2">
                                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                                            <span className="text-sm text-amber-700">Veuillez d'abord entraîner le modèle</span>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 dark:bg-gray-900">
                                                <TableHead className="font-semibold">Étudiant</TableHead>
                                                <TableHead className="text-center font-semibold">Moyenne</TableHead>
                                                <TableHead className="text-center font-semibold">Genre</TableHead>
                                                <TableHead className="text-center font-semibold">Prédiction Actuelle</TableHead>
                                                <TableHead className="text-center font-semibold">Confiance</TableHead>
                                                <TableHead className="text-center font-semibold">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {students.data.map((student) => (
                                                <TableRow key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <div className="rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-2">
                                                                <GraduationCap className="h-5 w-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold">{student.name}</div>
                                                                <div className="text-sm text-gray-500">{student.matricule}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                                                            {student.average !== undefined &&
                                                            student.average !== null &&
                                                            typeof student.average === 'number'
                                                                ? student.average.toFixed(2)
                                                                : 'N/A'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                                            {student.gender || 'Non spécifié'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {student.master_prediction ? (
                                                            <Badge className={getOrientationColor(student.master_prediction.predicted_master)}>
                                                                {student.master_prediction.predicted_master}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">Non analysé</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {student.master_prediction ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Progress value={student.master_prediction.confidence_score} className="h-2 w-20" />
                                                                <span
                                                                    className={`text-sm font-semibold ${getConfidenceColor(student.master_prediction.confidence_score)}`}
                                                                >
                                                                    {student.master_prediction.confidence_score.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                onClick={() => predictOrientation(student.id)}
                                                                disabled={loading[student.id] || !modelStatus?.model_exists}
                                                                size="sm"
                                                                className="flex items-center gap-2"
                                                            >
                                                                {loading[student.id] ? (
                                                                    <>
                                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                                        Analyse...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Sparkles className="h-4 w-4" />
                                                                        Analyser
                                                                    </>
                                                                )}
                                                            </Button>
                                                            {student.master_prediction && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => exportPredictionReport(student.id)}
                                                                    className="flex items-center gap-1"
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Résultats de prédiction détaillés */}
                        {activeStudent && predictions[activeStudent] && (
                            <Card className="mb-8 border-t-4 border-indigo-500 shadow-2xl">
                                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Target className="h-6 w-6 text-indigo-600" />
                                                Analyse Détaillée -{' '}
                                                {(() => {
                                                    const rawData = predictions[activeStudent];
                                                    const predData =
                                                        rawData && rawData.data && rawData.data.prediction
                                                            ? rawData.data
                                                            : rawData && rawData.prediction
                                                              ? rawData
                                                              : null;
                                                    return predData?.student?.name || 'Étudiant Inconnu';
                                                })()}
                                            </CardTitle>
                                            <CardDescription>
                                                Résultats générés par notre système XGBoost avancé - Modèle: xgboost_filiere_model.pkl
                                            </CardDescription>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => exportPredictionReport(activeStudent)}
                                            className="flex items-center gap-2"
                                        >
                                            <Download className="h-4 w-4" />
                                            Exporter
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {/* Prédiction principale */}
                                    <div className="mb-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                                        {/* Debug Log hidden in production but useful here */}
                                        <div className="hidden">
                                            {console.log('Active Prediction Data:', predictions[activeStudent])}
                                            {console.log('Student Name:', predictions[activeStudent]?.student?.name)}
                                            {console.log('Predicted Master:', predictions[activeStudent]?.prediction?.predicted_master)}
                                        </div>

                                        {(() => {
                                            // Helper to safely extract data regardless of nesting
                                            const rawData = predictions[activeStudent];
                                            const predData =
                                                rawData && rawData.data && rawData.data.prediction
                                                    ? rawData.data
                                                    : rawData && rawData.prediction
                                                      ? rawData
                                                      : null;

                                            // Fallback values
                                            const predictedMaster = predData?.prediction?.predicted_master || 'N/A';
                                            const confidence = predData?.prediction?.confidence_score || 0;
                                            const predictedAt = predData?.prediction?.predicted_at;

                                            return (
                                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                                    <div>
                                                        <h3 className="mb-2 text-lg font-medium opacity-90">Filière Recommandée</h3>
                                                        <div className="text-4xl font-bold">{predictedMaster}</div>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <Badge className="bg-white/20 text-white">XGBoost Model</Badge>
                                                            <Badge className={getConfidenceBadge(confidence)}>Hautement fiable</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="mb-2 text-sm opacity-90">Score de Confiance</div>
                                                        <div className="flex items-center gap-3">
                                                            <Progress value={confidence} className="h-3 w-32 bg-white/30" />
                                                            <span className="text-3xl font-bold">{confidence.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="mt-2 text-sm opacity-90">
                                                            Généré le {predictedAt ? new Date(predictedAt).toLocaleDateString('fr-FR') : '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Top 3 programmes */}
                                    <div className="mb-8">
                                        <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                                            Top 3 des Filières Compatibles
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            {(predictions[activeStudent]?.prediction?.top_3_programs || []).map(([program, probability], index) => {
                                                // Trouver la raison spécifique dans l'explication
                                                let reason = '';
                                                const explanation = predictions[activeStudent]?.prediction?.explanation;

                                                if (index === 0 && explanation?.recommendation) {
                                                    // Extraire la raison entre parenthèses de la recommandation si possible
                                                    const match = explanation.recommendation.match(/\((.*?)\)$/);
                                                    reason = match ? match[1] : explanation.recommendation.split(':')[1] || '';
                                                } else if (explanation?.alternative_options) {
                                                    const alt = explanation.alternative_options.find((opt: any) => opt.program === program);
                                                    reason = alt?.reason || '';
                                                }

                                                return (
                                                    <Card
                                                        key={program}
                                                        className={`border-2 ${index === 0 ? 'border-indigo-500 shadow-lg' : 'border-gray-200'}`}
                                                    >
                                                        <CardHeader className="pb-3">
                                                            <div className="flex items-center justify-between">
                                                                <Badge className={index === 0 ? 'bg-indigo-600' : 'bg-gray-500'}>#{index + 1}</Badge>
                                                                {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="mb-2 text-lg font-semibold">{program}</div>
                                                            <div className="flex items-center gap-2">
                                                                <Progress value={probability} className="h-2 flex-1" />
                                                                <span className={`text-sm font-medium ${getConfidenceColor(probability)}`}>
                                                                    {probability.toFixed(1)}%
                                                                </span>
                                                            </div>

                                                            {reason && (
                                                                <div className="mt-3 rounded bg-gray-50 p-2 text-xs text-gray-600 italic dark:bg-gray-800 dark:text-gray-400">
                                                                    "{reason.replace(/[()]/g, '')}"
                                                                </div>
                                                            )}

                                                            <div className="mt-3 text-xs text-gray-500">
                                                                Pourcentage d'adaptation:{' '}
                                                                {(
                                                                    (probability / (predictions[activeStudent]?.prediction?.confidence_score || 1)) *
                                                                    100
                                                                ).toFixed(0)}
                                                                %
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Explication détaillée */}
                                    {(() => {
                                        const rawData = predictions[activeStudent];
                                        const predData =
                                            rawData && rawData.data && rawData.data.prediction
                                                ? rawData.data
                                                : rawData && rawData.prediction
                                                  ? rawData
                                                  : null;
                                        const explanation = predData?.prediction?.explanation;

                                        if (!explanation) return null;

                                        return (
                                            <div className="mb-6">
                                                <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                                                    <BrainCircuit className="h-5 w-5 text-indigo-600" />
                                                    Explication de l'Analyse
                                                </h3>

                                                <div className="space-y-4">
                                                    {/* Raison principale */}
                                                    <div className="rounded-lg border-l-4 border-indigo-500 bg-indigo-50 p-4 dark:bg-indigo-950">
                                                        <h4 className="mb-2 font-semibold text-indigo-900 dark:text-indigo-100">
                                                            Analyse Principale
                                                        </h4>
                                                        <p className="text-indigo-800 dark:text-indigo-200">{explanation.main_reason}</p>
                                                    </div>

                                                    {/* Facteurs de support */}
                                                    {(explanation.supporting_factors?.length || 0) > 0 && (
                                                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:bg-gray-900">
                                                            <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                                                                Facteurs Déterminants
                                                            </h4>
                                                            <ul className="space-y-2">
                                                                {(explanation.supporting_factors || []).map((factor: string, index: number) => (
                                                                    <li key={index} className="flex items-start gap-2">
                                                                        <div className="mt-1 rounded-full bg-green-500 p-1">
                                                                            <Check className="h-3 w-3 text-white" />
                                                                        </div>
                                                                        <span className="text-gray-700 dark:text-gray-300">{factor}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Recommandation */}
                                                    <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-950">
                                                        <div className="flex items-start gap-3">
                                                            <ArrowRight className="mt-1 h-5 w-5 text-green-600" />
                                                            <div>
                                                                <h4 className="mb-2 font-semibold text-green-900 dark:text-green-100">
                                                                    Recommandation
                                                                </h4>
                                                                <p className="text-green-800 dark:text-green-200">{explanation.recommendation}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Options alternatives */}
                                                    {(explanation.alternative_options?.length || 0) > 0 && (
                                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:bg-gray-900">
                                                            <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                                                                Options Alternatives
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {(explanation.alternative_options || []).map((option: any, index: number) => (
                                                                    <div
                                                                        key={index}
                                                                        className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-gray-800"
                                                                    >
                                                                        <div>
                                                                            <span className="font-medium">{option.program}</span>
                                                                            {option.reason && (
                                                                                <p className="mt-1 text-xs text-gray-500">{option.reason}</p>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <Progress value={option.probability} className="h-2 w-24" />
                                                                            <span className="text-sm font-medium text-gray-600">
                                                                                {option.probability.toFixed(1)}%
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Variables utilisées par le modèle */}
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:bg-gray-900">
                                        <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Variables d'analyse</h4>
                                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                            <div className="rounded bg-white p-3 text-center dark:bg-gray-800">
                                                <div className="text-sm text-gray-500">Genre</div>
                                                <div className="font-medium">Masculin/Féminin</div>
                                            </div>
                                            <div className="rounded bg-white p-3 text-center dark:bg-gray-800">
                                                <div className="text-sm text-gray-500">Intention</div>
                                                <div className="font-medium">Programme souhaité</div>
                                            </div>
                                            <div className="rounded bg-white p-3 text-center dark:bg-gray-800">
                                                <div className="text-sm text-gray-500">Moyenne</div>
                                                <div className="font-medium">Performance académique</div>
                                            </div>
                                            <div className="rounded bg-white p-3 text-center dark:bg-gray-800">
                                                <div className="text-sm text-gray-500">Provenance</div>
                                                <div className="font-medium">Contexte régional</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t bg-gray-50 py-4 dark:bg-gray-900">
                                    <div className="flex w-full items-center justify-between">
                                        <div className="text-sm text-gray-500">
                                            <span className="font-medium">Modèle:</span> XGBoost Classifier
                                            <span className="mx-2">•</span>
                                            <span className="font-medium">Fichier:</span> xgboost_filiere_model.pkl
                                            <span className="mx-2">•</span>
                                            <span className="font-medium">Date:</span>{' '}
                                            {(() => {
                                                const rawData = predictions[activeStudent];
                                                const predData =
                                                    rawData && rawData.data && rawData.data.prediction
                                                        ? rawData.data
                                                        : rawData && rawData.prediction
                                                          ? rawData
                                                          : null;
                                                const date = predData?.prediction?.predicted_at;
                                                return date ? new Date(date).toLocaleString('fr-FR') : '-';
                                            })()}
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        )}
                    </>
                )}

                {activeTab === 'stats' && (
                    <div className="space-y-8">
                        {/* Statistiques principales */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="border-l-4 border-indigo-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">Total Prédictions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-indigo-600">{stats.total_predictions}</div>
                                    <p className="text-xs text-gray-500">Étudiants analysés</p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-green-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">Confiance Élevée</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-green-600">{stats.high_confidence_count}</div>
                                    <p className="text-xs text-gray-500">≥ 75%</p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-yellow-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">Confiance Moyenne</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-yellow-600">{stats.medium_confidence_count}</div>
                                    <p className="text-xs text-gray-500">60-74%</p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-purple-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">Confiance Moyenne Générale</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-purple-600">
                                        {stats.average_confidence ? stats.average_confidence.toFixed(1) : 0}%
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Distribution par programme */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                                    Distribution par Filière
                                </CardTitle>
                                <CardDescription>Répartition des prédictions entre les différentes filières de Master</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.entries(stats.programs_distribution).map(([program, count]) => {
                                        const percentage = (count / stats.total_predictions) * 100;
                                        return (
                                            <div key={program} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={getOrientationColor(program)}>{program}</Badge>
                                                        <span className="text-sm text-gray-600">{count} étudiants</span>
                                                    </div>
                                                    <span className="font-medium">{percentage.toFixed(1)}%</span>
                                                </div>
                                                <Progress value={percentage} className="h-2" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Niveaux de confiance */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-indigo-600" />
                                    Niveaux de Confiance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="rounded-lg bg-green-50 p-4">
                                        <div className="mb-2 flex items-center gap-3">
                                            <div className="rounded-full bg-green-100 p-2">
                                                <Check className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-green-800">{stats.high_confidence_count}</div>
                                                <div className="text-sm text-green-700">Haute confiance</div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-green-600">Prédictions très fiables (≥75%)</p>
                                    </div>
                                    <div className="rounded-lg bg-yellow-50 p-4">
                                        <div className="mb-2 flex items-center gap-3">
                                            <div className="rounded-full bg-yellow-100 p-2">
                                                <Info className="h-5 w-5 text-yellow-600" />
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-yellow-800">{stats.medium_confidence_count}</div>
                                                <div className="text-sm text-yellow-700">Confiance moyenne</div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-yellow-600">Prédictions acceptables (60-74%)</p>
                                    </div>
                                    <div className="rounded-lg bg-orange-50 p-4">
                                        <div className="mb-2 flex items-center gap-3">
                                            <div className="rounded-full bg-orange-100 p-2">
                                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-orange-800">{stats.low_confidence_count}</div>
                                                <div className="text-sm text-orange-700">Faible confiance</div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-orange-600">Prédictions à vérifier (&lt;60%)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'model' && (
                    <div className="space-y-8">
                        {/* Informations du modèle */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cpu className="h-5 w-5 text-indigo-600" />
                                    Informations du Modèle XGBoost
                                </CardTitle>
                                <CardDescription>Modèle pré-entraîné utilisé pour les prédictions de filières Master</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {checkingModel ? (
                                    <div className="flex items-center justify-center py-8">
                                        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                                        <span className="ml-3">Vérification du modèle...</span>
                                    </div>
                                ) : modelStatus ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="rounded-lg bg-indigo-50 p-4">
                                                <div className="mb-2 flex items-center gap-3">
                                                    <div className="rounded-full bg-indigo-100 p-2">
                                                        {modelStatus.model_exists ? (
                                                            <Check className="h-5 w-5 text-green-600" />
                                                        ) : (
                                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-bold text-indigo-800">
                                                            {modelStatus.model_exists ? 'Disponible' : 'Non disponible'}
                                                        </div>
                                                        <div className="text-sm text-indigo-700">Statut du modèle</div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-indigo-600">
                                                    {modelStatus.model_exists
                                                        ? 'Le modèle est prêt pour les prédictions'
                                                        : 'Le modèle doit être entraîné avant utilisation'}
                                                </p>
                                            </div>

                                            {modelStatus.model_exists && modelStatus.model_info.size && (
                                                <div className="rounded-lg bg-purple-50 p-4">
                                                    <div className="mb-2 flex items-center gap-3">
                                                        <div className="rounded-full bg-purple-100 p-2">
                                                            <FileText className="h-5 w-5 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-bold text-purple-800">
                                                                {formatFileSize(modelStatus.model_info.size)}
                                                            </div>
                                                            <div className="text-sm text-purple-700">Taille du fichier</div>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-purple-600">Fichier: {modelStatus.model_path.split('/').pop()}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:bg-gray-900">
                                            <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Détails techniques</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Chemin du modèle:</span>
                                                    <code className="rounded bg-gray-100 px-2 py-1 text-sm">{modelStatus.model_path}</code>
                                                </div>
                                                {modelStatus.model_info.modified && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Dernière modification:</span>
                                                        <span className="font-medium">
                                                            {new Date(modelStatus.model_info.modified).toLocaleString('fr-FR')}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Type de modèle:</span>
                                                    <Badge className="bg-blue-100 text-blue-800">XGBoost Classifier</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Variables utilisées */}
                                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:bg-gray-900">
                                            <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Variables utilisées</h4>
                                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                                {[
                                                    { name: 'Genre', description: 'Masculin/Féminin', importance: 'Haute' },
                                                    { name: 'Intention', description: 'Programme souhaité', importance: 'Haute' },
                                                    { name: 'Cours optionnels', description: 'Spécialisations', importance: 'Moyenne' },
                                                    { name: 'Provenance région', description: 'Contexte géographique', importance: 'Moyenne' },
                                                    { name: 'Établissement', description: 'Origine académique', importance: 'Basse' },
                                                    { name: 'Âge', description: 'Facteur démographique', importance: 'Basse' },
                                                    { name: 'Moyenne licence', description: 'Performance académique', importance: 'Haute' },
                                                ].map((variable, index) => (
                                                    <div key={index} className="rounded border border-gray-200 p-3">
                                                        <div className="font-medium text-gray-900">{variable.name}</div>
                                                        <div className="mt-1 text-sm text-gray-600">{variable.description}</div>
                                                        <Badge
                                                            variant="outline"
                                                            className={`mt-2 ${
                                                                variable.importance === 'Haute'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : variable.importance === 'Moyenne'
                                                                      ? 'bg-yellow-100 text-yellow-800'
                                                                      : 'bg-blue-100 text-blue-800'
                                                            }`}
                                                        >
                                                            {variable.importance}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-500">Impossible de récupérer les informations du modèle</div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={checkModelStatus} disabled={checkingModel} variant="outline" className="flex items-center gap-2">
                                        {checkingModel ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        Actualiser
                                    </Button>
                                    <Button
                                        onClick={trainModel}
                                        disabled={isTraining}
                                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
                                    >
                                        {isTraining ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                        {isTraining ? 'Entraînement en cours...' : 'Entraîner le modèle'}
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>

                        {/* Instructions d'utilisation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="h-5 w-5 text-indigo-600" />
                                    Instructions d'utilisation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-blue-50 p-4">
                                        <h4 className="mb-2 font-semibold text-blue-900">Étape 1: Vérifier le modèle</h4>
                                        <p className="text-blue-800">
                                            Assurez-vous que le modèle xgboost_filiere_model.pkl est disponible dans le répertoire storage/ml/
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-green-50 p-4">
                                        <h4 className="mb-2 font-semibold text-green-900">Étape 2: Entraîner (si nécessaire)</h4>
                                        <p className="text-green-800">
                                            Si le modèle n'existe pas ou doit être mis à jour, utilisez le bouton "Entraîner le modèle"
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-purple-50 p-4">
                                        <h4 className="mb-2 font-semibold text-purple-900">Étape 3: Faire des prédictions</h4>
                                        <p className="text-purple-800">
                                            Analysez individuellement ou en lot les étudiants pour obtenir leurs recommandations de filières
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Squelette de chargement pour la prédiction */}
                {activeStudent !== null && loading[activeStudent] && (
                    <Card className="border-t-4 border-indigo-500">
                        <CardHeader>
                            <Skeleton className="h-8 w-96" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Skeleton className="h-32 w-full rounded-xl" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-32 rounded-lg" />
                                ))}
                            </div>
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-24 rounded-lg" />
                                <Skeleton className="h-24 rounded-lg" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Progression de l'entraînement */}
                {isTraining && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="mx-4 w-full max-w-md rounded-xl bg-white p-8">
                            <div className="mb-6 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-gray-900">Entraînement du modèle XGBoost</h3>
                                <p className="text-gray-600">{trainingMessage}</p>
                            </div>
                            <div className="mb-4">
                                <Progress value={trainingProgress} className="h-3" />
                                <div className="mt-2 text-center text-sm text-gray-500">{trainingProgress}%</div>
                            </div>
                            <div className="text-center text-sm text-gray-500">
                                Cette opération peut prendre plusieurs minutes. Veuillez patienter...
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
