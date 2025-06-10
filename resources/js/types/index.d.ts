import { type LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

// Types existants inchangés
export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

// Nouveaux types pour la navigation
export type NavItem = {
    title: string;
    href: string;
    icon: LucideIcon;
    isActive?: boolean;
    color?: string;
    permission?: string;
};

export interface NavGroup {
  groupTitle: string;
  icon?: LucideIcon;
  color?: string;
  permission?: string | string[];
  isActive?: boolean;
  items: NavItem[];
}

export type GroupedNavItem = {
    groupTitle: string;
    icon: LucideIcon;
    color?: string;
    items: NavItem[];
    permission?: string;
    isActive?: boolean;
};