import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Loader2, Mail, Lock, University } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
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
}

export default function Login({ status, canResetPassword, institutions = [], flash }: PageProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
        institution_id: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showInstitutionField, setShowInstitutionField] = useState(true);

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
        // Vérifie si l'email contient "admin" ou "super"
        const shouldHideInstitution = data.email.includes('admin') || data.email.includes('super');
        setShowInstitutionField(!shouldHideInstitution);
        
        // Si l'email contient admin ou super, on réinitialise institution_id
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
           
            <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden transition-all duration-300 transform hover:shadow-3xl">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-800 p-6 text-center">
                    <h2 className="text-2xl font-bold text-white">Connexion</h2>
                </div>

                <div className="p-8">
                    <form className="space-y-6" onSubmit={submit}>
                        {status && (
                            <div className="mb-4 text-center text-sm font-medium text-green-600 animate-fade-in">
                                {status}
                            </div>
                        )}

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
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                                        type={showPassword ? "text" : "password"}
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Votre mot de passe"
                                        className="pl-10"
                                    />
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Institution Field - Conditionnellement affiché */}
                            {institutions && institutions.length > 0 && showInstitutionField && (
                                <div className="space-y-2 animate-fade-in">
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
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                            required={showInstitutionField}
                                        >
                                            <option value="">Sélectionnez une institution</option>
                                            {institutions.map((institution) => (
                                                <option key={institution.id} value={institution.id}>
                                                    {institution.name}
                                                </option>
                                            ))}
                                        </select>
                                        <University className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>
                                    <InputError message={errors.institution_id} />
                                </div>
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
                                    <TextLink
                                        href={route('password.request')}
                                        className="text-sm"
                                        tabIndex={5}
                                    >
                                        Mot de passe oublié ?
                                    </TextLink>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg transform hover:scale-[1.01] transition-transform"
                                tabIndex={4}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Connexion en cours...
                                    </>
                                ) : (
                                    "Se connecter"
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Vous n'avez pas de compte ?{' '}
                        <TextLink href={route('register')} tabIndex={6}>
                            Créer un compte
                        </TextLink>
                    </div>
                </div>

                <div className="px-8 py-4 bg-gray-50 text-center text-xs text-gray-500">
                    Développé avec ❤️ par{" "}
                    <a
                        href="https://www.linkedin.com/in/jeancy-grys-kalunga"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 underline"
                    >
                        Jeancy Grys Kalunga
                    </a>
                </div>
            </div>
        </AuthLayout>
    );
}