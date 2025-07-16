// config/nav.ts
import {
  Home,
  Building,
  Users,
  ClipboardCheck,
  Settings,
  CalendarRange,
  Currency,
  FileText,
  PlusCircle,
  BookPlus,
} from "lucide-react";
import { type NavItem } from "@/types";

export const mainNavItems: NavItem[] = [
  {
    title: "Accueil",
    href: "/home",
    icon: Home,
  },
  {
    title: "Institutions",
    icon: Building,
    permission: "access_institutions",
    activeRoutes: ["/institutions"],
    items: [
      {
        title: "Créer une institution",
        href: "/institutions/create",
        icon: PlusCircle,
        permission: "create_institutions",
      },
      {
        title: "Liste des institutions",
        href: "/institutions",
        icon: Building,
      },
    ],
  },
  {
    title: "Gestion des enseignants",
    icon: Users,
    permission: "access_teachers",
    activeRoutes: ["/teachers"],
    items: [
      {
        title: "Ajouter un enseignant",
        href: "/teachers/create",
        icon: Users,
        permission: "create_teachers",
      },
      {
        title: "Liste des enseignants",
        href: "/teachers",
        icon: FileText,
      },
    ],
  },
  {
    title: "Secrétariat",
    icon: ClipboardCheck,
    permission: "access_secretary_features",
    items: [
      {
        title: "Gestion des cours",
        isTitle: true,
      },
      {
        title: "Créer un cours",
        href: "/courses/create",
        icon: BookPlus,
        permission: "create_courses",
      },
      {
        title: "Liste des cours",
        href: "/courses",
        icon: FileText,
      },
    ],
  },
  {
    title: "Paramètres",
    icon: Settings,
    permission: ["access_settings", "access_currencies"],
    items: [
      {
        title: "Année académique",
        href: "/academic-years",
        icon: CalendarRange,
        permission: "access_academic_years",
      },
      {
        title: "Devises",
        href: "/currencies",
        icon: Currency,
        permission: "access_currencies",
      },
    ],
  },
];