import { useState, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, Clock, AlertTriangle, CreditCard, Shield, Users,
  CheckCircle2, Info, ChevronDown, Settings, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ─── Types ───
export type NotificationType = "idle_breach" | "subscription" | "system" | "security" | "team";
export type NotificationPriority = "low" | "medium" | "high" | "critical";

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

// ─── Mock Data ───
const initialNotifications: Notification[] = [
  {
    id: "n1", type: "idle_breach", priority: "high",
    title: "Idle Threshold Exceeded",
    message: "Carol White has been idle for 25 minutes, exceeding the 15-min threshold.",
    time: "2 min ago", read: false,
  },
  {
    id: "n2", type: "subscription", priority: "critical",
    title: "Subscription Expiring Soon",
    message: "FreeTest's trial expires in 3 days. No payment method on file.",
    time: "15 min ago", read: false, actionLabel: "View Company", actionUrl: "/super-admin/companies",
  },
  {
    id: "n3", type: "system", priority: "medium",
    title: "Agent Update Available",
    message: "Desktop agent v1.3.0 is available. 12 agents are running outdated versions.",
    time: "1 hr ago", read: false, actionLabel: "View Details",
  },
  {
    id: "n4", type: "idle_breach", priority: "high",
    title: "Multiple Idle Alerts",
    message: "3 users at Acme Corp have exceeded idle thresholds in the last hour.",
    time: "1 hr ago", read: true,
  },
  {
    id: "n5", type: "subscription", priority: "medium",
    title: "Payment Failed",
    message: "OldCompany's payment of $49 failed. Retry #2 scheduled for tomorrow.",
    time: "2 hr ago", read: true, actionLabel: "View Subscription", actionUrl: "/super-admin/subscriptions",
  },
  {
    id: "n6", type: "security", priority: "critical",
    title: "Suspicious Login Detected",
    message: "Login from new device/location for admin@bigco.com (IP: 203.45.xx.xx, Berlin).",
    time: "3 hr ago", read: true,
  },
  {
    id: "n7", type: "team", priority: "low",
    title: "New User Joined",
    message: "Sarah Miller accepted invite and joined TechFlow Inc as a User.",
    time: "4 hr ago", read: true,
  },
  {
    id: "n8", type: "system", priority: "low",
    title: "Daily Report Generated",
    message: "Yesterday's platform report is ready. 127 active companies, 48,210 screenshots captured.",
    time: "6 hr ago", read: true,
  },
  {
    id: "n9", type: "subscription", priority: "high",
    title: "Plan Limit Reached",
    message: "DesignHub has reached 25/25 users on the Professional plan. New invites are blocked.",
    time: "8 hr ago", read: true, actionLabel: "Upgrade Plan",
  },
  {
    id: "n10", type: "idle_breach", priority: "medium",
    title: "Idle Summary",
    message: "Today's idle average is 14% across all companies. Acme Corp is highest at 22%.",
    time: "12 hr ago", read: true,
  },
];

// ─── Icons & Colors ───
const typeIcons: Record<NotificationType, React.ElementType> = {
  idle_breach: Clock,
  subscription: CreditCard,
  system: Settings,
  security: Shield,
  team: Users,
};

const priorityColors: Record<NotificationPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-status-idle/10 text-status-idle",
  critical: "bg-destructive/10 text-destructive",
};

const typeLabels: Record<NotificationType, string> = {
  idle_breach: "Idle Alert",
  subscription: "Billing",
  system: "System",
  security: "Security",
  team: "Team",
};

// ─── Context for global notification state ───
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const clearAll = () => setNotifications([]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, dismiss, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

// ─── Bell Button (for Sidebar/Header) ───
export const NotificationBell = ({ onClick }: { onClick: () => void }) => {
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
};

// ─── Dropdown Panel ───
export const NotificationDropdown = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const [filter, setFilter] = useState<NotificationType | "all">("all");

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="absolute right-0 top-full mt-2 w-[420px] max-h-[520px] rounded-xl bg-card border border-border shadow-card z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5">{unreadCount} new</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                    <CheckCircle2 size={12} className="mr-1" /> Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                  <X size={14} />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-1 p-2 border-b border-border overflow-x-auto shrink-0">
              {(["all", "idle_breach", "subscription", "system", "security", "team"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors",
                    filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {f === "all" ? "All" : typeLabels[f]}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Bell size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                filtered.map(n => {
                  const Icon = typeIcons[n.type];
                  return (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "flex gap-3 p-3 cursor-pointer transition-colors hover:bg-secondary/20",
                        !n.read && "bg-primary/5"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", priorityColors[n.priority])}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                            <span className="text-sm font-medium text-foreground leading-tight">{n.title}</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted-foreground">{n.time}</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{typeLabels[n.type]}</Badge>
                          {n.actionLabel && (
                            <button className="text-[10px] text-primary hover:underline">{n.actionLabel}</button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Full Page Notification Center ───
const NotificationCenter = () => {
  const { notifications, unreadCount, markRead, markAllRead, dismiss, clearAll } = useNotifications();
  const [filter, setFilter] = useState<NotificationType | "all">("all");

  const filtered = filter === "all" ? notifications : notifications.filter(n => n.type === filter);
  const groupByDate = (items: Notification[]) => {
    const today: Notification[] = [];
    const older: Notification[] = [];
    items.forEach(n => {
      if (n.time.includes("min") || n.time.includes("hr") || n.time === "Just now") {
        today.push(n);
      } else {
        older.push(n);
      }
    });
    return { today, older };
  };

  const { today, older } = groupByDate(filtered);

  const renderGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;
    return (
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">{title}</h3>
        <div className="space-y-2">
          {items.map(n => {
            const Icon = typeIcons[n.type];
            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-xl border border-border p-4 flex gap-3 transition-all cursor-pointer hover:border-primary/30",
                  !n.read && "bg-primary/5 border-primary/20"
                )}
                onClick={() => markRead(n.id)}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", priorityColors[n.priority])}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        <h4 className="text-sm font-medium text-foreground">{n.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); dismiss(n.id); }} className="text-muted-foreground hover:text-foreground shrink-0 mt-1">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">{n.time}</span>
                    <Badge variant="outline" className="text-[10px]">{typeLabels[n.type]}</Badge>
                    <Badge className={cn("text-[10px]", priorityColors[n.priority])}>{n.priority}</Badge>
                    {n.actionLabel && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">
                        {n.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell size={22} className="text-primary" /> Notification Center
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1">
              <CheckCircle2 size={12} /> Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-destructive">
              <Trash2 size={12} /> Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 flex-wrap">
        {(["all", "idle_breach", "subscription", "system", "security", "team"] as const).map(f => {
          const count = f === "all" ? notifications.length : notifications.filter(n => n.type === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5",
                filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {f === "all" ? "All" : typeLabels[f]}
              <span className="text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Notification Groups */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={40} className="mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No notifications in this category</p>
        </div>
      ) : (
        <div className="space-y-6">
          {renderGroup("Today", today)}
          {renderGroup("Earlier", older)}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
