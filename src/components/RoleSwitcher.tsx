import { useAuth } from "@/contexts/AuthContext";
import { AppRole, ROLE_LABELS } from "@/lib/permissions";
import { Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Demo-only role switcher — shows in sidebar footer */
const RoleSwitcher = () => {
  const { user, setRole } = useAuth();
  if (!user) return null;
  return (
    <div className="px-3 py-2 border-t border-border">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Shield size={10} className="text-primary" />
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Demo Role</span>
      </div>
      <Select value={user.role} onValueChange={(v) => setRole(v as AppRole)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ROLE_LABELS) as AppRole[]).filter(r => r !== "super_admin").map((role) => (
            <SelectItem key={role} value={role} className="text-xs">
              {ROLE_LABELS[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RoleSwitcher;
