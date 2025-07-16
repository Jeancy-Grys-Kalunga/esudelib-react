'use client';
import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    BookOpen, 
    BarChart, 
    GraduationCap,
    BrainCircuit,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { toast } from 'react-toastify';

export default function OrientationPrediction({ academicYear, promotion, students }) {
    const [predictions, setPredictions] = useState({});
    const [loading, setLoading] = useState({});
    const [activeStudent, setActiveStudent] = useState(null);

    const predictOrientation = (studentId) => {
        setLoading(prev => ({ ...prev, [studentId]: true }));
        setActiveStudent(studentId);
        
        axios.get(`/jury/students/${studentId}/predict-orientation`)
            .then(response => {
                setPredictions(prev => ({
                    ...prev,
                    [studentId]: response.data
                }));
            })
            .catch(error => {
                toast.error('Erreur lors de la prédiction');
                console.error('Prediction error:', error);
            })
            .finally(() => {
                setLoading(prev => ({ ...prev, [studentId]: false }));
            });
    };

    const getOrientationColor = (orientation) => {
        const colors = {
            'Informatique': 'bg-blue-100 text-blue-800 border-blue-300',
            'Génie Civil': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'Médecine': 'bg-red-100 text-red-800 border-red-300',
            'Droit': 'bg-purple-100 text-purple-800 border-purple-300',
            'Économie': 'bg-green-100 text-green-800 border-green-300',
            'default': 'bg-gray-100 text-gray-800 border-gray-300'
        };
        
        return colors[orientation] || colors['default'];
    };

    return (
        <AppLayout>
            <div className="container mx-auto px-4 py-8">
                <Head title="Prédiction d'orientation" />

                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                        <BrainCircuit className="h-10 w-10 text-indigo-600" />
                        <div>
                            Système Expert d'Orientation
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
                    <p className="mt-4 text-gray-600">
                        Prédiction des orientations pour le troisième cycle basée sur les performances académiques
                    </p>
                </div>

                {/* Tableau des étudiants */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                            Liste des étudiants
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Étudiant</TableHead>
                                    <TableHead className="text-center">Moyenne</TableHead>
                                    <TableHead className="text-center">Crédits</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.data.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-indigo-100 p-2">
                                                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                {student.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">
                                                {student.average?.toFixed(2) || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline">
                                                {student.credits || '0'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button 
                                                onClick={() => predictOrientation(student.id)}
                                                disabled={loading[student.id]}
                                                className="flex items-center gap-2"
                                            >
                                                {loading[student.id] ? (
                                                    <span>Analyse en cours...</span>
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-4 w-4" />
                                                        <span>Prédire l'orientation</span>
                                                    </>
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Résultats de prédiction */}
                {activeStudent && predictions[activeStudent] && (
                    <Card className="border-t-4 border-indigo-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart className="h-5 w-5 text-indigo-600" />
                                Résultats de prédiction pour: {predictions[activeStudent].student.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium">Orientation recommandée</h3>
                                    <Badge className="text-lg px-4 py-1.5">
                                        {predictions[activeStudent].prediction}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600">Confiance du modèle:</span>
                                    {/* <Progress 
                                        value={predictions[activeStudent].confidence} 
                                        className="h-3"
                                    /> */}
                                    <span className="text-sm font-medium">
                                        {predictions[activeStudent].confidence}%
                                    </span>
                                </div>
                            </div>

                            <h3 className="font-medium mb-4">Performances par domaine:</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.entries(predictions[activeStudent].orientations).map(([orientation, score]) => (
                                    <Card key={orientation} className="border-0 shadow-sm">
                                        <CardHeader className="py-3">
                                            <div className="text-sm font-medium text-gray-600">
                                                {orientation}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="py-0 pb-4">
                                            <div className="flex items-end justify-between">
                                                <span className="text-2xl font-bold">
                                                    {score.toFixed(1)}
                                                </span>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500">
                                                        Score pondéré
                                                    </div>
                                                    <div 
                                                        className={`text-xs px-2 py-1 rounded-full ${getOrientationColor(orientation)}`}
                                                    >
                                                        {score >= 12 ? 'Fort' : score >= 10 ? 'Moyen' : 'Faible'}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="mt-8">
                                <h3 className="font-medium mb-2">Explication de la prédiction</h3>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                                    <p className="mb-2">
                                        Le système expert a analysé les performances de l'étudiant dans différentes 
                                        disciplines pour déterminer l'orientation la plus adaptée.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>
                                            L'étudiant montre des aptitudes marquées en <strong>{predictions[activeStudent].prediction}</strong>
                                        </li>
                                        <li>
                                            Score de confiance élevé ({predictions[activeStudent].confidence}%) 
                                            indiquant une bonne cohérence des résultats
                                        </li>
                                        <li>
                                            Les cours de spécialisation dans ce domaine ont été excellents
                                        </li>
                                    </ul>
                                    <div className="mt-3 flex items-center gap-2 text-blue-700">
                                        <ArrowRight className="h-4 w-4" />
                                        <span>Recommandation: Poursuite en Master {predictions[activeStudent].prediction}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50 py-3 border-t">
                            <div className="text-xs text-gray-500">
                                * Prédiction basée sur le modèle Rubix/ML entraîné sur les données historiques
                            </div>
                        </CardFooter>
                    </Card>
                )}

                {/* Squelette de chargement */}
                {loading[activeStudent] && (
                    <Card className="border-t-4 border-indigo-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Skeleton className="h-6 w-64" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-32" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <Skeleton key={i} className="h-24 rounded-lg" />
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-32 rounded-lg" />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}