import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Eye, EyeOff, Loader2, Lock, Mail, University, Users } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const GraduationCapIcon = ({ className = 'w-6 h-6' }) => (
    <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
);

const SparklesIcon = ({ className = 'w-6 h-6' }) => (
    <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" />
        <path d="M19 17v4" />
        <path d="M3 5h4" />
        <path d="M17 19h4" />
    </svg>
);

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
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth - 0.5) * 40,
                y: (e.clientY / window.innerHeight - 0.5) * 40,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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
        <div className={`flex min-h-screen bg-white transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <Head title="Connexion - E-CURSUS LMD" />

            {/* Left panel - Branding (Hidden on mobile) */}
            <div className="relative hidden w-full flex-col justify-between overflow-hidden lg:flex lg:w-1/2 xl:w-[55%]">
                {/* Dynamic Mesh Gradient Background */}
                <div className="absolute inset-0 bg-[#0a0f2c]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0a0f2c] to-[#0a0f2c]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-900/60 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30 [mask-image:linear-gradient(to_bottom_right,white,transparent)]"></div>
                </div>

                {/* Animated Glow Orbs */}
                <div
                    className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/20 mix-blend-screen blur-[100px] transition-transform duration-1000 ease-out"
                    style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
                />
                <div
                    className="absolute top-[40%] -right-[20%] h-[500px] w-[500px] animate-pulse rounded-full bg-indigo-500/20 mix-blend-screen blur-[100px] transition-transform duration-1000 ease-out"
                    style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
                />

                {/* Flowing Elements */}
                <div className="absolute bottom-[20%] left-[10%] h-96 w-96 animate-[spin_40s_linear_infinite_reverse] rounded-full border border-white/5 opacity-30 shadow-[0_0_100px_rgba(59,130,246,0.1)] backdrop-blur-3xl"></div>

                {/* Floating Decorative Card */}
                <div className="absolute top-1/4 right-1/4 flex h-24 w-24 rotate-12 animate-[bounce_8s_infinite] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 opacity-60 shadow-2xl shadow-blue-900/50 backdrop-blur-md">
                    <SparklesIcon className="h-10 w-10 text-blue-300" />
                </div>

                <div className="relative z-10 flex h-full flex-col p-12 lg:p-16">
                    {/* Header */}
                    <div className="flex w-fit items-center gap-4 transition-transform duration-300 hover:scale-[1.02]">
                        <Link href={route('home')} className="group flex items-center gap-4">
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-b from-white/20 to-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition-colors group-hover:bg-white/20">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-400/20 to-transparent opacity-50"></div>
                                <GraduationCapIcon className="relative z-10 h-8 w-8 text-white drop-shadow-md" />
                            </div>
                            <span className="bg-clip-text text-3xl font-black tracking-tight text-white drop-shadow-sm transition-colors group-hover:text-blue-100">
                                E-CURSUS LMD
                            </span>
                        </Link>
                    </div>

                    {/* Main Content */}
                    <div className="flex max-w-xl flex-grow flex-col justify-center space-y-8">
                        <div className="group inline-flex w-fit items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-2 shadow-[0_0_20px_rgba(59,130,246,0.15)] backdrop-blur-md transition-colors hover:bg-blue-500/20">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                            </span>
                            <span className="ml-3 text-sm font-semibold tracking-wider text-blue-100 uppercase">Espace Privé</span>
                        </div>

                        <h1 className="text-5xl leading-[1.15] font-black text-white">
                            Content de vous
                            <br />
                            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                                revoir par ici.
                            </span>
                        </h1>
                        <p className="text-xl leading-relaxed font-medium text-blue-100/80 drop-shadow-sm">
                            Identifiez-vous pour retrouver votre espace de travail et reprendre vos activités, en toute sécurité.
                        </p>
                    </div>

                    {/* Footer Left */}
                    <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-8">
                        <div className="flex items-center gap-3 opacity-60 transition-opacity hover:opacity-100">
                            <div className="h-px w-8 bg-blue-300/50"></div>
                            <p className="text-xs font-bold tracking-widest text-blue-100 uppercase">Ministère de l'ESU</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right panel - Dynamic Formal Login */}
            <div className="relative flex w-full flex-col items-center justify-center overflow-y-auto bg-[#FAFAFA] p-6 sm:p-12 lg:w-1/2 lg:p-20 xl:w-[45%]">
                {/* Subtle Background Pattern */}
                <div className="pointer-events-none absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>

                {/* Back button */}
                <Link
                    href={route('home')}
                    className="absolute top-8 right-8 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:scale-105 hover:bg-slate-50 hover:text-slate-900"
                    title="Retour à l'accueil"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>

                <div className="relative z-10 w-full max-w-[420px]">
                    {/* Mobile Logo */}
                    <div className="mb-12 flex items-center justify-center gap-4 lg:hidden">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0a0f2c] text-white shadow-2xl shadow-blue-900/20">
                            <GraduationCapIcon className="h-8 w-8" />
                        </div>
                        <span className="text-3xl font-black tracking-tight text-slate-900">E-CURSUS</span>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-black tracking-tight text-slate-900">Connexion</h2>
                        <p className="mt-3 font-medium text-slate-500">Saisissez vos identifiants pour continuer.</p>
                    </div>

                    {status && (
                        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50 p-4 text-sm font-bold text-emerald-600 shadow-sm">
                            <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                            {status}
                        </div>
                    )}

                    <div className="group relative">
                        {/* Interactive Form Card Wrapper */}
                        <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100 focus-within:opacity-100"></div>
                        <div className="relative rounded-[1.5rem] bg-white p-8 shadow-2xl ring-1 shadow-slate-200/50 ring-slate-100/80 backdrop-blur-xl">
                            <form className="space-y-6" onSubmit={submit}>
                                {/* Email Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-bold text-slate-700">
                                        Adresse e-mail
                                    </Label>
                                    <div className="group/input relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 transition-colors group-focus-within/input:text-blue-600">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="nom.prenom@univ.cd"
                                            className="h-12 w-full rounded-xl border-slate-200 bg-slate-50/50 pl-11 font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                {/* Password Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-bold text-slate-700">
                                        Mot de passe
                                    </Label>
                                    <div className="group/input relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 transition-colors group-focus-within/input:text-blue-600">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="••••••••"
                                            className="h-12 w-full rounded-xl border-slate-200 bg-slate-50/50 pr-11 pl-11 font-mono font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                {/* Conditional Institution Field */}
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${institutions && institutions.length > 0 && showInstitutionField && !isJury ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="space-y-2 pb-1">
                                        <Label htmlFor="institution_id" className="text-sm font-bold text-slate-700">
                                            Institution
                                        </Label>
                                        <div className="group/input relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 transition-colors group-focus-within/input:text-blue-600">
                                                <University className="h-5 w-5" />
                                            </div>
                                            <select
                                                id="institution_id"
                                                name="institution_id"
                                                value={data.institution_id}
                                                onChange={(e) => setData('institution_id', e.target.value)}
                                                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 pr-8 pl-11 text-sm font-medium text-slate-900 transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                required={showInstitutionField && !isJury}
                                            >
                                                <option value="" disabled className="text-slate-400">
                                                    Sélectionnez une institution
                                                </option>
                                                {institutions.map((institution) => (
                                                    <option key={institution.id} value={institution.id}>
                                                        {institution.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <InputError message={errors.institution_id} />
                                    </div>
                                </div>

                                {/* Jury Checkbox Option */}
                                <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 transition-colors hover:border-slate-300">
                                    <div className="flex items-center space-x-3">
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
                                            className="h-5 w-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                                        />
                                        <Label htmlFor="is_jury" className="cursor-pointer font-bold text-slate-700 select-none">
                                            Se connecter en tant que jury
                                        </Label>
                                    </div>
                                </div>

                                {/* Conditional Jury Fields */}
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isJury ? 'max-h-60 space-y-5 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    {/* Academic Year */}
                                    <div className="space-y-2 pt-2">
                                        <Label htmlFor="academic_year_id" className="text-sm font-bold text-slate-700">
                                            Année académique
                                        </Label>
                                        <div className="group/input relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 transition-colors group-focus-within/input:text-blue-600">
                                                <CalendarDays className="h-5 w-5" />
                                            </div>
                                            <select
                                                id="academic_year_id"
                                                name="academic_year_id"
                                                value={data.academic_year_id}
                                                onChange={(e) => setData('academic_year_id', e.target.value)}
                                                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 pr-8 pl-11 text-sm font-medium text-slate-900 transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                required={isJury}
                                            >
                                                <option value="" disabled>
                                                    Sélectionnez une année
                                                </option>
                                                {academicYears.map((year) => (
                                                    <option key={year.id} value={year.id}>
                                                        {year.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <InputError message={errors.academic_year_id} />
                                    </div>

                                    {/* Promotion */}
                                    <div className="space-y-2">
                                        <Label htmlFor="promotion_id" className="text-sm font-bold text-slate-700">
                                            Promotion
                                        </Label>
                                        <div className="group/input relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 transition-colors group-focus-within/input:text-blue-600">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <select
                                                id="promotion_id"
                                                name="promotion_id"
                                                value={data.promotion_id}
                                                onChange={(e) => setData('promotion_id', e.target.value)}
                                                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 pr-8 pl-11 text-sm font-medium text-slate-900 transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                required={isJury}
                                            >
                                                <option value="" disabled>
                                                    Sélectionnez une promotion
                                                </option>
                                                {promotions.map((promotion) => (
                                                    <option key={promotion.id} value={promotion.id}>
                                                        {promotion.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <InputError message={errors.promotion_id} />
                                    </div>
                                </div>

                                {/* Options & Reset Password */}
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            checked={data.remember}
                                            onClick={() => setData('remember', !data.remember)}
                                            tabIndex={3}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <Label htmlFor="remember" className="cursor-pointer text-sm font-medium text-slate-600 select-none">
                                            Me garder connecté
                                        </Label>
                                    </div>

                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-sm font-bold text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                                            tabIndex={5}
                                        >
                                            Mot de passe oublié ?
                                        </Link>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="group/submit relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl border-none bg-slate-900 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-900/30 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0"
                                        tabIndex={4}
                                        disabled={processing}
                                    >
                                        <span className="relative z-10 flex items-center gap-2 text-base">
                                            {processing ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    Authentification...
                                                </>
                                            ) : (
                                                'Se connecter'
                                            )}
                                        </span>
                                        {!processing && (
                                            <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover/submit:opacity-100"></div>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-sm font-medium text-slate-500">
                        Vous n'avez pas de compte ? <br className="sm:hidden" />
                        <span className="text-slate-400">Veuillez contacter votre administration.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Ensure the page takes up the full layout and we drop the wrapper AuthLayout which limits width
Login.layout = (page: React.ReactNode) => <>{page}</>;
