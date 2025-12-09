'use client';
import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    BookOpen, 
    BarChart, 
    GraduationCap,
    BrainCircuit,
    ArrowRight,
    Sparkles,
    TrendingUp,
    Award,
    Target,
    Zap,
    Download,
    RefreshCw,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { toast } from 'react-toastify';
import axios from 'axios';

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
}

interface Student {
    id: number;
    name: string;
    matricule: string;
    average?: number;
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
    average_confidence: number;
}

interface AlternativeOption {
    program: string;
    probability: number;
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
    top_3_programs: [string, number][]; // Array of tuples [program_name, probability]
    predicted_at: string;
    explanation?: PredictionExplanation;
}

interface PredictionResponse {
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

export default function OrientationPrediction({ academicYear, promotion, students, stats }: OrientationPredictionProps) {
    const [predictions, setPredictions] = useState<Record<number, PredictionResponse>>({});
    const [loading, setLoading] = useState<Record<number, boolean>>({});
    const [activeStudent, setActiveStudent] = useState<number | null>(null);
    const [isTraining, setIsTraining] = useState(false);
    const [isBatchPredicting, setIsBatchPredicting] = useState(false);

    const predictOrientation = async (studentId: number) => {
        setLoading(prev => ({ ...prev, [studentId]: true }));
        setActiveStudent(studentId);
        
        try {
            const response = await axios.get(`/jury/students/${studentId}/predict-orientation`);
            if (response.data.success) {
                setPredictions(prev => ({
                    ...prev,
                    [studentId]: response.data.data
                }));
                toast.success('Prédiction générée avec succès!');
            }
        } catch (error) {
            toast.error('Erreur lors de la prédiction');
            console.error('Prediction error:', error);
        } finally {
            setLoading(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const trainModel = async () => {
        setIsTraining(true);
        try {
            const response = await axios.post('/jury/train-model');
            if (response.data.success) {
                toast.success(`Modèle entraîné avec succès! Précision: ${(response.data.data.accuracy * 100).toFixed(2)}%`);
            }
        } catch (error) {
            toast.error('Erreur lors de l\'entraînement du modèle');
            console.error('Training error:', error);
        } finally {
            setIsTraining(false);
        }
    };

    const predictBatch = async () => {
        setIsBatchPredicting(true);
        try {
            const response = await axios.post('/jury/predict-batch');
            if (response.data.success) {
                const { successful, failed, total } = response.data.data;
                toast.success(`Prédictions générées: ${successful}/${total} réussies`);
                if (failed > 0) {
                    toast.warning(`${failed} prédictions ont échoué`);
                }
                router.reload({ only: ['students'] });
            }
        } catch (error) {
            toast.error('Erreur lors de la prédiction en lot');
            console.error('Batch prediction error:', error);
        } finally {
            setIsBatchPredicting(false);
        }
    };

    const getOrientationColor = (orientation: string) => {
        const colors: Record<string, string> = {
            'Informatique': 'bg-blue-100 text-blue-800 border-blue-300',
            'Génie Civil': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'Électromécanique': 'bg-orange-100 text-orange-800 border-orange-300',
            'Médecine': 'bg-red-100 text-red-800 border-red-300',
            'Droit': 'bg-purple-100 text-purple-800 border-purple-300',
            'Économie': 'bg-green-100 text-green-800 border-green-300',
            'Gestion': 'bg-teal-100 text-teal-800 border-teal-300',
            'Sciences Politiques': 'bg-indigo-100 text-indigo-800 border-indigo-300',
            'default': 'bg-gray-100 text-gray-800 border-gray-300'
        };
        
        return colors[orientation] || colors['default'];
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 75) return 'text-green-600';
        if (confidence >= 60) return 'text-yellow-600';
        return 'text-orange-600';
    };

    return (
        <AppLayout>
            <div className="container mx-auto px-4 py-8">
                <Head title="Analyse Prédictive - Filières de Master" />

                {/* En-tête moderne */}
                <div className="mb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="flex items-center gap-3 text-4xl font-bold text-gray-900 dark:text-white">
                                <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3">
                                    <BrainCircuit className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                    Analyse Prédictive des Filières de Master
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                                            <GraduationCap className="mr-1 h-4 w-4" />
                                            {academicYear.title}
                                        </Badge>
                                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                            {promotion.title}
                                        </Badge>
                                    </div>
                                </div>
                            </h1>
                            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                                Système intelligent basé sur l'IA pour prédire les filières de Master optimales pour chaque étudiant
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button 
                                onClick={trainModel}
                                disabled={isTraining}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                {isTraining ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Entraînement...
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
                                disabled={isBatchPredicting}
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
                        </div>
                    </div>
                </div>

                {/* Statistiques */}
                {stats && stats.total_predictions > 0 && (
                    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-l-4 border-indigo-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Total Prédictions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-indigo-600">{stats.total_predictions}</div>
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
                                <CardTitle className="text-sm font-medium text-gray-600">Confiance Moyenne</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-600">
                                    {stats.average_confidence ? stats.average_confidence.toFixed(1) : 0}%
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tableau des étudiants */}
                <Card className="mb-8 overflow-hidden shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                            Liste des étudiants
                        </CardTitle>
                        <CardDescription>
                            Cliquez sur "Analyser" pour générer une prédiction personnalisée pour chaque étudiant
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 dark:bg-gray-900">
                                        <TableHead className="font-semibold">Étudiant</TableHead>
                                        <TableHead className="text-center font-semibold">Moyenne</TableHead>
                                        <TableHead className="text-center font-semibold">Prédiction Actuelle</TableHead>
                                        <TableHead className="text-center font-semibold">Confiance</TableHead>
                                        <TableHead className="text-center font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.data.map(student => (
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
                                                    {student.average?.toFixed(2) || 'N/A'}
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
                                                        <Progress 
                                                            value={student.master_prediction.confidence_score} 
                                                            className="h-2 w-20"
                                                        />
                                                        <span className={`text-sm font-semibold ${getConfidenceColor(student.master_prediction.confidence_score)}`}>
                                                            {student.master_prediction.confidence_score.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button 
                                                    onClick={() => predictOrientation(student.id)}
                                                    disabled={loading[student.id]}
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
                    <Card className="border-t-4 border-indigo-500 shadow-2xl">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-6 w-6 text-indigo-600" />
                                Analyse Détaillée - {predictions[activeStudent].student.name}
                            </CardTitle>
                            <CardDescription>
                                Résultats générés par notre système d'intelligence artificielle avancé
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Prédiction principale */}
                            <div className="mb-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="mb-2 text-lg font-medium opacity-90">Filière Recommandée</h3>
                                        <div className="text-4xl font-bold">
                                            {predictions[activeStudent].prediction.predicted_master}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="mb-2 text-sm opacity-90">Score de Confiance</div>
                                        <div className="flex items-center gap-3">
                                            <Progress 
                                                value={predictions[activeStudent].prediction.confidence_score} 
                                                className="h-3 w-32 bg-white/30"
                                            />
                                            <span className="text-3xl font-bold">
                                                {predictions[activeStudent].prediction.confidence_score.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top 3 programmes */}
                            <div className="mb-8">
                                <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                                    Top 3 des Filières Compatibles
                                </h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {predictions[activeStudent].prediction.top_3_programs.map(([program, probability], index) => (
                                        <Card key={program} className={`border-2 ${index === 0 ? 'border-indigo-500 shadow-lg' : 'border-gray-200'}`}>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <Badge className={index === 0 ? 'bg-indigo-600' : 'bg-gray-500'}>
                                                        #{index + 1}
                                                    </Badge>
                                                    <Award className={`h-5 w-5 ${index === 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="mb-2 text-lg font-semibold">{program}</div>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={probability} className="h-2 flex-1" />
                                                    <span className="text-sm font-medium text-indigo-600">
                                                        {probability.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Explication détaillée */}
                            {predictions[activeStudent].prediction.explanation && (
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
                                            <p className="text-indigo-800 dark:text-indigo-200">
                                                {predictions[activeStudent].prediction.explanation.main_reason}
                                            </p>
                                        </div>

                                        {/* Facteurs de support */}
                                        {predictions[activeStudent].prediction.explanation.supporting_factors.length > 0 && (
                                            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:bg-gray-900">
                                                <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                                                    Facteurs Déterminants
                                                </h4>
                                                <ul className="space-y-2">
                                                    {predictions[activeStudent].prediction.explanation.supporting_factors.map((factor, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <div className="mt-1 rounded-full bg-green-500 p-1">
                                                                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
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
                                                        Notre Recommandation
                                                    </h4>
                                                    <p className="text-green-800 dark:text-green-200">
                                                        {predictions[activeStudent].prediction.explanation.recommendation}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Options alternatives */}
                                        {predictions[activeStudent].prediction.explanation.alternative_options.length > 0 && (
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:bg-gray-900">
                                                <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                                                    Options Alternatives
                                                </h4>
                                                <div className="space-y-2">
                                                    {predictions[activeStudent].prediction.explanation.alternative_options.map((option, index) => (
                                                        <div key={index} className="flex items-center justify-between rounded-md bg-white p-3 dark:bg-gray-800">
                                                            <span className="font-medium">{option.program}</span>
                                                            <div className="flex items-center gap-2">
                                                                <Progress value={option.probability} className="h-2 w-24" />
                                                                <span className="text-sm text-gray-600">{option.probability.toFixed(1)}%</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="border-t bg-gray-50 py-4 dark:bg-gray-900">
                            <div className="flex w-full items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    <span className="font-medium">Modèle:</span> Gradient Boosting Classifier
                                    <span className="mx-2">•</span>
                                    <span className="font-medium">Date:</span> {new Date(predictions[activeStudent].prediction.predicted_at).toLocaleString('fr-FR')}
                                </div>
                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Télécharger le rapport
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                )}

                {/* Squelette de chargement */}
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
                                {[1, 2, 3].map(i => (
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
            </div>
        </AppLayout>
    );
}