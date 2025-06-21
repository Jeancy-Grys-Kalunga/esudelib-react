import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
// import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid'; // Optionnel

type Course = {
    id: number;
    title: string;
    credits: number;
    cm: number;
    td: number;
    tp: number;
    isMandatory: boolean;
    selected: boolean;
    note: {
        cote: number;
        session: string;
        situation: string;
    } | null;
};

type PageProps = {
    courses: Course[];
    hasPendingAppeals: boolean;
    flash?: {
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
    };
};

export default function CourseSelection({ courses, hasPendingAppeals, flash }: PageProps) {
    const [selectedCourses, setSelectedCourses] = useState<number[]>(() => {
        return courses.filter((c) => c.isMandatory || c.selected).map((c) => c.id);
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const mandatoryIds = courses.filter((course) => course.isMandatory).map((course) => course.id);
        setSelectedCourses((prev) => [...new Set([...prev, ...mandatoryIds])]);
    }, [courses]);

    const toggleCourse = (courseId: number) => {
        const course = courses.find((c) => c.id === courseId);
        if (course?.isMandatory) return;
        setSelectedCourses((prev) => (prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]));
    };

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
    const submit = () => {
        setLoading(true);
        router.post(
            '/student/courses',
            { selectedCourseIds: selectedCourses },
            {
                onFinish: () => setLoading(false),
                onError: () => setLoading(false),
            }
        );
    };

    return (
        <AppLayout>
            <Head title="Inscription aux Cours" />
            <div className="container mx-auto px-2 py-10 md:px-0">
                <Card className="rounded-3xl border-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-2xl">
                    <CardHeader className="rounded-t-3xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg">
                        <CardTitle className="flex items-center justify-between text-2xl font-bold tracking-tight">
                            <span>
                                {/* <BookOpenIcon className="inline w-7 h-7 mr-2" /> */}
                                Inscription aux Cours
                            </span>
                            {hasPendingAppeals && (
                                <Badge variant="destructive" className="animate-pulse rounded-full px-4 py-2 text-base shadow-lg">
                                    {/* <ExclamationCircleIcon className="inline w-5 h-5 mr-1" /> */}
                                    Recours en attente
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="mb-8 flex items-center gap-3 rounded-xl border-l-4 border-blue-500 bg-gradient-to-r from-blue-100 to-indigo-100 p-5 shadow">
                            {/* <InformationCircleIcon className="w-6 h-6 text-blue-500" /> */}
                            <p className="text-lg font-medium text-blue-800">
                                <span className="font-bold">Note importante :</span> Les cours marqués
                                <Badge variant="default" className="mx-2 rounded-full bg-blue-600 px-3 py-1 text-white shadow">
                                    Obligatoire
                                </Badge>
                                sont sélectionnés automatiquement et ne peuvent pas être désélectionnés.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                            {courses.map((course) => {
                                const isMandatory = course.isMandatory;
                                const isSelected = selectedCourses.includes(course.id);

                                return (
                                    <div
                                        key={course.id}
                                        className={`group relative rounded-2xl border-0 bg-white p-6 shadow-lg transition-all duration-300 hover:scale-[1.025] hover:shadow-2xl ${isSelected ? 'bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-400' : ''} ${isMandatory ? 'ring-2 ring-blue-300' : ''} `}
                                    >
                                        {isMandatory && (
                                            <span className="absolute top-4 right-4">
                                                <Badge variant="default" className="rounded-full bg-blue-600 px-2 py-1 text-xs text-white shadow">
                                                    Obligatoire
                                                </Badge>
                                            </span>
                                        )}
                                        <div className="flex items-start space-x-4">
                                            <Checkbox
                                                id={`course-${course.id}`}
                                                checked={isSelected}
                                                onCheckedChange={() => toggleCourse(course.id)}
                                                disabled={isMandatory}
                                                className={`mt-1 scale-125 ${isMandatory ? 'cursor-not-allowed opacity-50' : 'transition-transform group-hover:scale-150'}`}
                                            />
                                            <div className="flex-1">
                                                <Label
                                                    htmlFor={`course-${course.id}`}
                                                    className="block text-xl font-semibold text-gray-800 transition-colors group-hover:text-blue-700"
                                                >
                                                    {course.title}
                                                </Label>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                                        CM: {course.cm}h
                                                    </Badge>
                                                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                                                        TD: {course.td}h
                                                    </Badge>
                                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                        TP: {course.tp}h
                                                    </Badge>
                                                    <Badge variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                                        {course.credits} crédits
                                                    </Badge>
                                                </div>
                                                {course.note && (
                                                    <div className="mt-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-3 shadow-inner">
                                                        <h4 className="mb-1 font-medium text-gray-700">Résultats :</h4>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-gray-800">Cote: {course.note.cote}/20</span>
                                                            <Badge
                                                                variant={course.note.situation === 'Réussite' ? 'default' : 'destructive'}
                                                                className={`rounded-full px-3 py-1 text-sm ${course.note.situation === 'Réussite' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                                                            >
                                                                {course.note.situation}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-10 flex flex-col justify-end gap-4 sm:flex-row">
                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                                className="rounded-full border-2 border-blue-500 px-6 py-2 text-blue-700 transition hover:bg-blue-50"
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={submit}
                                className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-2 text-lg font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-800"
                                disabled={loading}
                            >
                                {loading ? (
                                    <svg className="mr-2 inline h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                ) : null}
                                Enregistrer mes cours
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
