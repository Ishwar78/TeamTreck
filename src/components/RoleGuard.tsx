import { ReactNode } from "react";
import { Permission } from "@/lib/permissions";
import { usePermissions } from "@/hooks/usePermissions";
import { ShieldX } from "lucide-react";
import { ROLE_LABELS } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";

interface RoleGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Render children only if the current user has the given permission */
export const RoleGuard = ({ permission, children, fallback }: RoleGuardProps) => {
  const { can } = usePermissions();
  if (can(permission)) return <>{children}</>;
  return fallback ? <>{fallback}</> : null;
};

/** Full-page access denied — use as page wrapper */
export const PageGuard = ({ permission, children }: { permission: Permission; children: ReactNode }) => {
  const { can } = usePermissions();
  const { user } = useAuth();

  if (can(permission)) return <>{children}</>;

  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <ShieldX size={32} className="text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          Your role (<span className="font-medium text-foreground">{user ? ROLE_LABELS[user.role] : "Unknown"}</span>) does not have permission to access this page. Contact your Company Admin for access.
        </p>
      </div>
    </div>
  );
};
