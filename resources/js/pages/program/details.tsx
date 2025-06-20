import { Head, useForm } from '@inertiajs/react';
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';

// Types pour les données
type Course = {
    id: number;
    name: string;
};

type Promotion = {
    id: number;
    name: string;
};

type UnitsTeaching = {
    id: number;
    name: string;
};

type CourseCategory = {
    id: number;
    name: string;
};

type CourseDetail = {
    id?: number;
    course_id: string;
    promotion_id: string;
    units_teaching_id: string;
    course_category_id: string;
    cm: number | string;
    td: number | string;
    tp: number | string;
    credits: number | string;
};

type Program = {
    id: number;
    name: string;
    institution: string;
    course_details?: CourseDetail[];
};

// Props pour le composant
interface ProgramDetailsPageProps extends PageProps {
    program: Program;
    courses: Course[];
    promotions: Promotion[];
    units: UnitsTeaching[];
    categories: CourseCategory[];
}

export default function ProgramDetailsForm({ program, courses, promotions, units, categories, flash }: ProgramDetailsPageProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [courseDetails, setCourseDetails] = useState<CourseDetail[]>(
        program.course_details?.length
            ? program.course_details.map((detail) => ({
                  ...detail,
                  cm: detail.cm.toString(),
                  td: detail.td.toString(),
                  tp: detail.tp.toString(),
                  credits: detail.credits.toString(),
              }))
            : Array(3)
                  .fill(null)
                  .map(() => ({
                      course_id: courses.length > 0 ? courses[0].id.toString() : '',
                      promotion_id: promotions.length > 0 ? promotions[0].id.toString() : '',
                      units_teaching_id: units.length > 0 ? units[0].id.toString() : '',
                      course_category_id: categories.length > 0 ? categories[0].id.toString() : '',
                      cm: '',
                      td: '',
                      tp: '',
                      credits: '',
                  })),
    );

    const { data, setData, post, put, errors, reset } = useForm({
        course_details: courseDetails,
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setData('course_details', courseDetails);
    }, [courseDetails]);

    const validateFields = () => {
        const newErrors: Record<string, string> = {};

        courseDetails.forEach((detail, index) => {
            const requiredFields: Array<keyof CourseDetail> = ['course_id', 'promotion_id', 'units_teaching_id', 'course_category_id'];

            requiredFields.forEach((field) => {
                if (!detail[field] || detail[field] === '') {
                    newErrors[`${index}_${field}`] = 'Ce champ est obligatoire';
                }
            });

            // Validation des champs numériques
            const numericFields: Array<'cm' | 'td' | 'tp' | 'credits'> = ['cm', 'td', 'tp', 'credits'];
            numericFields.forEach((field) => {
                const value = detail[field];
                if (value !== '' && isNaN(Number(value))) {
                    newErrors[`${index}_${field}`] = 'Veuillez entrer un nombre valide';
                }
            });
        });

        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Afficher les messages flash
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

    const addCourseDetail = () => {
        setCourseDetails([
            ...courseDetails,
            {
                course_id: courses.length > 0 ? courses[0].id.toString() : '',
                promotion_id: promotions.length > 0 ? promotions[0].id.toString() : '',
                units_teaching_id: units.length > 0 ? units[0].id.toString() : '',
                course_category_id: categories.length > 0 ? categories[0].id.toString() : '',
                cm: '',
                td: '',
                tp: '',
                credits: '',
            },
        ]);
    };

    const removeCourseDetail = (index: number) => {
        if (courseDetails.length > 1) {
            const newDetails = [...courseDetails];
            newDetails.splice(index, 1);
            setCourseDetails(newDetails);
        }
    };

    const updateCourseDetail = (index: number, field: keyof CourseDetail, value: string | number) => {
        const newDetails = [...courseDetails];
        newDetails[index] = { ...newDetails[index], [field]: value };
        setCourseDetails(newDetails);
    };

    const safeConvert = (value: string | number): number => {
        if (typeof value === 'number') return value;
        const trimmed = String(value).trim();
        if (trimmed === '') return 0;
        const normalized = trimmed.replace(',', '.');
        const num = parseFloat(normalized);
        return isNaN(num) ? 0 : num;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!validateFields()) {
            toast.error('Veuillez corriger les erreurs dans le formulaire');
            setIsSubmitting(false);
            return;
        }

        // Préparer les données numériques
        const formattedDetails = courseDetails.map(detail => ({
            ...detail,
            cm: safeConvert(detail.cm),
            td: safeConvert(detail.td),
            tp: safeConvert(detail.tp),
            credits: safeConvert(detail.credits),
        }));

        try {
            const payload = { course_details: formattedDetails };

            if (program.course_details?.length) {
                await put(route('programs.details.update', program.id), {
                    ...payload,
                    preserveScroll: true,
                    onSuccess: () => reset(),
                    onError: (errors) => {
                        // Affiche les erreurs globales
                        if (errors.course_details) {
                            toast.error(errors.course_details);
                        } else {
                            toast.error('Erreur de validation');
                        }
                        // Affiche les erreurs spécifiques dans le formulaire
                        Object.entries(errors).forEach(([key, value]) => {
                            if (typeof value === 'string') {
                                toast.error(`${key}: ${value}`);
                            }
                        });
                    },
                });
            } else {
                await post(route('programs.details.store', program.id), {
                    ...payload,
                    preserveScroll: true,
                    onSuccess: () => reset(),
                    onError: (errors) => {
                        // Affiche les erreurs globales
                        if (errors.course_details) {
                            toast.error(errors.course_details);
                        } else {
                            toast.error('Erreur de validation');
                        }
                        // Affiche les erreurs spécifiques dans le formulaire
                        Object.entries(errors).forEach(([key, value]) => {
                            if (typeof value === 'string') {
                                toast.error(`${key}: ${value}`);
                            }
                        });
                    },
                });
            }
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout>
            <Head title={`Détails du programme - ${program.name}`} />
            <div className="container mx-auto space-y-6 py-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {program.course_details?.length ? 'Modifier les détails' : 'Ajouter des détails'} du programme
                        </h1>
                        <p className="text-2xl font-semibold">{program.name}</p>
                        <p className="text-muted-foreground">Institution: {program.institution}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="border-t pt-6">
                        <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                            <h3 className="text-lg font-medium">Cours du programme</h3>
                            <Button type="button" onClick={addCourseDetail} variant="outline" size="sm" className="flex items-center gap-1">
                                <Plus className="h-4 w-4" />
                                Ajouter un cours
                            </Button>
                        </div>

                        <div className="flex flex-col gap-8">
                            {courseDetails.map((detail, index) => (
                                <div
                                    key={index}
                                    className="mb-2 grid grid-cols-1 gap-6 rounded-xl border bg-white p-6 shadow-sm transition-all md:grid-cols-2 lg:grid-cols-4 dark:bg-gray-900"
                                >
                                    {/* Cours */}
                                    <div className="col-span-1 space-y-2 lg:col-span-2">
                                        <Label htmlFor={`course_id_${index}`}>Cours *</Label>
                                        <Select value={detail.course_id} onValueChange={(value) => updateCourseDetail(index, 'course_id', value)}>
                                            <SelectTrigger className="focus:ring-primary-500 w-full max-w-full min-w-0 truncate border-gray-300 focus:ring-2">
                                                <SelectValue placeholder="Sélectionnez un cours" className="truncate" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-72 w-[350px] md:w-[420px]">
                                                {courses.map((course) => (
                                                    <SelectItem
                                                        key={course.id}
                                                        value={course.id.toString()}
                                                        className="px-3 py-2 break-words whitespace-normal"
                                                    >
                                                        <span className="block truncate">{course.name}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldErrors[`${index}_course_id`] && (
                                            <p className="text-sm text-red-500">{fieldErrors[`${index}_course_id`]}</p>
                                        )}
                                    </div>

                                    {/* Promotion */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`promotion_id_${index}`}>Promotion *</Label>
                                        <Select
                                            value={detail.promotion_id}
                                            onValueChange={(value) => updateCourseDetail(index, 'promotion_id', value)}
                                        >
                                            <SelectTrigger className="focus:ring-primary-500 w-full min-w-0 border-gray-300 focus:ring-2">
                                                <SelectValue placeholder="Sélectionnez une promotion" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {promotions.map((promotion) => (
                                                    <SelectItem key={promotion.id} value={promotion.id.toString()}>
                                                        {promotion.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldErrors[`${index}_promotion_id`] && (
                                            <p className="text-sm text-red-500">{fieldErrors[`${index}_promotion_id`]}</p>
                                        )}
                                    </div>

                                    {/* Unité */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`units_teaching_id_${index}`}>Unité *</Label>
                                        <Select
                                            value={detail.units_teaching_id}
                                            onValueChange={(value) => updateCourseDetail(index, 'units_teaching_id', value)}
                                        >
                                            <SelectTrigger className="focus:ring-primary-500 w-full min-w-0 border-gray-300 focus:ring-2">
                                                <SelectValue placeholder="Sélectionnez une unité" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {units.map((unit) => (
                                                    <SelectItem key={unit.id} value={unit.id.toString()}>
                                                        {unit.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldErrors[`${index}_units_teaching_id`] && (
                                            <p className="text-sm text-red-500">{fieldErrors[`${index}_units_teaching_id`]}</p>
                                        )}
                                    </div>

                                    {/* Catégorie */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`course_category_id_${index}`}>Catégorie *</Label>
                                        <Select
                                            value={detail.course_category_id}
                                            onValueChange={(value) => updateCourseDetail(index, 'course_category_id', value)}
                                        >
                                            <SelectTrigger className="focus:ring-primary-500 w-full min-w-0 border-gray-300 focus:ring-2">
                                                <SelectValue placeholder="Sélectionnez une catégorie" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id.toString()}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldErrors[`${index}_course_category_id`] && (
                                            <p className="text-sm text-red-500">{fieldErrors[`${index}_course_category_id`]}</p>
                                        )}
                                    </div>

                                    {/* CM */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`cm_${index}`}>CM (h)</Label>
                                        <Input
                                            type="text" // Changé en type "text" pour gérer les virgules
                                            value={detail.cm}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // On permet les nombres à virgule
                                                if (value === '' || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
                                                    updateCourseDetail(index, 'cm', value);
                                                }
                                            }}
                                            className="w-full"
                                        />
                                        {fieldErrors[`${index}_cm`] && (
                                            <p className="text-sm text-red-500">{fieldErrors[`${index}_cm`]}</p>
                                        )}
                                    </div>

                                    {/* TD */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`td_${index}`}>TD (h)</Label>
                                        <Input
                                            type="text"
                                            value={detail.td}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
                                                    updateCourseDetail(index, 'td', value);
                                                }
                                            }}
                                            className="w-full"
                                        />
                                        {fieldErrors[`${index}_td`] && (
                                            <p className="text-sm text-red-500">{fieldErrors[`${index}_td`]}</p>
                                        )}
                                    </div>

                                    {/* TP */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`tp_${index}`}>TP (h)</Label>
                                        <Input
                                            type="text"
                                            value={detail.tp}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
                                                    updateCourseDetail(index, 'tp', value);
                                                }
                                            }}
                                            className="w-full"
                                        />
                                        {fieldErrors[`${index}_tp`] && (
                                            <p className="text-sm text-red-500">{fieldErrors[`${index}_tp`]}</p>
                                        )}
                                    </div>

                                    {/* Crédits */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`credits_${index}`}>Crédits</Label>
                                        <Input
                                            type="text"
                                            value={detail.credits}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || /^[0-9]*[,.]?[0-9]*$/.test(value)) {
                                                    updateCourseDetail(index, 'credits', value);
                                                }
                                            }}
                                            className="w-full"
                                        />
                                        {fieldErrors[`${index}_credits`] && (
                                            <p className="text-sm text-red-500">{fieldErrors[`${index}_credits`]}</p>
                                        )}
                                    </div>

                                    {/* Supprimer */}
                                    <div className="col-span-1 mt-2 flex justify-end lg:col-span-4">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeCourseDetail(index)}
                                            disabled={courseDetails.length <= 1}
                                            className="flex items-center gap-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Supprimer
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col justify-end gap-3 sm:flex-row">
                        <Button type="button" variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full min-w-[180px] gap-2 sm:w-auto">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Enregistrement...</span>
                                </>
                            ) : program.course_details?.length ? (
                                <>
                                    <Edit className="h-4 w-4" />
                                    Mettre à jour
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4" />
                                    Créer les détails
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
