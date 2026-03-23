import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UsersRound, Clock, Camera, Globe, BarChart3,
  Settings, CreditCard, LogOut, ChevronLeft, UserPlus, Building2,
  Activity, FileText, Bell, ShieldBan, Timer, CalendarCheck, PlayCircle, LifeBuoy, MessageCircle, CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell, NotificationDropdown, useNotifications } from "@/components/NotificationCenter";
import { Permission } from "@/lib/permissions";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/lib/permissions";
import RoleSwitcher from "@/components/RoleSwitcher";

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permission: Permission;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", permission: "view_dashboard" },
  { icon: Users, label: "Team", path: "/dashboard/team", permission: "view_team" },
  { icon: UsersRound, label: "Groups", path: "/dashboard/groups", permission: "manage_team" },
  { icon: Clock, label: "Time Logs", path: "/dashboard/time", permission: "view_time_logs" },
  { icon: Camera, label: "Screenshots", path: "/dashboard/screenshots", permission: "view_screenshots" },
  { icon: Globe, label: "App & URL Usage", path: "/dashboard/usage", permission: "view_app_usage" },
  // { icon: Activity, label: "Activity Feed", path: "/dashboard/activity", permission: "view_activity" },
  { icon: BarChart3, label: "Reports", path: "/dashboard/reports", permission: "view_reports" },
  { icon: UserPlus, label: "Invite Members", path: "/dashboard/invite", permission: "invite_members" },
  // { icon: FileText, label: "API Spec", path: "/dashboard/api-spec", permission: "view_api_spec" },
  { icon: Bell, label: "Notifications", path: "/dashboard/notifications", permission: "manage_team" },
  // { icon: ShieldBan, label: "Restrictions", path: "/dashboard/restrictions", permission: "configure_monitoring" },
  { icon: Timer, label: "Justifications", path: "/dashboard/justifications", permission: "view_time_logs" },
  { icon: FileText, label: "Time Claims", path: "/dashboard/time-claim", permission: "manage_team" },
  { icon: CalendarCheck, label: "Attendance", path: "/dashboard/attendance", permission: "view_attendance" },
  // { icon: PlayCircle, label: "Sessions", path: "/dashboard/sessions", permission: "view_sessions" },

  // ✅ Chat
 { icon: MessageCircle, label: "Chat", path: "/dashboard/chat", permission: "view_team" },
// ✅ Task
{ icon: CheckSquare, label: "Tasks", path: "/dashboard/task", permission: "view_dashboard" },

{ icon: ShieldBan, label: "Role Management", path: "/dashboard/roles", permission: "manage_roles" },

  { icon: CreditCard, label: "Billing", path: "/dashboard/billing", permission: "manage_billing" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings", permission: "manage_settings" },
  { icon: LifeBuoy, label: "Support Tickets", path: "/dashboard/support", permission: "manage_settings" },

];

interface DashboardSidebarProps {
  onCloseMobile?: () => void;
}

const DashboardSidebar = ({ onCloseMobile }: DashboardSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { can } = usePermissions();
  const { user, logout } = useAuth();

  const visibleItems = menuItems.filter((item) => can(item.permission));

  return (
    <aside className={cn(
      "h-screen sticky top-0 border-r border-border bg-sidebar flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs">W</div>
            <span className="font-bold text-foreground text-sm">MULTICLOUT</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={18} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-primary" />
            <span className="text-xs text-muted-foreground">{user?.companyName ?? "—"}</span>
          </div>
          <span className="text-[10px] text-primary">{user ? ROLE_LABELS[user.role] : "—"}</span>
        </div>
      )}

      <nav className="flex-1 py-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768 && onCloseMobile) {
                  onCloseMobile();
                }
              }}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon size={18} />
              {!collapsed && item.label}
            </Link>
          );
        })}

      </nav>

      {/* {!collapsed && <RoleSwitcher />} */}

      <div className="p-2 border-t border-border">
        <Link to="/admin/login" onClick={() => {
          logout();
          if (window.innerWidth < 768 && onCloseMobile) onCloseMobile();
        }} className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
          <LogOut size={18} />
          {!collapsed && "Logout"}
        </Link>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
