import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type GroupedNavItem, type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { usePermissions } from '@/lib/auth';
import {
    Bookmark,
    Building,
    Building2,
    Calendar,
    CalendarRange,
    ClipboardCheck,
    Currency,
    DiamondIcon,
    FilePlus,
    FileText,
    GraduationCap,
    Home,
    Key,
    LayoutGrid,
    Settings,
    Shield,
    Sliders,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Accueil',
        href: '/home',
        icon: Home,
        isActive: route().current('home'),
        color: 'text-blue-500',
    },
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        isActive: route().current('dashboard'),
    },
];

const institutionItems: NavItem[] = [
    {
        title: 'Gérer Institutions',
        href: '/institutions',
        icon: Building,
        isActive: route().current('institutions.index'),
        color: 'text-purple-500',
    },
];

const teacherItems: NavItem[] = [
    {
        title: 'Gérer Enseignants',
        href: '/teachers',
        icon: Users,
        isActive: route().current('teachers.index'),
        color: 'text-blue-500',
    },
];

const secretaryItems: NavItem[] = [
    {
        title: 'Gérer cours',
        href: '/courses',
        icon: Bookmark,
        isActive: route().current('courses.index'),
        color: 'text-indigo-500',
    },
    {
        title: 'Toutes les unités',
        href: '/units-teachings',
        icon: FileText,
        isActive: route().current('units-teachings.index'),
        color: 'text-purple-500',
    },
    {
        title: 'Gérer Attributions',
        href: '/assignments',
        icon: Bookmark,
        isActive: route().current('assignments.index'),
        color: 'text-indigo-500',
    },
     {
        title: 'Gérer Jurys',
        href: '/juries',
        icon: FilePlus,
        isActive: route().current('juries.index'),
        color: 'text-indigo-500',
    },
      {
        title: 'Gérer Programmes',
        href: '/programs',
        icon: FilePlus,
        isActive: route().current('programs.index'),
        color: 'text-indigo-500',
    },
];
const departmentItems: NavItem[] = [
    {
        title: 'Gérer Départements',
        href: '/departments',
        icon: DiamondIcon,
        isActive: route().current('departments.index'),
        color: 'text-blue-500',
    },
];

const facultyItems: NavItem[] = [
    {
        title: 'Gérer Facultés',
        href: '/faculties',
        icon: Building,
        isActive: route().current('faculties.index'),
        color: 'text-purple-500',
    },
];

const promotionItems: NavItem[] = [
    {
        title: 'Gérer Promotions',
        href: '/promotions',
        icon: Users,
        isActive: route().current('promotions.index'),
        color: 'text-blue-500',
    },
];

const userManagementItems: NavItem[] = [
    {
        title: 'Gérer Utilisateurs',
        href: '/users',
        icon: Users,
        isActive: route().current('users.*'),
        color: 'text-blue-500',
    },
    {
        title: 'Rôles & Permissions',
        href: '/roles',
        icon: Key,
        isActive: route().current('roles.*'),
        color: 'text-purple-500',
    },
];

const settingsItems: NavItem[] = [
    {
        title: 'Année Académique',
        href: '/academics',
        icon: CalendarRange,
        isActive: route().current('academics.*'),
        color: 'text-blue-500',
        permission: 'access_academic_years',
    },
    {
        title: 'Semestres',
        href: '/semestres',
        icon: Calendar,
        isActive: route().current('semestres.*'),
        color: 'text-indigo-500',
        permission: 'access_semestre',
    },
    {
        title: 'Devises',
        href: '/currencies',
        icon: Currency,
        isActive: route().current('currencies.*'),
        color: 'text-green-500',
        permission: 'access_currencies',
    },
    {
        title: 'Paramètres système',
        href: '/settings',
        icon: Sliders,
        isActive: route().current('settings.*'),
        color: 'text-purple-500',
        permission: 'access_settings',
    },
];

const groupedNavItems: GroupedNavItem[] = [
    {
        groupTitle: 'Institution',
        icon: Building,
        color: 'text-indigo-500',
        items: institutionItems,
        permission: 'access_institutions',
        isActive: route().current('institutions.*'),
    },
    {
        groupTitle: 'Gestion Enseignants',
        icon: GraduationCap,
        color: 'text-amber-500',
        items: teacherItems,
        permission: 'access_teachers',
        isActive: route().current('teachers.*'),
    },
    {
        groupTitle: 'Secrétariat Général',
        icon: ClipboardCheck,
        color: 'text-cyan-500',
        items: secretaryItems,
        permission: 'access_secretary_features',
        isActive: route().current('courses.*') || route().current('units-teachings.*'),
    },
    {
        groupTitle: 'Départements',
        icon: DiamondIcon,
        color: 'text-orange-500',
        items: departmentItems,
        permission: 'access_departements',
        isActive: route().current('departements.*'),
    },
    {
        groupTitle: 'Gestion Facultés',
        icon: Building2,
        color: 'text-red-500',
        items: facultyItems,
        permission: 'access_faculties',
        isActive: route().current('faculties.*'),
    },
    {
        groupTitle: 'Gestion Promotion',
        icon: Users,
        color: 'text-teal-500',
        items: promotionItems,
        permission: 'access_promotions',
        isActive: route().current('promotions.*'),
    },
    {
        groupTitle: 'Gestion des utilisateurs',
        icon: Shield,
        color: 'text-amber-500',
        items: userManagementItems,
        permission: 'access_user_management',
        isActive: route().current('roles*'),
    },
    {
        groupTitle: 'Paramètres',
        icon: Settings,
        color: 'text-gray-500',
        items: settingsItems,
        permission: 'access_currencies|access_settings',
        isActive: route().current('currencies*') || route().current('units*'),
    },
];

export function AppSidebar() {

     const { has } = usePermissions(); // Utilisation du hook de permissions

    // Fonction de vérification des permissions
    const hasPermission = (permissionString: string | undefined): boolean => {
        if (!permissionString) return true;
        return has(permissionString.split('|'));
    };

    // Filtrer les groupes et les items
    const filteredGroupedItems = groupedNavItems
        .filter(group => hasPermission(group.permission))
        .map(group => ({
            ...group,
            items: group.items.filter(item => hasPermission(item.permission))
        }))
        .filter(group => group.items.length > 0); // Supprimer les groupes vides

    // Filtrer les items principaux
    const filteredMainItems = mainNavItems.filter(item => hasPermission(item.permission));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredMainItems} groupedItems={filteredGroupedItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
