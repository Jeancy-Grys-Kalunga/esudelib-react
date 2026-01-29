import { Head, Link, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import GuestLayout from '../layouts/GuestLayout';

interface HomePageProps {
    [key: string]: unknown;
    auth: {
        user: {
            name: string;
            email: string;
        } | null;
    };
    canLogin: boolean;
    canRegister: boolean;
}

type NextPageWithLayout = React.FC & {
    layout?: (page: React.ReactNode) => React.ReactNode;
};

const Home: NextPageWithLayout = () => {
    const { auth } = usePage<HomePageProps>().props;
    const [scrollY, setScrollY] = useState(0);
    const [heroImageLoaded, setHeroImageLoaded] = useState(false);
    const [ctaImageLoaded, setCtaImageLoaded] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Head title="Accueil - E-Cursus" />

            {/* Hero Section - Enhanced with glassmorphism and modern gradients */}
            <section className="animate-gradient relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-sky-700 text-white">
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div className="animate-shimmer absolute top-0 left-0 h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent"></div>
                    <div className="absolute right-0 bottom-0 h-full w-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-sky-500/20 via-transparent to-transparent"></div>

                    {/* Floating orbs with parallax effect */}
                    <div
                        className="animate-blob animate-glow-pulse absolute top-20 left-10 h-72 w-72 rounded-full bg-blue-400 opacity-20 mix-blend-multiply blur-3xl filter"
                        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
                    ></div>
                    <div
                        className="animate-blob animation-delay-2000 absolute top-40 right-20 h-96 w-96 rounded-full bg-sky-500 opacity-20 mix-blend-multiply blur-3xl filter"
                        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
                    ></div>
                    <div
                        className="animate-blob animation-delay-4000 animate-glow-pulse absolute -bottom-20 left-1/2 h-80 w-80 rounded-full bg-blue-600 opacity-20 mix-blend-multiply blur-3xl filter"
                        style={{ transform: `translateY(${scrollY * 0.4}px)` }}
                    ></div>

                    {/* Floating particles */}
                    <div className="animate-float animation-delay-500 absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-white opacity-60"></div>
                    <div className="animate-float animation-delay-1000 absolute top-1/3 right-1/3 h-3 w-3 rounded-full bg-sky-300 opacity-40"></div>
                    <div className="animate-float animation-delay-200 absolute bottom-1/4 left-1/3 h-2 w-2 rounded-full bg-blue-300 opacity-50"></div>
                </div>

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

                <div className="relative z-10 container mx-auto px-4">
                    <div className="mx-auto max-w-4xl text-center">
                        {/* Badge */}
                        <div className="animate-fade-in-down hover-glow glass-effect mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="animate-scale-pulse relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            <span className="text-sm font-medium">Plateforme de nouvelle génération</span>
                        </div>

                        <h1 className="animate-fade-in-up mb-6 text-5xl leading-tight font-extrabold md:text-7xl">
                            Suivi Cursus
                            <span className="animate-shimmer mt-2 block bg-gradient-to-r from-sky-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                                Réinventée
                            </span>
                        </h1>

                        <p className="animate-fade-in mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl">
                            Une expérience moderne et intuitive pour simplifier la délibération de masse, mobilité des étudiants vos processus de
                            délibération. Gagnez du temps, réduisez les erreurs et offrez une transparence totale.
                        </p>

                        <div className="animate-fade-in-up animation-delay-300 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="group hover-lift animate-glow-pulse relative overflow-hidden rounded-xl bg-white px-8 py-4 font-bold text-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/50"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Tableau de bord
                                        <svg
                                            className="h-5 w-5 transition-transform group-hover:translate-x-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                        </svg>
                                    </span>
                                    <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-blue-50 to-sky-50 opacity-0 transition-opacity group-hover:opacity-100"></div>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('register')}
                                        className="group hover-lift animate-glow-pulse relative overflow-hidden rounded-xl bg-white px-8 py-4 font-bold text-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/50"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            Commencez gratuitement
                                            <svg
                                                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                                ></path>
                                            </svg>
                                        </span>
                                        <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-blue-50 to-sky-50 opacity-0 transition-opacity group-hover:opacity-100"></div>
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="group glass-effect hover-glow rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/50 hover:bg-white/20"
                                    >
                                        <span className="flex items-center gap-2">
                                            Se connecter
                                            <svg
                                                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                                                ></path>
                                            </svg>
                                        </span>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Trust indicators */}
                        <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                                <span>Sécurisé et confidentiel</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                                <span>Support 24/7</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                                <span>Mises à jour régulières</span>
                            </div>
                        </div>
                    </div>

                    {/* Hero Illustration - Image locale */}
                    <div className="animate-fade-in animation-delay-500 mt-16 px-4">
                        <div className="relative mx-auto max-w-6xl">
                            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-400 to-sky-400 opacity-20 blur-3xl"></div>
                            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm">
                                <div className={`transition-opacity duration-500 ${heroImageLoaded ? 'opacity-100' : 'opacity-0'}`}>
                                    {/* Image locale depuis public/images/ */}
                                    <img
                                        src="/images/hero-dashboard.png"
                                        alt="Dashboard moderne Esudelib - Interface premium"
                                        className="h-auto w-full rounded-2xl shadow-2xl"
                                        loading="eager"
                                        onLoad={() => setHeroImageLoaded(true)}
                                        onError={(e) => {
                                            console.error('Erreur chargement hero image:', e);
                                            // Fallback si l'image locale n'existe pas
                                            (e.target as HTMLImageElement).src =
                                                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
                                        }}
                                    />
                                </div>
                                {!heroImageLoaded && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-64 w-64 animate-pulse rounded-2xl bg-gradient-to-r from-blue-400/20 to-sky-400/20"></div>
                                    </div>
                                )}
                                {/* Overlay gradient for better text readability */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-blue-900/30 via-transparent to-transparent"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 transform animate-bounce">
                    <svg className="h-6 w-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                    </svg>
                </div>
            </section>

            {/* Features Section - Enhanced with modern cards */}
            <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24">
                {/* Decorative elements */}
                <div className="animate-blob absolute top-0 left-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200 opacity-20 mix-blend-multiply blur-3xl filter"></div>
                <div className="animate-blob animation-delay-2000 absolute right-0 bottom-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-sky-200 opacity-20 mix-blend-multiply blur-3xl filter"></div>
                <div className="animate-rotate absolute top-1/2 left-1/2 h-96 w-96 rounded-full bg-blue-100 opacity-10 mix-blend-multiply blur-3xl filter"></div>

                <div className="relative z-10 container mx-auto px-4">
                    <div className="animate-fade-in-up mb-20 text-center">
                        <span className="hover-lift transition-smooth mb-4 inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                            Fonctionnalités
                        </span>
                        <h2 className="animate-slide-in-left mb-6 text-4xl font-extrabold text-gray-900 md:text-5xl">
                            Tout ce dont vous avez besoin
                        </h2>
                        <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600">
                            Une suite complète d'outils conçus pour transformer votre processus de délibération
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <FeatureCard
                            icon={
                                <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    ></path>
                                </svg>
                            }
                            title="Gestion centralisée"
                            description="Toutes vos données de délibération en un seul endroit sécurisé. Accès instantané, synchronisation en temps réel."
                            iconBg="bg-gradient-to-br from-blue-50 to-blue-100"
                            accentColor="blue"
                        />

                        <FeatureCard
                            icon={
                                <svg className="h-10 w-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                <svg className="h-10 w-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    ></path>
                                </svg>
                            }
                            title="Sécurité renforcée"
                            description="Protocoles de sécurité avancés et chiffrement de bout en bout pour protéger vos données sensibles."
                            iconBg="bg-gradient-to-br from-purple-50 to-purple-100"
                            accentColor="purple"
                        />

                        <FeatureCard
                            icon={
                                <svg className="h-10 w-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                <svg className="h-10 w-10 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                    ></path>
                                </svg>
                            }
                            title="Collaboration fluide"
                            description="Travaillez en équipe avec des outils de collaboration en temps réel et des permissions granulaires."
                            iconBg="bg-gradient-to-br from-rose-50 to-rose-100"
                            accentColor="rose"
                        />

                        <FeatureCard
                            icon={
                                <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    ></path>
                                </svg>
                            }
                            title="Analytics avancés"
                            description="Tableaux de bord interactifs et statistiques détaillées pour suivre vos performances."
                            iconBg="bg-gradient-to-br from-blue-50 to-blue-100"
                            accentColor="blue"
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section - Enhanced with animations */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-600 py-24 text-white">
                {/* Animated background */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
                </div>

                <div className="relative z-10 container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold md:text-4xl">Des chiffres qui parlent d'eux-mêmes</h2>
                        <p className="text-xl text-white/80">La confiance de milliers d'utilisateurs à travers le pays</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        <StatItem value="30,000+" label="Étudiants actifs" />
                        <StatItem value="11,000+" label="Diplômes délivrés" />
                        <StatItem value="39+" label="Enseignants" />
                        <StatItem value="5+" label="Années d'excellence" />
                    </div>
                </div>
            </section>

            {/* CTA Section - Modern and Attractive */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-600 py-32">
                {/* Animated background elements */}
                <div className="absolute inset-0">
                    <div className="animate-shimmer absolute top-0 left-0 h-full w-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-400/30 via-transparent to-transparent"></div>
                    <div className="absolute right-0 bottom-0 h-full w-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-sky-500/30 via-transparent to-transparent"></div>

                    {/* Floating orbs */}
                    <div className="animate-blob absolute top-20 left-10 h-64 w-64 rounded-full bg-blue-400 opacity-20 mix-blend-multiply blur-3xl filter"></div>
                    <div className="animate-blob animation-delay-2000 absolute right-10 bottom-20 h-80 w-80 rounded-full bg-sky-400 opacity-20 mix-blend-multiply blur-3xl filter"></div>
                    <div className="animate-blob animation-delay-4000 absolute top-1/2 left-1/2 h-72 w-72 rounded-full bg-blue-500 opacity-20 mix-blend-multiply blur-3xl filter"></div>
                </div>

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

                <div className="relative z-10 container mx-auto px-4">
                    <div className="mx-auto max-w-5xl">
                        {/* Content */}
                        <div className="mb-12 text-center">
                            {/* Badge */}
                            <div className="animate-fade-in-down mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 backdrop-blur-md">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                </span>
                                <span className="text-sm font-medium text-white">Rejoignez-nous dès aujourd'hui</span>
                            </div>

                            <h2 className="animate-fade-in-up mb-6 text-4xl leading-tight font-extrabold text-white md:text-6xl">
                                Prêt à transformer vos
                                <span className="mt-2 block bg-gradient-to-r from-sky-200 via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                                    délibérations ?
                                </span>
                            </h2>

                            <p className="animate-fade-in mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-white/90 md:text-2xl">
                                Rejoignez des milliers d'établissements qui ont déjà fait le choix de la modernité. Inscription gratuite, sans
                                engagement.
                            </p>

                            {/* CTA Buttons */}
                            <div className="animate-fade-in-up animation-delay-300 mb-16 flex flex-col items-center justify-center gap-6 sm:flex-row">
                                <Link
                                    href={route('register')}
                                    className="group hover-lift relative overflow-hidden rounded-xl bg-white px-10 py-5 font-bold text-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/30"
                                >
                                    <span className="relative z-10 flex items-center gap-2 text-lg">
                                        Créer un compte gratuit
                                        <svg
                                            className="h-5 w-5 transition-transform group-hover:translate-x-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                        </svg>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-50 to-amber-50 opacity-0 transition-opacity group-hover:opacity-100"></div>
                                </Link>

                                <Link
                                    href={route('login')}
                                    className="group glass-effect rounded-xl border-2 border-white/30 bg-white/10 px-10 py-5 font-bold text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/50 hover:bg-white/20"
                                >
                                    <span className="flex items-center gap-2 text-lg">
                                        Se connecter
                                        <svg
                                            className="h-5 w-5 transition-transform group-hover:translate-x-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                                            ></path>
                                        </svg>
                                    </span>
                                </Link>
                            </div>

                            {/* Features Grid */}
                            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/15">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/20">
                                        <svg className="h-6 w-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                    <h3 className="mb-2 font-bold text-white">Sans carte bancaire</h3>
                                    <p className="text-sm text-white/80">Inscription 100% gratuite</p>
                                </div>

                                <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/15">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-400/20">
                                        <svg className="h-6 w-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                        </svg>
                                    </div>
                                    <h3 className="mb-2 font-bold text-white">Configuration rapide</h3>
                                    <p className="text-sm text-white/80">Prêt en 5 minutes</p>
                                </div>

                                <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/15">
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-400/20">
                                        <svg className="h-6 w-6 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                                            ></path>
                                        </svg>
                                    </div>
                                    <h3 className="mb-2 font-bold text-white">Support 24/7</h3>
                                    <p className="text-sm text-white/80">Assistance continue</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Premium Image - Image locale corrigée */}
                        <div className="animate-fade-in animation-delay-600 mt-16 px-4">
                            <div className="relative mx-auto max-w-6xl">
                                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-sky-300 to-blue-300 opacity-20 blur-3xl"></div>
                                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm">
                                    <div className={`transition-opacity duration-500 ${ctaImageLoaded ? 'opacity-100' : 'opacity-0'}`}>
                                        {/* Image locale depuis public/images/ */}
                                        <img
                                            src="/images/cta-success.jpg"
                                            alt="Succès académique avec Esudelib - Étudiants diplômés"
                                            className="h-auto w-full rounded-2xl shadow-2xl"
                                            loading="lazy"
                                            onLoad={() => setCtaImageLoaded(true)}
                                            onError={(e) => {
                                                console.error('Erreur chargement CTA image:', e);
                                                // Fallback si l'image locale n'existe pas
                                                (e.target as HTMLImageElement).src =
                                                    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
                                            }}
                                        />
                                    </div>
                                    {!ctaImageLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-64 w-64 animate-pulse rounded-2xl bg-gradient-to-r from-blue-400/20 to-sky-400/20"></div>
                                        </div>
                                    )}
                                    {/* Overlay gradient for premium effect */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-blue-900/40 via-transparent to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* News Section - Enhanced with modern cards using online images */}
            <section className="bg-gray-50 py-24">
                <div className="container mx-auto px-4">
                    <div className="mb-20 text-center">
                        <span className="mb-4 inline-block rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                            Blog & Actualités
                        </span>
                        <h2 className="mb-6 text-4xl font-extrabold text-gray-900 md:text-5xl">Restez informé</h2>
                        <p className="mx-auto max-w-3xl text-xl text-gray-600">
                            Découvrez les dernières nouveautés, conseils et mises à jour de notre plateforme
                        </p>
                    </div>

                    <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                        <NewsCard
                            image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            date="2 Décembre 2023"
                            author="Admin"
                            title="Nouveautés de la plateforme"
                            description="Découvrez les dernières fonctionnalités ajoutées à notre plateforme de gestion de délibération."
                            color="blue"
                        />

                        <NewsCard
                            image="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            date="15 Novembre 2023"
                            author="Admin"
                            title="Formation des enseignants"
                            description="Programme de formation pour aider les enseignants à maîtriser notre plateforme."
                            color="blue"
                        />

                        <NewsCard
                            image="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            date="28 Octobre 2023"
                            author="Admin"
                            title="Amélioration de la sécurité"
                            description="Nous avons renforcé les mesures de sécurité pour protéger vos données."
                            color="blue"
                        />
                    </div>

                    <div className="text-center">
                        <Link
                            href="#"
                            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 px-8 py-4 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50"
                        >
                            <span>Voir toutes les actualités</span>
                            <svg
                                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
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

const FeatureCard: React.FC<FeatureCardProps> = ({
    icon,
    title,
    description,
    iconBg = 'bg-gradient-to-br from-blue-50 to-blue-100',
    accentColor = 'blue',
}) => {
    const accentColors = {
        blue: 'group-hover:shadow-blue-500/20',
        emerald: 'group-hover:shadow-emerald-500/20',
        purple: 'group-hover:shadow-purple-500/20',
        amber: 'group-hover:shadow-amber-500/20',
        rose: 'group-hover:shadow-rose-500/20',
        indigo: 'group-hover:shadow-indigo-500/20',
    };

    return (
        <div
            className={`group relative rounded-2xl bg-white p-8 shadow-md hover:shadow-2xl ${accentColors[accentColor]} overflow-hidden border border-gray-100 transition-all duration-500 hover:-translate-y-2`}
        >
            {/* Decorative gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

            <div className="relative z-10">
                <div
                    className={`h-16 w-16 ${iconBg} mb-6 flex transform items-center justify-center rounded-2xl shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}
                >
                    {icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 transition-colors group-hover:text-gray-800">{title}</h3>
                <p className="leading-relaxed text-gray-600">{description}</p>
            </div>

            {/* Animated border */}
            <div
                className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ color: `var(--color-${accentColor}-500)` }}
            ></div>
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
        <div className="group rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20">
            <div className="mb-2 bg-gradient-to-br from-white to-white/80 bg-clip-text text-4xl font-extrabold text-transparent transition-transform duration-300 group-hover:scale-110 md:text-5xl">
                {value}
            </div>
            <div className="text-lg font-medium text-white/90">{label}</div>
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
            link: 'text-blue-600 hover:text-blue-700',
        },
        emerald: {
            bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
            badge: 'bg-emerald-100 text-emerald-700',
            link: 'text-emerald-600 hover:text-emerald-700',
        },
        purple: {
            bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
            badge: 'bg-purple-100 text-purple-700',
            link: 'text-purple-600 hover:text-purple-700',
        },
    };

    return (
        <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
            <div className={`relative h-56 ${colorClasses[color].bg} overflow-hidden`}>
                <img
                    src={image}
                    alt={title}
                    className="h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                {/* Category badge */}
                <div className={`absolute top-4 left-4 rounded-full px-3 py-1 ${colorClasses[color].badge} text-xs font-semibold backdrop-blur-sm`}>
                    Actualité
                </div>
            </div>

            <div className="p-6">
                <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            ></path>
                        </svg>
                        <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            ></path>
                        </svg>
                        <span>{author}</span>
                    </div>
                </div>

                <h3 className="mb-3 line-clamp-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-gray-700">{title}</h3>
                <p className="mb-4 line-clamp-3 leading-relaxed text-gray-600">{description}</p>

                <Link
                    href="#"
                    className={`inline-flex items-center gap-2 ${colorClasses[color].link} group/link font-semibold transition-all duration-300`}
                >
                    <span>Lire la suite</span>
                    <svg
                        className="h-4 w-4 transition-transform group-hover/link:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                    </svg>
                </Link>
            </div>
        </div>
    );
};

Home.layout = (page: React.ReactNode) => <GuestLayout children={page} />;

export default Home;
