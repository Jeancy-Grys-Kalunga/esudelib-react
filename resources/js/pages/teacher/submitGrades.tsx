import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileInput, Upload } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Label } from '@/components/ui/label';
import { useState, ChangeEvent, FormEvent } from 'react';

type Course = {
    id: number;
    title: string;
    code: string;
};

type Promotion = {
    id: number;
    title: string;
};

type AcademicYear = {
    id: number;
    title: string;
};



type PageProps = {
    course: Course;
    promotions: Promotion[];
    academicYears: AcademicYear[];
};

export default function SubmitGrades({ course, promotions, academicYears }: PageProps) {
    const { data, setData, post, errors, processing } = useForm<{
        grades_file: File | null;
        session: string;
        promotion_id: string;
        academic_year_id?: string;
    }>({
        grades_file: null,
        session: '',
        promotion_id: '',
        academic_year_id: ''
    });
    
    const [fileName, setFileName] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('teacher.courses.submit', course.id), {
            forceFormData: true,
        });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('grades_file', file);
            setFileName(file.name);
        }
    };

    return (
        <AppLayout>
            <Head title={`Soumettre les notes - ${course.title}`} />
            <div className="container mx-auto py-8">
                <Card className="shadow-lg max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-6 w-6" />
                            Soumettre les notes pour {course.title}
                        </CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="session" className="block mb-2">
                                    Session
                                </Label>
                                <select
                                    id="session"
                                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.session || ''}
                                    onChange={e => setData('session', e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Sélectionner une session</option>
                                    <option value="Premier Semestre">Premier Semestre</option>
                                    <option value="Rattrapage Premier Semestre">Rattrapage Premier Semestre</option>
                                    <option value="Second Semestre">Second Semestre</option>
                                    <option value="Rattrapage Second Semestre">Rattrapage Second Semestre</option>
                                </select>
                                {errors.session && (
                                    <p className="text-sm text-red-500 mt-1">{errors.session}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="promotion_id" className="block mb-2">
                                    Promotion
                                </Label>
                                <select
                                    id="promotion_id"
                                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.promotion_id || ''}
                                    onChange={e => setData('promotion_id', e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Sélectionner une promotion</option>
                                    {promotions.map(promotion => (
                                        <option key={promotion.id} value={promotion.id}>
                                            {promotion.title}
                                        </option>
                                    ))}
                                </select>
                                {errors.promotion_id && (
                                    <p className="text-sm text-red-500 mt-1">{errors.promotion_id}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="academic_year_id" className="block mb-2">
                                    Année académique
                                </Label>
                                <select
                                    id="academic_year_id"
                                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.academic_year_id || ''}
                                    onChange={e => setData('academic_year_id', e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Sélectionner une année académique</option>
                                    {academicYears.map(year => (
                                        <option key={year.id} value={year.id}>
                                            {year.title}
                                        </option>
                                    ))}
                                </select>
                                {errors.academic_year_id && (
                                    <p className="text-sm text-red-500 mt-1">{errors.academic_year_id}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="grades_file" className="block mb-2">
                                    Fichier Excel (.xlsx)
                                </Label>
                                
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1">
                                        <input
                                            id="grades_file"
                                            type="file"
                                            className="sr-only"
                                            onChange={handleFileChange}
                                            accept=".xlsx,.xls"
                                        />
                                        <label
                                            htmlFor="grades_file"
                                            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer truncate"
                                        >
                                            {fileName || 'Sélectionner un fichier...'}
                                        </label>
                                    </div>
                                    
                                    <Button
                                        asChild
                                        variant="secondary"
                                        className="flex-shrink-0"
                                    >
                                        <label htmlFor="grades_file" className="cursor-pointer">
                                            Parcourir
                                        </label>
                                    </Button>
                                </div>
                                
                                {errors.grades_file && (
                                    <p className="text-sm text-red-500 mt-1">{errors.grades_file}</p>
                                )}
                                
                                <p className="text-xs text-gray-500 mt-2">
                                    Format Excel requis avec colonnes: Matricule, Nom, Point/20, Participation
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <Button 
                                    type="submit" 
                                    disabled={processing || !data.grades_file || !data.session || !data.promotion_id || !data.academic_year_id}
                                    className="gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                            </svg>
                                            Soumission en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4" />
                                            Soumettre au jury
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
