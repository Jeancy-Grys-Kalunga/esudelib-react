import React, { useEffect, useState } from 'react';
import { Head, Link, usePage }  from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import GuestLayout from '../layouts/GuestLayout';



interface Errors {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
}

interface HomePageProps {
    [key: string]: unknown;
    auth: {
        user: {
            name: string;
            email: string;
        } | null;
    };
    errors: Errors;
    canLogin: boolean;
    canRegister: boolean;
}

type NextPageWithLayout = React.FC & {
    layout?: (page: React.ReactNode) => React.ReactNode;
};

const Home: NextPageWithLayout = () => {
    const { auth, errors } = usePage<HomePageProps>().props;
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        Inertia.post(route('register.submit'), {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            password_confirmation: formData.get('password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Accueil - Esudelib" />
            
            {/* Hero Section - Enhanced with glassmorphism and modern gradients */}
            <section className="relative min-h-screen flex items-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white overflow-hidden animate-gradient">
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent animate-shimmer"></div>
                    <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
                    
                    {/* Floating orbs with parallax effect */}
                    <div 
                        className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animate-glow-pulse"
                        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
                    ></div>
                    <div 
                        className="absolute top-40 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
                        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
                    ></div>
                    <div 
                        className="absolute -bottom-20 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 animate-glow-pulse"
                        style={{ transform: `translateY(${scrollY * 0.4}px)` }}
                    ></div>
                    
                    {/* Floating particles */}
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-float animation-delay-500 opacity-60"></div>
                    <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-yellow-300 rounded-full animate-float animation-delay-1000 opacity-40"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-purple-300 rounded-full animate-float animation-delay-200 opacity-50"></div>
                </div>
                
                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 animate-fade-in-down hover-glow glass-effect">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-scale-pulse"></span>
                            </span>
                            <span className="text-sm font-medium">Plateforme de nouvelle génération</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight animate-fade-in-up">
                            Gestion de Délibération
                            <span className="block mt-2 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent animate-shimmer">
                                Réinventée
                            </span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl mb-10 text-gray-200 max-w-3xl mx-auto leading-relaxed animate-fade-in">
                            Une expérience moderne et intuitive pour simplifier vos processus de délibération. 
                            Gagnez du temps, réduisez les erreurs et offrez une transparence totale.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-300">
                            {auth.user ? (
                                <Link 
                                    href={route('dashboard')} 
                                    className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 font-bold rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/50 hover:scale-105 overflow-hidden hover-lift animate-glow-pulse"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Tableau de bord
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                        </svg>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer"></div>
                                </Link>
                            ) : (
                                <>
                                    <Link 
                                        href={route('register')} 
                                        className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 font-bold rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/50 hover:scale-105 overflow-hidden hover-lift animate-glow-pulse"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            Commencez gratuitement
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                            </svg>
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer"></div>
                                    </Link>
                                    <Link 
                                        href={route('login')} 
                                        className="group px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-bold rounded-xl transition-all duration-300 hover:bg-white/20 hover:border-white/50 hover:scale-105 glass-effect hover-glow"
                                    >
                                        <span className="flex items-center gap-2">
                                            Se connecter
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                                            </svg>
                                        </span>
                                    </Link>
                                </>
                            )}
                        </div>
                        
                        {/* Trust indicators */}
                        <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                                <span>Sécurisé et confidentiel</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                                <span>Support 24/7</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                                <span>Mises à jour régulières</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                    </svg>
                </div>
            </section>

            {/* Features Section - Enhanced with modern cards */}
            <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-rotate"></div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-20 animate-fade-in-up">
                        <span className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm mb-4 hover-lift transition-smooth">
                            Fonctionnalités
                        </span>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 animate-slide-in-left">
                            Tout ce dont vous avez besoin
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Une suite complète d'outils conçus pour transformer votre processus de délibération
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={
                                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                            }
                            title="Gestion centralisée"
                            description="Toutes vos données de délibération en un seul endroit sécurisé. Accès instantané, synchronisation en temps réel."
                            iconBg="bg-gradient-to-br from-blue-50 to-blue-100"
                            accentColor="blue"
                        />
                        
                        <FeatureCard 
                            icon={
                                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                                </svg>
                            }
                            title="Rapports automatisés"
                            description="Génération instantanée de procès-verbaux et relevés de notes avec un design professionnel."
                            iconBg="bg-gradient-to-br from-emerald-50 to-emerald-100"
                            accentColor="emerald"
                        />
                        
                        <FeatureCard 
                            icon={
                                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                </svg>
                            }
                            title="Sécurité renforcée"
                            description="Protocoles de sécurité avancés et chiffrement de bout en bout pour protéger vos données sensibles."
                            iconBg="bg-gradient-to-br from-purple-50 to-purple-100"
                            accentColor="purple"
                        />
                        
                        <FeatureCard 
                            icon={
                                <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                            }
                            title="Performance optimale"
                            description="Interface ultra-rapide et réactive. Traitez des milliers de dossiers en quelques secondes."
                            iconBg="bg-gradient-to-br from-amber-50 to-amber-100"
                            accentColor="amber"
                        />
                        
                        <FeatureCard 
                            icon={
                                <svg className="w-10 h-10 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                            }
                            title="Collaboration fluide"
                            description="Travaillez en équipe avec des outils de collaboration en temps réel et des permissions granulaires."
                            iconBg="bg-gradient-to-br from-rose-50 to-rose-100"
                            accentColor="rose"
                        />
                        
                        <FeatureCard 
                            icon={
                                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            }
                            title="Analytics avancés"
                            description="Tableaux de bord interactifs et statistiques détaillées pour suivre vos performances."
                            iconBg="bg-gradient-to-br from-indigo-50 to-indigo-100"
                            accentColor="indigo"
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section - Enhanced with animations */}
            <section className="py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
                </div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Des chiffres qui parlent d'eux-mêmes
                        </h2>
                        <p className="text-xl text-white/80">
                            La confiance de milliers d'utilisateurs à travers le pays
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatItem value="30,000+" label="Étudiants actifs" />
                        <StatItem value="11,000+" label="Diplômes délivrés" />
                        <StatItem value="39+" label="Enseignants" />
                        <StatItem value="5+" label="Années d'excellence" />
                    </div>
                </div>
            </section>

            {/* Registration Section - Enhanced with glassmorphism */}
            <section className="py-24 bg-gradient-to-b from-white to-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2">
                            <span className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm mb-6">
                                Commencez dès aujourd'hui
                            </span>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                                Prêt à transformer vos délibérations?
                            </h2>
                            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                                Rejoignez des milliers d'établissements qui ont déjà fait le choix de la modernité. 
                                Inscription gratuite, sans engagement.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                <FeatureList 
                                    title="Pour les enseignants"
                                    items={[
                                        "Saisie simplifiée des notes",
                                        "Calculs automatiques",
                                        "Tableaux de bord personnalisés",
                                        "Export en un clic"
                                    ]}
                                />
                                
                                <FeatureList 
                                    title="Pour les étudiants"
                                    items={[
                                        "Accès instantané aux résultats",
                                        "Historique complet",
                                        "Notifications en temps réel",
                                        "Interface mobile"
                                    ]}
                                />
                            </div>
                            
                            {/* Trust badges */}
                            <div className="flex flex-wrap gap-6 items-center">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="font-medium">Sans carte bancaire</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="font-medium">Configuration en 5 min</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="lg:w-1/2 w-full">
                            <div className="relative">
                                {/* Decorative gradient */}
                                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-2xl opacity-20"></div>
                                
                                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                                    <div className="p-8 md:p-10">
                                        <h3 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                            Inscrivez-vous gratuitement
                                        </h3>
                                        <p className="text-center text-gray-600 mb-8">Créez votre compte en moins d'une minute</p>
                                        
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <FormInput 
                                                id="name"
                                                name="name"
                                                type="text"
                                                label="Nom complet"
                                                error={errors.name}
                                                required
                                            />
                                            
                                            <FormInput 
                                                id="email"
                                                name="email"
                                                type="email"
                                                label="Adresse email"
                                                error={errors.email}
                                                required
                                            />
                                            
                                            <FormInput 
                                                id="password"
                                                name="password"
                                                type="password"
                                                label="Mot de passe"
                                                error={errors.password}
                                                required
                                            />
                                            
                                            <FormInput 
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                type="password"
                                                label="Confirmez le mot de passe"
                                                error={errors.password_confirmation}
                                                required
                                            />
                                            
                                            <button 
                                                type="submit" 
                                                className="group w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/50 hover:scale-[1.02] flex items-center justify-center gap-2"
                                            >
                                                <span>Créer mon compte</span>
                                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                                </svg>
                                            </button>
                                            
                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-gray-200"></div>
                                                </div>
                                                <div className="relative flex justify-center text-sm">
                                                    <span className="px-4 bg-white text-gray-500">ou</span>
                                                </div>
                                            </div>
                                            
                                            <div className="text-center">
                                                <p className="text-gray-600">
                                                    Vous avez déjà un compte?{' '}
                                                    <Link href={route('login')} className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors">
                                                        Connectez-vous
                                                    </Link>
                                                </p>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* News Section - Enhanced with modern cards */}
            <section className="py-24 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <span className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm mb-4">
                            Blog & Actualités
                        </span>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                            Restez informé
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Découvrez les dernières nouveautés, conseils et mises à jour de notre plateforme
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <NewsCard 
                            image="/images/news/education-1.jpg"
                            date="2 Décembre 2023"
                            author="Admin"
                            title="Nouveautés de la plateforme"
                            description="Découvrez les dernières fonctionnalités ajoutées à notre plateforme de gestion de délibération."
                            color="blue"
                        />
                        
                        <NewsCard 
                            image="/images/news/education-2.jpg"
                            date="15 Novembre 2023"
                            author="Admin"
                            title="Formation des enseignants"
                            description="Programme de formation pour aider les enseignants à maîtriser notre plateforme."
                            color="emerald"
                        />
                        
                        <NewsCard 
                            image="/images/news/education-3.jpg"
                            date="28 Octobre 2023"
                            author="Admin"
                            title="Amélioration de la sécurité"
                            description="Nous avons renforcé les mesures de sécurité pour protéger vos données."
                            color="purple"
                        />
                    </div>
                    
                    <div className="text-center">
                        <Link 
                            href="#" 
                            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105"
                        >
                            <span>Voir toutes les actualités</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
};

// Component for Feature Card - Enhanced with modern design
interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    iconBg?: string;
    accentColor?: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'indigo';
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, iconBg = 'bg-gradient-to-br from-blue-50 to-blue-100', accentColor = 'blue' }) => {
    const accentColors = {
        blue: 'group-hover:shadow-blue-500/20',
        emerald: 'group-hover:shadow-emerald-500/20',
        purple: 'group-hover:shadow-purple-500/20',
        amber: 'group-hover:shadow-amber-500/20',
        rose: 'group-hover:shadow-rose-500/20',
        indigo: 'group-hover:shadow-indigo-500/20',
    };

    return (
        <div className={`group relative bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl ${accentColors[accentColor]} transition-all duration-500 hover:-translate-y-2 border border-gray-100 overflow-hidden`}>
            {/* Decorative gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
                <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-gray-800 transition-colors">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{description}</p>
            </div>
            
            {/* Animated border */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ color: `var(--color-${accentColor}-500)` }}></div>
        </div>
    );
};

// Component for Stat Item - Enhanced with animations
interface StatItemProps {
    value: string;
    label: string;
}

const StatItem: React.FC<StatItemProps> = ({ value, label }) => {
    return (
        <div className="group p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <div className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-br from-white to-white/80 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                {value}
            </div>
            <div className="text-lg text-white/90 font-medium">{label}</div>
        </div>
    );
};

// Component for Feature List - Enhanced with modern design
interface FeatureListProps {
    title: string;
    items: string[];
}

const FeatureList: React.FC<FeatureListProps> = ({ title, items }) => {
    return (
        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-bold mb-4 text-gray-900">{title}</h3>
            <ul className="space-y-3">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start group">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-emerald-200 transition-colors">
                            <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// Component for Form Input - Enhanced with modern styling
interface FormInputProps {
    id: string;
    name: string;
    type: string;
    label: string;
    error?: string;
    required?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({ id, name, type, label, error, required = false }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            <input 
                type={type} 
                id={id} 
                name={name} 
                className={`w-full px-4 py-3 border ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'} rounded-xl focus:ring-2 focus:outline-none transition-all duration-300 bg-gray-50 hover:bg-white`}
                required={required}
            />
            {error && <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                {error}
            </p>}
        </div>
    );
};

// Component for News Card - Enhanced with modern design
interface NewsCardProps {
    image: string;
    date: string;
    author: string;
    title: string;
    description: string;
    color?: 'blue' | 'emerald' | 'purple';
}

const NewsCard: React.FC<NewsCardProps> = ({ image, date, author, title, description, color = 'blue' }) => {
    const colorClasses = {
        blue: {
            bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
            badge: 'bg-blue-100 text-blue-700',
            link: 'text-blue-600 hover:text-blue-700'
        },
        emerald: {
            bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            badge: 'bg-emerald-100 text-emerald-700',
            link: 'text-emerald-600 hover:text-emerald-700'
        },
        purple: {
            bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
            badge: 'bg-purple-100 text-purple-700',
            link: 'text-purple-600 hover:text-purple-700'
        },
    };

    return (
        <div className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
            <div className={`relative h-56 ${colorClasses[color].bg} overflow-hidden`}>
                <img 
                    src={image} 
                    alt={title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Category badge */}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full ${colorClasses[color].badge} text-xs font-semibold backdrop-blur-sm`}>
                    Actualité
                </div>
            </div>
            
            <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span>{author}</span>
                    </div>
                </div>
                
                <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2">{title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">{description}</p>
                
                <Link 
                    href="#" 
                    className={`inline-flex items-center gap-2 ${colorClasses[color].link} font-semibold transition-all duration-300 group/link`}
                >
                    <span>Lire la suite</span>
                    <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                    </svg>
                </Link>
            </div>
        </div>
    );
};

Home.layout = (page: React.ReactNode) => <GuestLayout children={page} />;

export default Home;