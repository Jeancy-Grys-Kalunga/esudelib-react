// lib/permissions.ts
import { usePage } from "@inertiajs/react";

export function can(permission?: string | string[]): boolean {
  if (!permission) return true;
  
  const { props } = usePage();
  const userPermissions = props.auth?.user?.permissions || [];
  
  if (Array.isArray(permission)) {
    return permission.some(perm => userPermissions.includes(perm));
  }
  
  // Handle multiple permissions separated by | or ,
  const permList = permission.split(/[|,]/).map(p => p.trim());
  return permList.some(perm => userPermissions.includes(perm));
}