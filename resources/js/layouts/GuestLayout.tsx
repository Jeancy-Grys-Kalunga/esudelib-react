import { Head, Link } from '@inertiajs/react';
import React, { ReactNode } from 'react';

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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center text-xl font-bold text-gray-900">
                                <span className="mr-2 rounded bg-blue-600 px-2 py-1 text-white">EC</span>
                                E-CURSUS LMD
                            </Link>
                        </div>

                        <div className="hidden items-center space-x-8 md:flex">
                            <Link href="/" className="font-medium text-blue-600">
                                Accueil
                            </Link>
                            <Link href="#" className="text-gray-600 transition duration-300 hover:text-blue-600">
                                Fonctionnalités
                            </Link>
                            <Link href="#" className="text-gray-600 transition duration-300 hover:text-blue-600">
                                Actualités
                            </Link>
                            <Link href="#" className="text-gray-600 transition duration-300 hover:text-blue-600">
                                Contact
                            </Link>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Link href={route('login')} className="font-medium text-gray-600 transition duration-300 hover:text-blue-600">
                                Connexion
                            </Link>
                            <Link
                                href={route('register')}
                                className="rounded-lg bg-blue-300 px-4 py-2 font-medium text-white transition duration-300 hover:bg-blue-700"
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
            <footer className="bg-gray-900 py-12 text-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        <div>
                            <h3 className="mb-4 text-xl font-bold">E-CURSUSss LMD</h3>
                            <p className="text-gray-400">
                                Plateforme moderne de gestion des délibérations pour les établissements d'enseignement supérieur.
                            </p>
                        </div>

                        <QuickLinks
                            title="Liens rapides"
                            links={[
                                { href: '/', text: 'Accueil' },
                                { href: '#', text: 'Fonctionnalités' },
                                { href: '#', text: 'Tarifs' },
                                { href: '#', text: 'FAQ' },
                            ]}
                        />

                        <QuickLinks
                            title="Légal"
                            links={[
                                { href: '#', text: "Conditions d'utilisation" },
                                { href: '#', text: 'Politique de confidentialité' },
                                { href: '#', text: 'Mentions légales' },
                            ]}
                        />

                        <div>
                            <h4 className="mb-4 text-lg font-semibold">Contact</h4>
                            <address className="text-gray-400 not-italic">
                                <p>123 Rue de l'Université</p>
                                <p>75000 Paris, France</p>
                                <p className="mt-2">Email: contact@deliberation.com</p>
                                <p>Tél: +33 1 23 45 67 89</p>
                            </address>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
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
            <h4 className="mb-4 text-lg font-semibold">{title}</h4>
            <ul className="space-y-2">
                {links.map((link, index) => (
                    <li key={index}>
                        <Link href={link.href} className="text-gray-400 transition duration-300 hover:text-white">
                            {link.text}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GuestLayout;
