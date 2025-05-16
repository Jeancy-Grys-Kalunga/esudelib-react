import React from 'react';
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
            
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-blue-600 to-indigo-800 text-white py-20 md:py-32 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-transparent opacity-50"></div>
                </div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-fadeIn">
                            Plateforme moderne de <span className="text-yellow-300">Gestion de Délibération</span>
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 opacity-90">
                            Simplifiez le processus de délibération et offrez une expérience transparente aux étudiants et enseignants.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            {auth.user ? (
                                <Link 
                                    href={route('dashboard')} 
                                    className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-lg transition duration-300 text-center"
                                >
                                    Tableau de bord
                                </Link>
                            ) : (
                                <>
                                    <Link 
                                        href={route('register')} 
                                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-lg transition duration-300 text-center"
                                    >
                                        Commencez maintenant
                                    </Link>
                                    <Link 
                                        href={route('login')} 
                                        className="bg-transparent hover:bg-white/10 border-2 border-white text-white font-bold py-3 px-8 rounded-lg transition duration-300 text-center"
                                    >
                                        Se connecter
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Animated shapes */}
                <div className="absolute top-0 right-0 w-1/3 h-full">
                    <div className="absolute top-20 right-20 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                    <div className="absolute top-40 right-40 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-0 right-60 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Fonctionnalités clés
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Découvrez comment notre plateforme révolutionne la gestion des délibérations
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                            }
                            title="Gestion centralisée"
                            description="Toutes les données de délibération en un seul endroit sécurisé et accessible."
                            iconBg="bg-blue-100"
                        />
                        
                        <FeatureCard 
                            icon={
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                                </svg>
                            }
                            title="Rapports automatisés"
                            description="Génération instantanée de procès-verbaux et relevés de notes."
                            iconBg="bg-green-100"
                        />
                        
                        <FeatureCard 
                            icon={
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                </svg>
                            }
                            title="Sécurité renforcée"
                            description="Protocoles avancés pour garantir la confidentialité des données."
                            iconBg="bg-purple-100"
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-gradient-to-r from-indigo-700 to-blue-600 text-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <StatItem value="30,000+" label="Étudiants" />
                        <StatItem value="11,000+" label="Diplômes obtenus" />
                        <StatItem value="39+" label="Enseignants" />
                        <StatItem value="5+" label="Années d'expérience" />
                    </div>
                </div>
            </section>

            {/* Registration Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center">
                        <div className="lg:w-1/2 mb-12 lg:mb-0 lg:pr-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                Prêt à simplifier vos délibérations?
                            </h2>
                            <p className="text-xl text-gray-600 mb-8">
                                Inscrivez-vous dès maintenant pour accéder à notre plateforme de gestion de délibération moderne et intuitive.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FeatureList 
                                    title="Pour les enseignants"
                                    items={[
                                        "Saisie simplifiée des notes",
                                        "Calculs automatiques",
                                        "Tableaux de bord personnalisés"
                                    ]}
                                />
                                
                                <FeatureList 
                                    title="Pour les étudiants"
                                    items={[
                                        "Accès instantané aux résultats",
                                        "Historique complet",
                                        "Notifications en temps réel"
                                    ]}
                                />
                            </div>
                        </div>
                        
                        <div className="lg:w-1/2 bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="p-8 md:p-10">
                                <h3 className="text-2xl font-bold text-center mb-6">Inscrivez-vous gratuitement</h3>
                                
                                <form onSubmit={handleSubmit}>
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
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                                    >
                                        S'inscrire
                                    </button>
                                    
                                    <div className="mt-4 text-center">
                                        <p className="text-gray-600">
                                            Vous avez déjà un compte?{' '}
                                            <Link href={route('login')} className="text-blue-600 hover:underline font-medium">
                                                Connectez-vous
                                            </Link>
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* News Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Actualités récentes
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Restez informé des dernières mises à jour et nouveautés
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                            color="green"
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
                    
                    <div className="text-center mt-12">
                        <Link 
                            href="#" 
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition duration-300"
                        >
                            Voir toutes les actualités
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
};

// Component for Feature Card
interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    iconBg?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, iconBg = 'bg-blue-100' }) => {
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300">
            <div className={`w-16 h-16 ${iconBg} rounded-lg flex items-center justify-center mb-6`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
};

// Component for Stat Item
interface StatItemProps {
    value: string;
    label: string;
}

const StatItem: React.FC<StatItemProps> = ({ value, label }) => {
    return (
        <div className="p-6">
            <div className="text-4xl md:text-5xl font-bold mb-2">{value}</div>
            <div className="text-lg opacity-90">{label}</div>
        </div>
    );
};

// Component for Feature List
interface FeatureListProps {
    title: string;
    items: string[];
}

const FeatureList: React.FC<FeatureListProps> = ({ title, items }) => {
    return (
        <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-bold mb-3">{title}</h3>
            <ul className="space-y-2">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// Component for Form Input
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
        <div className="mb-6">
            <label htmlFor={id} className="block text-gray-700 mb-2">{label}</label>
            <input 
                type={type} 
                id={id} 
                name={name} 
                className={`w-full px-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300`}
                required={required}
            />
            {error && <p className="mt-1 text-red-500 text-sm">{error}</p>}
        </div>
    );
};

// Component for News Card
interface NewsCardProps {
    image: string;
    date: string;
    author: string;
    title: string;
    description: string;
    color?: 'blue' | 'green' | 'purple';
}

const NewsCard: React.FC<NewsCardProps> = ({ image, date, author, title, description, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300">
            <div className={`h-48 ${colorClasses[color]} overflow-hidden`}>
                <img 
                    src={image} 
                    alt="News" 
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span className="mr-4">{date}</span>
                    <span>Par {author}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-gray-600 mb-4">{description}</p>
                <Link href="#" className="text-blue-600 font-medium hover:underline">
                    Lire la suite →
                </Link>
            </div>
        </div>
    );
};

Home.layout = (page: React.ReactNode) => <GuestLayout children={page} />;

export default Home;