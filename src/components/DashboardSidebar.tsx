import { useState, useEffect, useRef } from "react";
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
import { apiFetch } from "@/lib/api";

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permission: Permission;
  module?: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", permission: "view_dashboard", module: "dashboard" },
  { icon: Users, label: "Team", path: "/dashboard/team", permission: "view_team", module: "team" },
  { icon: UsersRound, label: "Groups", path: "/dashboard/groups", permission: "manage_team", module: "groups" },
  { icon: Clock, label: "Time Logs", path: "/dashboard/time", permission: "view_time_logs", module: "time_logs" },
  { icon: Camera, label: "Screenshots", path: "/dashboard/screenshots", permission: "view_screenshots", module: "screenshots" },
  { icon: Globe, label: "App & URL Usage", path: "/dashboard/usage", permission: "view_app_usage", module: "app_usage" },
  // { icon: Activity, label: "Activity Feed", path: "/dashboard/activity", permission: "view_activity", module: "activity" },
  { icon: BarChart3, label: "Reports", path: "/dashboard/reports", permission: "view_reports", module: "reports" },
  { icon: UserPlus, label: "Invite Members", path: "/dashboard/invite", permission: "invite_members", module: "invite_members" },
  // { icon: FileText, label: "API Spec", path: "/dashboard/api-spec", permission: "view_api_spec" },
  { icon: Bell, label: "Notifications", path: "/dashboard/notifications", permission: "manage_team", module: "notifications" },
  // { icon: ShieldBan, label: "Restrictions", path: "/dashboard/restrictions", permission: "configure_monitoring" },
  { icon: Timer, label: "Justifications", path: "/dashboard/justifications", permission: "view_time_logs", module: "justifications" },
  { icon: FileText, label: "Time Claims", path: "/dashboard/time-claim", permission: "manage_team", module: "time_claims" },
  { icon: CalendarCheck, label: "Attendance", path: "/dashboard/attendance", permission: "view_attendance", module: "attendance" },
  // { icon: PlayCircle, label: "Sessions", path: "/dashboard/sessions", permission: "view_sessions" },


  // ✅ Chat
 { icon: MessageCircle, label: "Chat", path: "/dashboard/chat", permission: "view_team", module: "chat" },
// ✅ Task
{ icon: CheckSquare, label: "Tasks", path: "/dashboard/task", permission: "view_dashboard", module: "tasks" },


// ✅ NEW ADD
{ icon: BarChart3, label: "Daily Report", path: "/dashboard/daily-report", permission: "view_daily_reports", module: "daily_reports" },

{ icon: ShieldBan, label: "Role Management", path: "/dashboard/roles", permission: "manage_roles", module: "roles" },

  { icon: CreditCard, label: "Billing", path: "/dashboard/billing", permission: "manage_billing", module: "billing" },
  // { icon: Settings, label: "Settings", path: "/dashboard/settings", permission: "manage_settings", module: "settings" },
  { icon: LifeBuoy, label: "Support Tickets", path: "/dashboard/support", permission: "manage_settings", module: "support" },


];

interface DashboardSidebarProps {
  onCloseMobile?: () => void;
}

const DashboardSidebar = ({ onCloseMobile }: DashboardSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { can, canAction } = usePermissions();
  const { user, logout, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  const totalUnreadRef = useRef(-1); // Switch to -1 as initial uninitialized state
  const lastSoundTriggerRef = useRef(0);
  const messageSoundRef = useRef<HTMLAudioElement | null>(null);

  const isChatPage = location.pathname.includes("/dashboard/chat");



  useEffect(() => {
    if (!token) return;
    const fetchUnread = async () => {
      try {
        const data = await apiFetch("/api/chat/summary", token);
        if (data.success) {
          const directCount = data.unreadDirect.reduce((acc: number, item: any) => acc + (item.count || 0), 0);
          const groupCount = data.groupCounts?.reduce((acc: number, item: any) => acc + (item.count || 0), 0) || 0;
          const totalUnread = directCount + groupCount;
          
          setUnreadCount(totalUnread);

          // 🔥 GLOBAL SOUND NOTIFICATION LOGIC
          // Only play if:
          // 1. Not on Chat page (ChatPage handles its own sounds)
          // 2. Not the first load (to avoid sound on mount)
          // 3. Count has increased
          if (!isChatPage && totalUnreadRef.current !== -1 && totalUnread > totalUnreadRef.current) {
             const now = Date.now();
             if (now - lastSoundTriggerRef.current > 1000) { // 1s cooldown
                lastSoundTriggerRef.current = now;
                if (messageSoundRef.current) {
                  messageSoundRef.current.currentTime = 0;
                  messageSoundRef.current.play().catch(() => {});
                }
             }
          }
          totalUnreadRef.current = totalUnread;
        }
      } catch (err) {
        console.error("Sidebar count fetch error", err);
      }
    };

    // Initialize audio and unlock on first interaction
    if (!messageSoundRef.current) {
      messageSoundRef.current = new Audio("/sounds/notification.mp3");
      messageSoundRef.current.volume = 1;

      const unlockAudio = () => {
        if (messageSoundRef.current) {
          messageSoundRef.current.play().then(() => {
            messageSoundRef.current?.pause();
            messageSoundRef.current!.currentTime = 0;
            document.removeEventListener('click', unlockAudio);
          }).catch(() => {});
        }
      };
      document.addEventListener('click', unlockAudio);
    }

    // Removed: totalUnreadRef.current = -1; (Moved to Ref initialization to persist)


    fetchUnread();
    const interval = setInterval(fetchUnread, 5000); // 5s poll for better responsiveness
    return () => {
      clearInterval(interval);
      // document.removeEventListener('click', unlockAudio); // Caution: unlockAudio is local to this effect
    };
  }, [token, isChatPage]);


  const visibleItems = menuItems.filter((item) => {
    if (user && user.role === 'custom' && item.module) {
      return !!user.customPermissions?.[item.module];
    }
    return can(item.permission);
  });

  return (
    <aside className={cn(
      "h-screen sticky top-0 border-r border-border bg-sidebar flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
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
                "flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                {!collapsed && item.label}
              </div>
              {item.label === "Chat" && unreadCount > 0 && (
                <span className={cn(
                  "bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px] h-[18px]",
                  collapsed && "absolute top-1 right-1"
                )}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
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
