// lib/auth.ts
import { usePage } from '@inertiajs/react';

export const usePermissions = () => {
  const { auth } = (usePage().props as unknown as { auth: { permissions?: string[] } });
  const permissions = auth.permissions || [];

  return {
    has: (required: string | string[]) => {
      if (Array.isArray(required)) {
        return required.some(perm => permissions.includes(perm));
      }
      return permissions.includes(required);
    }
  };
};

