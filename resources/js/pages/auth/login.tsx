import { Head, useForm } from '@inertiajs/react';
import { CalendarDays, Eye, EyeOff, Loader2, Lock, Mail, University, Users } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
    institution_id?: string;
    is_jury: boolean;
    academic_year_id?: string;
    promotion_id?: string;
};

interface FlashMessage {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

interface PageProps {
    flash?: FlashMessage;
    status?: string;
    canResetPassword: boolean;
    institutions?: Array<{ id: string; name: string }>;
    academicYears?: Array<{ id: string; title: string }>;
    promotions?: Array<{ id: string; title: string }>;
}

export default function Login({ status, canResetPassword, institutions = [], flash, academicYears = [], promotions = [] }: PageProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
        institution_id: '',
        is_jury: false,
        academic_year_id: '',
        promotion_id: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showInstitutionField, setShowInstitutionField] = useState(true);
    const [isJury, setIsJury] = useState(false);

    useEffect(() => {
        if (flash) {
            switch (flash.type) {
                case 'success':
                    toast.success(flash.message);
                    break;
                case 'error':
                    toast.error(flash.message);
                    break;
                case 'warning':
                    toast.warning(flash.message);
                    break;
                case 'info':
                    toast.info(flash.message);
                    break;
                default:
                    toast(flash.message);
            }
        }
    }, [flash]);

    useEffect(() => {
        // Logique de masquage du champ institution pour les admins
        const shouldHideInstitution = data.email.includes('admin') || data.email.includes('super');
        setShowInstitutionField(!shouldHideInstitution);

        // Réinitialisation de l'institution si admin
        if (shouldHideInstitution) {
            setData('institution_id', '');
        }
    }, [data.email]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
            onError: (errors) => {
                if (Object.keys(errors).length === 0) {
                    toast.error('Une erreur est survenue lors de la connexion');
                }
            },
        });
    };

    return (
        <AuthLayout
            title="Connectez-vous à votre compte"
            description="Entrez vos identifiants pour accéder à votre espace personnel"
            backgroundImage="https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80"
        >
            <Head title="Connexion" />

            <div className="hover:shadow-3xl mx-auto w-full max-w-md transform overflow-hidden rounded-xl bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-800 p-6 text-center">
                    <h2 className="text-2xl font-bold text-white">Connexion</h2>
                </div>

                <div className="p-8">
                    <form className="space-y-6" onSubmit={submit}>
                        {status && <div className="animate-fade-in mb-4 text-center text-sm font-medium text-green-600">{status}</div>}

                        <div className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    Adresse e-mail
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="votre@email.com"
                                        className="pl-10"
                                    />
                                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-1">
                                    <Lock className="h-4 w-4" />
                                    Mot de passe
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Votre mot de passe"
                                        className="pl-10"
                                    />
                                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                    <button
                                        type="button"
                                        className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Institution Field - Conditionnellement affiché */}
                            {institutions && institutions.length > 0 && showInstitutionField && !isJury && (
                                <div className="animate-fade-in space-y-2">
                                    <Label htmlFor="institution_id" className="flex items-center gap-1">
                                        <University className="h-4 w-4" />
                                        Institution
                                    </Label>
                                    <div className="relative">
                                        <select
                                            id="institution_id"
                                            name="institution_id"
                                            value={data.institution_id}
                                            onChange={(e) => setData('institution_id', e.target.value)}
                                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 pl-10 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            required={showInstitutionField && !isJury}
                                        >
                                            <option value="">Sélectionnez une institution</option>
                                            {institutions.map((institution) => (
                                                <option key={institution.id} value={institution.id}>
                                                    {institution.name}
                                                </option>
                                            ))}
                                        </select>
                                        <University className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                    </div>
                                    <InputError message={errors.institution_id} />
                                </div>
                            )}

                            {/* Jury Checkbox */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_jury"
                                    name="is_jury"
                                    checked={data.is_jury}
                                    onClick={() => {
                                        const newIsJury = !data.is_jury;
                                        setData('is_jury', newIsJury);
                                        setIsJury(newIsJury);
                                        if (!newIsJury) {
                                            setData('academic_year_id', '');
                                            setData('promotion_id', '');
                                        }
                                    }}
                                />
                                <Label htmlFor="is_jury">Se connecter en tant que jury</Label>
                            </div>

                            {isJury && (
                                <>
                                    {/* Academic Year Field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="academic_year_id" className="flex items-center gap-1">
                                            <CalendarDays className="h-4 w-4" />
                                            Année académique
                                        </Label>
                                        <div className="relative">
                                            <select
                                                id="academic_year_id"
                                                name="academic_year_id"
                                                value={data.academic_year_id}
                                                onChange={(e) => setData('academic_year_id', e.target.value)}
                                                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 pl-10 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                required
                                            >
                                                <option value="">Sélectionnez une année académique</option>
                                                {academicYears.map((year) => (
                                                    <option key={year.id} value={year.id}>
                                                        {year.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <CalendarDays className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                        </div>
                                        <InputError message={errors.academic_year_id} />
                                    </div>

                                    {/* Promotion Field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="promotion_id" className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            Promotion
                                        </Label>
                                        <div className="relative">
                                            <select
                                                id="promotion_id"
                                                name="promotion_id"
                                                value={data.promotion_id}
                                                onChange={(e) => setData('promotion_id', e.target.value)}
                                                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 pl-10 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                required
                                            >
                                                <option value="">Sélectionnez une promotion</option>
                                                {promotions.map((promotion) => (
                                                    <option key={promotion.id} value={promotion.id}>
                                                        {promotion.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <Users className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                        </div>
                                        <InputError message={errors.promotion_id} />
                                    </div>
                                </>
                            )}

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onClick={() => setData('remember', !data.remember)}
                                        tabIndex={3}
                                    />
                                    <Label htmlFor="remember">Se souvenir de moi</Label>
                                </div>

                                {canResetPassword && (
                                    <TextLink href={route('password.request')} className="text-sm" tabIndex={5}>
                                        Mot de passe oublié ?
                                    </TextLink>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full transform bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg transition-transform hover:scale-[1.01] hover:from-blue-700 hover:to-indigo-800"
                                tabIndex={4}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connexion en cours...
                                    </>
                                ) : (
                                    'Se connecter'
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="text-muted-foreground mt-6 text-center text-sm">
                        Vous n'avez pas de compte ?{' '}
                        <TextLink href={route('register')} tabIndex={6}>
                            Créer un compte
                        </TextLink>
                    </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 text-center text-xs text-gray-500">
                    Développé avec ❤️ par{' '}
                    <a
                        href="https://www.linkedin.com/in/jeancy-grys-kalunga"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-600"
                    >
                        Jeancy Grys Kalunga
                    </a>
                </div>
            </div>
        </AuthLayout>
    );
}
