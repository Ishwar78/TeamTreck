import { useAuth } from "@/contexts/AuthContext";
import { Permission, hasPermission, getPermissions, AppRole } from "@/lib/permissions";

export const usePermissions = () => {
  const { user } = useAuth();

  const role: AppRole | null = user?.role ?? null;

  return {
    can: (permission: Permission) => {
      if (!role) return false;
      return hasPermission(role, permission);
    },

    canAll: (...perms: Permission[]) => {
      if (!role) return false;
      return perms.every((p) => hasPermission(role, p));
    },

    canAny: (...perms: Permission[]) => {
      if (!role) return false;
      return perms.some((p) => hasPermission(role, p));
    },

    permissions: role ? getPermissions(role) : [],
    role,
  };
};
