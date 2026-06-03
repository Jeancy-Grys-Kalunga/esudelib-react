import { Head, useForm } from '@inertiajs/react';
import { Check, ChevronsUpDown, Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
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

type Semestre = {
    id: number;
    title: string;
};

type CourseDetail = {
    id?: number;
    course_id: string;
    promotion_id: string;
    units_teaching_id: string;
    course_category_id: string;
    semestre_id: string; // Ajouté
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
    semestres: Semestre[]; // Ajouté
}

const CourseSelector = ({
    allCourses,
    availableCourses,
    value,
    onChange,
    error,
}: {
    allCourses: Course[];
    availableCourses: Course[];
    value: string;
    onChange: (value: string) => void;
    error?: string | null;
}) => {
    const [open, setOpen] = useState(false);

    const currentCourse = allCourses.find((c) => c.id.toString() === value);
    const displayCourses = useMemo(() => {
        if (!currentCourse) return availableCourses;
        if (availableCourses.some((c) => c.id === currentCourse.id)) return availableCourses;
        return [currentCourse, ...availableCourses];
    }, [availableCourses, currentCourse]);

    return (
        <div className="flex flex-col gap-1 w-full">
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn('w-full max-w-full justify-between font-normal min-w-0', !value && 'text-muted-foreground')}
                onClick={() => setOpen(true)}
                type="button"
            >
                <span className="truncate">
                    {value ? currentCourse?.name : (availableCourses.length ? 'Sélectionnez un cours' : 'Aucun cours disponible')}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <DialogTitle className="sr-only">Rechercher un cours</DialogTitle>
                <CommandInput placeholder="Rechercher un cours..." />
                <CommandList>
                    <CommandEmpty>Aucun cours trouvé.</CommandEmpty>
                    <CommandGroup>
                        {displayCourses.map((course) => (
                            <CommandItem
                                key={course.id}
                                value={course.name}
                                onSelect={() => {
                                    onChange(course.id.toString());
                                    setOpen(false);
                                }}
                            >
                                <Check className={cn('mr-2 h-4 w-4 shrink-0', value === course.id.toString() ? 'opacity-100' : 'opacity-0')} />
                                <span className="truncate">{course.name}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default function ProgramDetailsForm({ 
    program, 
    courses, 
    promotions, 
    units, 
    categories, 
    semestres, // Ajouté
    flash 
}: ProgramDetailsPageProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [courseDetails, setCourseDetails] = useState<CourseDetail[]>(
        program.course_details?.length
            ? program.course_details.map((detail) => ({
                  ...detail,
                  semestre_id: detail.semestre_id || '', // Ajouté
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
                      semestre_id: semestres.length > 0 ? semestres[0].id.toString() : '', // Ajouté
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

    // Calculer les cours disponibles (non utilisés)
    const availableCourses = useMemo(() => {
        const usedCourseIds = new Set(
            courseDetails.map(detail => detail.course_id)
        );
        
        return courses.filter(
            course => !usedCourseIds.has(course.id.toString())
        );
    }, [courses, courseDetails]);

    // Fonction de calcul des crédits
    const calculateCredits = (cm: string | number, td: string | number, tp: string | number): string => {
        const safeConvert = (value: string | number): number => {
            if (typeof value === 'number') return value;
            const trimmed = String(value).trim();
            if (trimmed === '') return 0;
            const normalized = trimmed.replace(',', '.');
            const num = parseFloat(normalized);
            return isNaN(num) ? 0 : num;
        };

        const cmValue = safeConvert(cm);
        const tdValue = safeConvert(td);
        const tpValue = safeConvert(tp);
        const totalHours = cmValue + tdValue + tpValue;
        const creditsValue = totalHours / 15;
        return parseFloat(creditsValue.toFixed(2)).toString();
    };

    const validateFields = () => {
        const newErrors: Record<string, string> = {};

        courseDetails.forEach((detail, index) => {
            const requiredFields: Array<keyof CourseDetail> = [
                'course_id', 
                'promotion_id', 
                'units_teaching_id', 
                'course_category_id',
                'semestre_id' // Ajouté
            ];

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
        if (availableCourses.length === 0) {
            toast.warning('Tous les cours sont déjà ajoutés');
            return;
        }

        setCourseDetails([
            ...courseDetails,
            {
                course_id: availableCourses.length > 0 ? availableCourses[0].id.toString() : '',
                promotion_id: promotions.length > 0 ? promotions[0].id.toString() : '',
                units_teaching_id: units.length > 0 ? units[0].id.toString() : '',
                course_category_id: categories.length > 0 ? categories[0].id.toString() : '',
                semestre_id: semestres.length > 0 ? semestres[0].id.toString() : '', // Ajouté
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
        const updatedDetail = { ...newDetails[index], [field]: value };

        // Recalcul automatique si modification de CM/TD/TP
        if (field === 'cm' || field === 'td' || field === 'tp') {
            updatedDetail.credits = calculateCredits(
                updatedDetail.cm,
                updatedDetail.td,
                updatedDetail.tp
            );
        }

        newDetails[index] = updatedDetail;
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
                        if (errors.course_details) {
                            toast.error(errors.course_details);
                        } else {
                            toast.error('Erreur de validation');
                        }
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
                        if (errors.course_details) {
                            toast.error(errors.course_details);
                        } else {
                            toast.error('Erreur de validation');
                        }
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
                            <Button 
                                type="button" 
                                onClick={addCourseDetail} 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1"
                                disabled={availableCourses.length === 0}
                            >
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
                                    {/* Semestre */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`semestre_id_${index}`}>Semestre *</Label>
                                        <Select
                                            value={detail.semestre_id}
                                            onValueChange={(value) => updateCourseDetail(index, 'semestre_id', value)}
                                        >
                                            <SelectTrigger className="focus:ring-primary-500 w-full min-w-0 border-gray-300 focus:ring-2">
                                                <SelectValue placeholder="Sélectionnez un semestre" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {semestres.map((semestre) => (
                                                    <SelectItem key={semestre.id} value={semestre.id.toString()}>
                                                        {semestre.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldErrors[`${index}_semestre_id`] && (
                                            <p className="text-sm text-red-500">{fieldErrors[`${index}_semestre_id`]}</p>
                                        )}
                                    </div>

                                    {/* Cours */}
                                    <div className="col-span-1 space-y-2 lg:col-span-2">
                                        <Label htmlFor={`course_id_${index}`}>Cours *</Label>
                                        <CourseSelector
                                            allCourses={courses}
                                            availableCourses={availableCourses}
                                            value={detail.course_id}
                                            onChange={(value) => updateCourseDetail(index, 'course_id', value)}
                                            error={fieldErrors[`${index}_course_id`]}
                                        />
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
                                        <Label htmlFor={`cm_${index}`}>CMI (h)</Label>
                                        <Input
                                            type="text"
                                            value={detail.cm}
                                            onChange={(e) => {
                                                const value = e.target.value;
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

                                    {/* Crédits (lecture seule) */}
                                    <div className="space-y-2">
                                        <Label htmlFor={`credits_${index}`}>Crédits</Label>
                                        <Input
                                            type="text"
                                            value={detail.credits}
                                            readOnly
                                            className="w-full bg-gray-100 dark:bg-gray-800 cursor-default"
                                        />
                                        {fieldErrors[`${index}_credits`] && (
                                            <p className="text-sm text-red-500">{fieldErrors[`${index}_credits`]}</p>
                                        )}
                                    </div>

                                    {/* Boutons */}
                                    <div className="col-span-1 mt-2 flex justify-between lg:col-span-4">
                                        <div>
                                            {index === courseDetails.length - 1 && (
                                                <Button
                                                    type="button"
                                                    onClick={addCourseDetail}
                                                    variant="outline"
                                                    className="flex items-center gap-1"
                                                    disabled={availableCourses.length === 0}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Ajouter un autre cours
                                                </Button>
                                            )}
                                        </div>
                                        
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
