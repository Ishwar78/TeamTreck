import { motion } from "framer-motion";
import { Activity, Camera, Clock, Globe, AlertTriangle, UserCheck, LogIn } from "lucide-react";

type FeedEvent = {
  id: number;
  type: "screenshot" | "idle" | "app_switch" | "login" | "url_visit" | "alert";
  user: string;
  message: string;
  time: string;
  meta?: string;
};

const mockEvents: FeedEvent[] = [
  { id: 1, type: "screenshot", user: "Alice Johnson", message: "Screenshot captured", time: "Just now", meta: "VS Code — main.tsx" },
  { id: 2, type: "app_switch", user: "Bob Smith", message: "Switched to Figma", time: "1m ago", meta: "UI Design v3" },
  { id: 3, type: "idle", user: "Carol White", message: "Went idle (5 min)", time: "2m ago" },
  { id: 4, type: "url_visit", user: "David Lee", message: "Visited stackoverflow.com", time: "3m ago", meta: "React hooks question" },
  { id: 5, type: "login", user: "Eva Brown", message: "Logged in from desktop agent", time: "5m ago" },
  { id: 6, type: "screenshot", user: "Frank Chen", message: "Screenshot captured", time: "5m ago", meta: "Terminal — npm run dev" },
  { id: 7, type: "alert", user: "Carol White", message: "Idle exceeded threshold (15 min)", time: "8m ago" },
  { id: 8, type: "app_switch", user: "Alice Johnson", message: "Switched to Chrome", time: "10m ago", meta: "WEBMOK Dashboard" },
  { id: 9, type: "url_visit", user: "Bob Smith", message: "Visited dribbble.com", time: "12m ago", meta: "Inspiration board" },
  { id: 10, type: "login", user: "David Lee", message: "Logged in from desktop agent", time: "15m ago" },
];

const iconMap = {
  screenshot: Camera,
  idle: Clock,
  app_switch: Globe,
  login: LogIn,
  url_visit: Globe,
  alert: AlertTriangle,
};

const colorMap: Record<string, string> = {
  screenshot: "text-primary bg-primary/10",
  idle: "text-status-idle bg-status-idle/10",
  app_switch: "text-secondary-foreground bg-secondary",
  login: "text-status-active bg-status-active/10",
  url_visit: "text-primary bg-primary/10",
  alert: "text-destructive bg-destructive/10",
};

const ActivityFeed = () => {
  return (
    <div className="rounded-xl bg-gradient-card border border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Activity size={18} className="text-primary" /> Real-Time Activity Feed
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-status-active animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
        {mockEvents.map((event, i) => {
          const Icon = iconMap[event.type];
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 p-4 hover:bg-secondary/20 transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorMap[event.type]}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{event.user}</span>
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{event.message}</p>
                {event.meta && (
                  <span className="text-xs text-muted-foreground/70 font-mono">{event.meta}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
