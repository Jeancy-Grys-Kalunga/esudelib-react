import { Head, useForm, usePage } from '@inertiajs/react';
import { BookOpen, Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  cm: number;
  td: number;
  tp: number;
  credits: number;
};

type Program = {
  id: number;
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

export default function ProgramDetailsForm({ 
  program, 
  courses, 
  promotions, 
  units, 
  categories, 
  flash 
}: ProgramDetailsPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseDetails, setCourseDetails] = useState<CourseDetail[]>(
    program.course_details?.length ? program.course_details : [{
      course_id: courses.length > 0 ? courses[0].id.toString() : '',
      promotion_id: promotions.length > 0 ? promotions[0].id.toString() : '',
      units_teaching_id: units.length > 0 ? units[0].id.toString() : '',
      course_category_id: categories.length > 0 ? categories[0].id.toString() : '',
      cm: 0,
      td: 0,
      tp: 0,
      credits: 0
    }]
  );

  const { post, put, errors } = useForm({
    course_details: courseDetails
  });

  const addCourseDetail = () => {
    setCourseDetails([
      ...courseDetails,
      {
        course_id: courses.length > 0 ? courses[0].id.toString() : '',
        promotion_id: promotions.length > 0 ? promotions[0].id.toString() : '',
        units_teaching_id: units.length > 0 ? units[0].id.toString() : '',
        course_category_id: categories.length > 0 ? categories[0].id.toString() : '',
        cm: 0,
        td: 0,
        tp: 0,
        credits: 0
      }
    ]);
  };

  const removeCourseDetail = (index: number) => {
    if (courseDetails.length > 1) {
      const newDetails = [...courseDetails];
      newDetails.splice(index, 1);
      setCourseDetails(newDetails);
    }
  };

  const updateCourseDetail = (
    index: number, 
    field: keyof CourseDetail, 
    value: string | number
  ) => {
    const newDetails = [...courseDetails];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setCourseDetails(newDetails);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (program.course_details && program.course_details.length > 0) {
      // Mise à jour
      put(route('programs.details.update', program.id), {
        onFinish: () => setIsSubmitting(false)
      });
    } else {
      // Création
      post(route('programs.details.store', program.id), {
        onFinish: () => setIsSubmitting(false)
      });
    }
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

  return (
    <AppLayout>
      <Head title={`Détails du programme - ${program.institution}`} />
      <div className="container mx-auto space-y-6 py-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {program.course_details?.length ? 'Modifier les détails' : 'Ajouter des détails'} du programme
            </h1>
            <p className="text-muted-foreground">Institution: {program.institution}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Cours du programme</h3>
              <Button 
                type="button" 
                onClick={addCourseDetail} 
                variant="outline" 
                size="sm"
              >
                <Plus className="mr-1 h-4 w-4" />
                Ajouter un cours
              </Button>
            </div>

            {courseDetails.map((detail, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor={`course_id_${index}`}>Cours *</Label>
                  <Select
                    value={detail.course_id}
                    onValueChange={(value) => updateCourseDetail(index, 'course_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un cours" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(errors as any)[`course_details.${index}.course_id`] && (
                    <p className="text-sm text-red-500">{(errors as any)[`course_details.${index}.course_id`]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`promotion_id_${index}`}>Promotion *</Label>
                  <Select
                    value={detail.promotion_id}
                    onValueChange={(value) => updateCourseDetail(index, 'promotion_id', value)}
                  >
                    <SelectTrigger>
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
                  {(errors as any)[`course_details.${index}.promotion_id`] && (
                    <p className="text-sm text-red-500">{(errors as any)[`course_details.${index}.promotion_id`]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`units_teaching_id_${index}`}>Unité d'enseignement *</Label>
                  <Select
                    value={detail.units_teaching_id}
                    onValueChange={(value) => updateCourseDetail(index, 'units_teaching_id', value)}
                  >
                    <SelectTrigger>
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
                  {(errors as any)[`course_details.${index}.units_teaching_id`] && (
                    <p className="text-sm text-red-500">{(errors as any)[`course_details.${index}.units_teaching_id`]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`course_category_id_${index}`}>Catégorie *</Label>
                  <Select
                    value={detail.course_category_id}
                    onValueChange={(value) => updateCourseDetail(index, 'course_category_id', value)}
                  >
                    <SelectTrigger>
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
                  {(errors as any)[`course_details.${index}.course_category_id`] && (
                    <p className="text-sm text-red-500">{(errors as any)[`course_details.${index}.course_category_id`]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`cm_${index}`}>CM (h)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={detail.cm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                      updateCourseDetail(index, 'cm', parseInt(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`td_${index}`}>TD (h)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={detail.td}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                      updateCourseDetail(index, 'td', parseInt(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tp_${index}`}>TP (h)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={detail.tp}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                      updateCourseDetail(index, 'tp', parseInt(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-2 col-span-7">
                  <Label htmlFor={`credits_${index}`}>Crédits</Label>
                  <Input
                    type="number"
                    min="0"
                    value={detail.credits}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                      updateCourseDetail(index, 'credits', parseInt(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="col-span-7 flex justify-end">
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm"
                    onClick={() => removeCourseDetail(index)}
                    disabled={courseDetails.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="gap-2 min-w-[180px]"
            >
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