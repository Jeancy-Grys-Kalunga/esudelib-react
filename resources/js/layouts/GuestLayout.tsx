import React, { ReactNode } from 'react';
import { Head, Link } from '@inertiajs/react';

interface GuestLayoutProps {
    children: ReactNode;
}

const GuestLayout: React.FC<GuestLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <Link href="/" className="text-xl font-bold text-gray-900 flex items-center">
                                <span className="bg-blue-600 text-white px-2 py-1 rounded mr-2">GD</span>
                                Gestion Délibération
                            </Link>
                        </div>
                        
                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/" className="text-blue-600 font-medium">Accueil</Link>
                            <Link href="#" className="text-gray-600 hover:text-blue-600 transition duration-300">Fonctionnalités</Link>
                            <Link href="#" className="text-gray-600 hover:text-blue-600 transition duration-300">Actualités</Link>
                            <Link href="#" className="text-gray-600 hover:text-blue-600 transition duration-300">Contact</Link>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <Link 
                                href={route('login')} 
                                className="text-gray-600 hover:text-blue-600 transition duration-300 font-medium"
                            >
                                Connexion
                            </Link>
                            <Link 
                                href={route('register')} 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-300 font-medium"
                            >
                                Inscription
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
            
            {/* Main Content */}
            <main>{children}</main>
            
            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4">Gestion Délibération</h3>
                            <p className="text-gray-400">
                                Plateforme moderne de gestion des délibérations pour les établissements d'enseignement supérieur.
                            </p>
                        </div>
                        
                        <QuickLinks 
                            title="Liens rapides"
                            links={[
                                { href: "/", text: "Accueil" },
                                { href: "#", text: "Fonctionnalités" },
                                { href: "#", text: "Tarifs" },
                                { href: "#", text: "FAQ" },
                            ]}
                        />
                        
                        <QuickLinks 
                            title="Légal"
                            links={[
                                { href: "#", text: "Conditions d'utilisation" },
                                { href: "#", text: "Politique de confidentialité" },
                                { href: "#", text: "Mentions légales" },
                            ]}
                        />
                        
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Contact</h4>
                            <address className="text-gray-400 not-italic">
                                <p>123 Rue de l'Université</p>
                                <p>75000 Paris, France</p>
                                <p className="mt-2">Email: contact@deliberation.com</p>
                                <p>Tél: +33 1 23 45 67 89</p>
                            </address>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>© {new Date().getFullYear()} Plateforme de Gestion de Délibération. Tous droits réservés.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Component for Quick Links
interface QuickLinksProps {
    title: string;
    links: Array<{
        href: string;
        text: string;
    }>;
}

const QuickLinks: React.FC<QuickLinksProps> = ({ title, links }) => {
    return (
        <div>
            <h4 className="text-lg font-semibold mb-4">{title}</h4>
            <ul className="space-y-2">
                {links.map((link, index) => (
                    <li key={index}>
                        <Link href={link.href} className="text-gray-400 hover:text-white transition duration-300">
                            {link.text}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GuestLayout;