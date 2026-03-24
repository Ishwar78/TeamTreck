import { useAuth } from "@/contexts/AuthContext";
import { Permission, hasPermission, getPermissions, AppRole } from "@/lib/permissions";

// Mapping granular module actions back to our legacy Permission strings for backward compatibility
const actionToPermission: Record<string, Record<string, Permission>> = {
  team: {
    read: "view_team",
    write: "invite_members",
    edit: "manage_team",
    delete: "manage_team"
  },
  groups: {
    read: "view_team",
    write: "manage_team",
    edit: "manage_team",
    delete: "manage_team"
  },
  time_logs: {
    read: "view_time_logs",
    write: "view_time_logs", // basic write
    edit: "view_time_logs",
    delete: "manage_team" 
  },
  settings: {
    read: "manage_settings",
    write: "manage_settings",
    edit: "manage_settings",
    delete: "manage_settings"
  }
};

export const usePermissions = () => {
  const { user } = useAuth();

  const role: AppRole | "custom" | null = user?.role ?? null;

  return {
    can: (permission: Permission) => {
      if (!role) return false;
      
      // For custom roles, they don't use the legacy strings directly, 
      // but if a component checks `can("view_team")`, we must translate it to our custom action `team.read` if possible.
      if (role === 'custom' && user?.customPermissions) {
        // Reverse mapping check for backward compatibility of simple layout links
        if (permission === "view_dashboard") return true; // everyone sees dashboard
        
        // Exact mapping from string Permission to module boolean
        const mapping: Partial<Record<Permission, string>> = {
            view_team: "team",
            manage_team: "groups",
            view_time_logs: "time_logs",
            view_screenshots: "screenshots",
            view_app_usage: "app_usage",
            view_reports: "reports",
            invite_members: "invite_members",
            manage_settings: "settings",
            manage_billing: "billing",
            manage_roles: "roles",
            view_attendance: "attendance"
        };
        
        const module = mapping[permission];
        if (module) return !!user.customPermissions[module];

        // Fallbacks for permissions that might map to multiple modules
        if (permission === "manage_team") {
            return !!user.customPermissions["groups"] || !!user.customPermissions["notifications"] || !!user.customPermissions["time_claims"] || !!user.customPermissions["roles"];
        }
        if (permission === "view_time_logs") {
            return !!user.customPermissions["time_logs"] || !!user.customPermissions["justifications"];
        }
        
        return false;
      }
      
      return hasPermission(role as AppRole, permission);
    },

    canAll: (...perms: Permission[]) => {
      if (!role) return false;
      if (role === 'custom') return false; // simplify or evaluate
      return perms.every((p) => hasPermission(role as AppRole, p));
    },

    canAny: (...perms: Permission[]) => {
      if (!role) return false;
      if (role === 'custom') return false; // simplify or evaluate
      return perms.some((p) => hasPermission(role as AppRole, p));
    },

    canAction: (module: string, action?: string) => {
      if (!role) return false;
      
      // For custom roles, we now use a simple boolean per module ("completely access").
      if (role === 'custom') {
        const customAccess = user?.customPermissions?.[module];
        return typeof customAccess === 'boolean' ? customAccess : (typeof customAccess === 'object' && customAccess !== null ? !!(customAccess as any)[action || 'read'] : false);
      }
      
      // 2. Fallback to legacy AppRole checking
      const legacyPerm = actionToPermission[module]?.[action];
      if (legacyPerm) {
        return hasPermission(role as AppRole, legacyPerm);
      }
      
      // If no explicit mapping and they are super/company admin, allow.
      if (role === 'company_admin' || role === 'super_admin') return true;
      
      return false;
    },

    permissions: role && role !== 'custom' ? getPermissions(role as AppRole) : [],
    role,
  };
};
