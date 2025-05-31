import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type GroupedNavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { 
  LayoutGrid,
  Folder,
  BookOpen,
  Home,
  Building,
  PlusCircle,
  Users,
  ClipboardCheck,
  FilePlus,
  Bookmark,
  FileText,
  Calendar,
  Shield,
  Key,
  Settings,
  GraduationCap,
  Plus,
  Building2,
  CalendarRange,
  Currency,
  Sliders,
  DiamondIcon
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
  {
    title: 'Accueil',
    href: '/home',
    icon: Home,
    isActive: route().current('home'),
    color: 'text-blue-500'
  },
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutGrid,
    isActive: route().current('dashboard')
  },
];

const institutionItems: NavItem[] = [
  
  {
    title: 'Gérer Institutions',
    href: '/institutions',
    icon: Building,
    isActive: route().current('institutions.index'),
    color: 'text-purple-500'
  }
];

const teacherItems: NavItem[] = [
 
  {
    title: 'Gérer Enseignants',
    href: '/teachers',
    icon: Users,
    isActive: route().current('teachers.index'),
    color: 'text-blue-500'
  }
];

const secretaryGroups: NavItem[] = [
  {
    title: 'Gestion des Cours',
    items: [
      {
        title: 'Créer un cours',
        href: '/courses/create',
        icon: FilePlus,
        isActive: route().current('courses.create'),
        color: 'text-green-500',
        permission: 'create_courses'
      },
      {
        title: 'Liste des cours',
        href: '/courses',
        icon: Bookmark,
        isActive: route().current('courses.index'),
        color: 'text-indigo-500'
      }
    ]
  },
  {
    title: 'Unités d\'Enseignement',
    items: [
      {
        title: 'Créer une unité',
        href: '/units-teachings/create',
        icon: FilePlus,
        isActive: route().current('units-teachings.create'),
        color: 'text-green-500',
        permission: 'create_unit_teachings'
      },
      {
        title: 'Toutes les unités',
        href: '/units-teachings',
        icon: FileText,
        isActive: route().current('units-teachings.index'),
        color: 'text-purple-500'
      }
    ]
  }
];

const departmentItems: NavItem[] = [
  {
    title: 'Enregistrer département',
    href: '/departments/create',
    icon: PlusCircle,
    isActive: route().current('departments.create'),
    color: 'text-green-500',
    permission: 'create_departments'
  },
  {
    title: 'Tous les Départements',
    href: '/departments',
    icon: DiamondIcon,
    isActive: route().current('departments.index'),
    color: 'text-blue-500'
  }
];

const facultyItems: NavItem[] = [
  {
    title: 'Enregistrer Faculté',
    href: '/faculties/create',
    icon: Building2,
    isActive: route().current('faculties.create'),
    color: 'text-green-500',
    permission: 'create_faculties'
  },
  {
    title: 'Toutes les Facultés',
    href: '/faculties',
    icon: Building,
    isActive: route().current('faculties.index'),
    color: 'text-purple-500'
  }
];

const promotionItems: NavItem[] = [
  {
    title: 'Enregistrer Promotion',
    href: '/promotions/create',
    icon: Plus,
    isActive: route().current('promotions.create'),
    color: 'text-green-500',
    permission: 'create_promotions'
  },
  {
    title: 'Toutes les promotions',
    href: '/promotions',
    icon: Users,
    isActive: route().current('promotions.index'),
    color: 'text-blue-500'
  }
];

const userManagementItems: NavItem[] = [
  {
    title: 'Créer un utilisateur',
    href: '/users/create',
    icon: Plus,
    isActive: route().current('users.create'),
    color: 'text-green-500'
  },
  {
    title: 'Tous les utilisateurs',
    href: '/users',
    icon: Users,
    isActive: route().current('users.*'),
    color: 'text-blue-500'
  },
  {
    title: 'Rôles & Permissions',
    href: '/roles',
    icon: Key,
    isActive: route().current('roles.*'),
    color: 'text-purple-500'
  }
];

const settingsItems: NavItem[] = [
  {
    title: 'Année Académique',
    href: '/academics',
    icon: CalendarRange,
    isActive: route().current('academics.*'),
    color: 'text-blue-500',
    permission: 'access_academic_years'
  },
  {
    title: 'Semestres',
    href: '/semestres',
    icon: Calendar,
    isActive: route().current('semestres.*'),
    color: 'text-indigo-500',
    permission: 'access_semestre'
  },
  {
    title: 'Devises',
    href: '/currencies',
    icon: Currency,
    isActive: route().current('currencies.*'),
    color: 'text-green-500',
    permission: 'access_currencies'
  },
  {
    title: 'Paramètres système',
    href: '/settings',
    icon: Sliders,
    isActive: route().current('settings.*'),
    color: 'text-purple-500',
    permission: 'access_settings'
  }
];

const groupedNavItems: GroupedNavItem[] = [
  {
    groupTitle: 'Institution',
    icon: Building,
    color: 'text-indigo-500',
    items: institutionItems,
    permission: 'access_institutions',
    isActive: route().current('institutions.*')
  },
  {
    groupTitle: 'Gestion Enseignants',
    icon: GraduationCap,
    color: 'text-amber-500',
    items: teacherItems,
    permission: 'access_teachers',
    isActive: route().current('teachers.*')
  },
  {
    groupTitle: 'Secrétariat Général',
    icon: ClipboardCheck,
    color: 'text-cyan-500',
    items: secretaryGroups,
    permission: 'access_secretary_features',
    isGrouped: true
  },
  {
    groupTitle: 'Départements',
    icon: DiamondIcon,
    color: 'text-orange-500',
    items: departmentItems,
    permission: 'access_departements',
    isActive: route().current('departements.*')
  },
  {
    groupTitle: 'Gestion Facultés',
    icon: Building2,
    color: 'text-red-500',
    items: facultyItems,
    permission: 'access_faculties',
    isActive: route().current('faculties.*')
  },
  {
    groupTitle: 'Gestion Promotion',
    icon: Users,
    color: 'text-teal-500',
    items: promotionItems,
    permission: 'access_promotions',
    isActive: route().current('promotions.*')
  },
  {
    groupTitle: 'Gestion des utilisateurs',
    icon: Shield,
    color: 'text-amber-500',
    items: userManagementItems,
    permission: 'access_user_management',
    isActive: route().current('roles*')
  },
  {
    groupTitle: 'Paramètres',
    icon: Settings,
    color: 'text-gray-500',
    items: settingsItems,
    permission: 'access_currencies|access_settings',
    isActive: route().current('currencies*') || route().current('units*')
  }
];

const footerNavItems: NavItem[] = [
  {
    title: 'Repository',
    href: 'https://github.com/laravel/react-starter-kit',
    icon: Folder,
  },
  {
    title: 'Documentation',
    href: 'https://laravel.com/docs/starter-kits#react',
    icon: BookOpen,
  },
];

export function AppSidebar() {
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
        <NavMain items={mainNavItems} groupedItems={groupedNavItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}