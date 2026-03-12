import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Play, Pause, LogOut, Camera, AlertTriangle, User, Calendar, BarChart3, Power } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fadeUp = {
  hidden: { opacity: 0, y: 20 } as const,
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

interface TimelineEvent {
  type: "start" | "pause" | "resume" | "idle" | "logout" | "screenshot" | "force_logout";
  time: string;
  detail: string;
}

interface UserSession {
  id: string;
  name: string;
  role: string;
  date: string;
  status: "active" | "paused" | "idle" | "offline";
  startTime: string;
  endTime: string | null;
  activeMinutes: number;
  pausedMinutes: number;
  idleMinutes: number;
  screenshots: number;
  timeline: TimelineEvent[];
}

// Mock data
const mockSessions: UserSession[] = [
  {
    id: "1", name: "Alice Johnson", role: "Developer", date: "2026-02-10",
    status: "active", startTime: "09:02", endTime: null,
    activeMinutes: 312, pausedMinutes: 45, idleMinutes: 18, screenshots: 62,
    timeline: [
      { type: "start", time: "09:02", detail: "Started work" },
      { type: "screenshot", time: "09:07", detail: "Screenshot captured" },
      { type: "pause", time: "10:30", detail: "Paused — Tea break" },
      { type: "resume", time: "10:45", detail: "Resumed work" },
      { type: "idle", time: "12:15", detail: "Idle detected — 8 min" },
      { type: "resume", time: "12:23", detail: "Activity resumed" },
      { type: "pause", time: "13:00", detail: "Paused — Lunch" },
      { type: "resume", time: "13:45", detail: "Resumed work" },
      { type: "screenshot", time: "14:02", detail: "Screenshot captured" },
    ],
  },
  {
    id: "2", name: "Bob Smith", role: "Designer", date: "2026-02-10",
    status: "paused", startTime: "09:15", endTime: null,
    activeMinutes: 245, pausedMinutes: 90, idleMinutes: 12, screenshots: 48,
    timeline: [
      { type: "start", time: "09:15", detail: "Started work" },
      { type: "screenshot", time: "09:20", detail: "Screenshot captured" },
      { type: "idle", time: "11:00", detail: "Idle detected — 5 min" },
      { type: "resume", time: "11:05", detail: "Activity resumed" },
      { type: "pause", time: "12:30", detail: "Paused — Lunch" },
      { type: "resume", time: "13:30", detail: "Resumed work" },
      { type: "pause", time: "15:00", detail: "Paused — Break" },
    ],
  },
  {
    id: "3", name: "Carol White", role: "PM", date: "2026-02-10",
    status: "idle", startTime: "08:50", endTime: null,
    activeMinutes: 280, pausedMinutes: 30, idleMinutes: 42, screenshots: 55,
    timeline: [
      { type: "start", time: "08:50", detail: "Started work" },
      { type: "screenshot", time: "08:55", detail: "Screenshot captured" },
      { type: "pause", time: "10:00", detail: "Paused — Meeting prep" },
      { type: "resume", time: "10:15", detail: "Resumed work" },
      { type: "idle", time: "14:30", detail: "Idle detected — 15 min" },
    ],
  },
  {
    id: "4", name: "David Lee", role: "Developer", date: "2026-02-10",
    status: "offline", startTime: "09:00", endTime: "17:05",
    activeMinutes: 420, pausedMinutes: 40, idleMinutes: 20, screenshots: 84,
    timeline: [
      { type: "start", time: "09:00", detail: "Started work" },
      { type: "pause", time: "12:00", detail: "Paused — Lunch" },
      { type: "resume", time: "12:40", detail: "Resumed work" },
      { type: "idle", time: "15:30", detail: "Idle detected — 10 min" },
      { type: "resume", time: "15:40", detail: "Activity resumed" },
      { type: "logout", time: "17:05", detail: "Session ended" },
    ],
  },
  {
    id: "5", name: "Eva Brown", role: "QA", date: "2026-02-10",
    status: "offline", startTime: "09:30", endTime: "16:45",
    activeMinutes: 360, pausedMinutes: 55, idleMinutes: 15, screenshots: 72,
    timeline: [
      { type: "start", time: "09:30", detail: "Started work" },
      { type: "pause", time: "11:30", detail: "Paused — Personal" },
      { type: "resume", time: "12:00", detail: "Resumed work" },
      { type: "force_logout", time: "16:45", detail: "Force logout by admin" },
    ],
  },
];

const eventIcons: Record<string, { icon: typeof Play; color: string }> = {
  start: { icon: Play, color: "text-green-400" },
  resume: { icon: Play, color: "text-green-400" },
  pause: { icon: Pause, color: "text-yellow-400" },
  idle: { icon: AlertTriangle, color: "text-red-400" },
  logout: { icon: LogOut, color: "text-muted-foreground" },
  force_logout: { icon: Power, color: "text-destructive" },
  screenshot: { icon: Camera, color: "text-primary" },
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-green-500/10", text: "text-green-400", label: "Active" },
  paused: { bg: "bg-yellow-500/10", text: "text-yellow-400", label: "Paused" },
  idle: { bg: "bg-red-500/10", text: "text-red-400", label: "Idle" },
  offline: { bg: "bg-muted/50", text: "text-muted-foreground", label: "Offline" },
};

const formatMinutes = (m: number) => {
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
};

const SessionTimeline = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [forceLogoutTarget, setForceLogoutTarget] = useState<UserSession | null>(null);

  const handleForceLogout = (user: UserSession) => {
    setForceLogoutTarget(user);
  };

  const confirmForceLogout = () => {
    if (forceLogoutTarget) {
      toast.error(`Force logout sent to ${forceLogoutTarget.name}`);
      setForceLogoutTarget(null);
    }
  };

  const selected = selectedUser ? mockSessions.find((s) => s.id === selectedUser) : null;

  return (
    <DashboardLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.div variants={fadeUp} custom={0} className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Session Timeline</h1>
            <p className="text-sm text-muted-foreground">Real-time view of employee work sessions</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Today — Feb 10, 2026</span>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Active", value: formatMinutes(mockSessions.reduce((a, s) => a + s.activeMinutes, 0)), color: "text-green-400" },
            { label: "Total Paused", value: formatMinutes(mockSessions.reduce((a, s) => a + s.pausedMinutes, 0)), color: "text-yellow-400" },
            { label: "Total Idle", value: formatMinutes(mockSessions.reduce((a, s) => a + s.idleMinutes, 0)), color: "text-red-400" },
            { label: "Screenshots", value: mockSessions.reduce((a, s) => a + s.screenshots, 0).toString(), color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-gradient-card border border-border p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* User List */}
        <motion.div variants={fadeUp} custom={2} className="rounded-xl bg-gradient-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Employee Sessions
            </h2>
          </div>
          <div className="divide-y divide-border">
            {mockSessions.map((session) => {
              const total = session.activeMinutes + session.pausedMinutes + session.idleMinutes;
              const activePct = total > 0 ? (session.activeMinutes / total) * 100 : 0;
              const pausedPct = total > 0 ? (session.pausedMinutes / total) * 100 : 0;
              const idlePct = total > 0 ? (session.idleMinutes / total) * 100 : 0;
              const sc = statusColors[session.status];

              return (
                <div
                  key={session.id}
                  className={`p-4 hover:bg-secondary/30 transition-colors cursor-pointer ${selectedUser === session.id ? "bg-secondary/40" : ""}`}
                  onClick={() => setSelectedUser(selectedUser === session.id ? null : session.id)}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground shrink-0">
                      {session.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{session.name}</span>
                        <Badge variant="outline" className="text-[10px]">{session.role}</Badge>
                        <Badge className={`text-[10px] ${sc.bg} ${sc.text} border-0`}>{sc.label}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {session.startTime} — {session.endTime || "In Progress"} · {session.screenshots} screenshots
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(session.status === "active" || session.status === "paused" || session.status === "idle") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs gap-1 h-7"
                          onClick={(e) => { e.stopPropagation(); handleForceLogout(session); }}
                        >
                          <Power className="h-3 w-3" /> Force Logout
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Time Breakdown Bar */}
                  <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                    <div className="bg-green-500 transition-all" style={{ width: `${activePct}%` }} />
                    <div className="bg-yellow-500 transition-all" style={{ width: `${pausedPct}%` }} />
                    <div className="bg-red-500 transition-all" style={{ width: `${idlePct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px]">
                    <span className="text-green-400">Active: {formatMinutes(session.activeMinutes)}</span>
                    <span className="text-yellow-400">Paused: {formatMinutes(session.pausedMinutes)}</span>
                    <span className="text-red-400">Idle: {formatMinutes(session.idleMinutes)}</span>
                  </div>

                  {/* Expanded Timeline */}
                  {selectedUser === session.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 ml-4 border-l-2 border-border pl-4 space-y-3"
                    >
                      {session.timeline.map((event, i) => {
                        const cfg = eventIcons[event.type] || eventIcons.start;
                        const Icon = cfg.icon;
                        return (
                          <div key={i} className="flex items-center gap-3 text-xs">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${event.type === "screenshot" ? "bg-primary/10" : event.type === "idle" || event.type === "force_logout" ? "bg-red-500/10" : event.type === "pause" ? "bg-yellow-500/10" : "bg-green-500/10"}`}>
                              <Icon className={`h-3 w-3 ${cfg.color}`} />
                            </div>
                            <span className="font-mono text-muted-foreground w-12 shrink-0">{event.time}</span>
                            <span className="text-foreground">{event.detail}</span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Force Logout Confirmation */}
      <Dialog open={!!forceLogoutTarget} onOpenChange={() => setForceLogoutTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Power className="h-5 w-5 text-destructive" /> Force Logout
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to force logout <strong>{forceLogoutTarget?.name}</strong>? This will immediately end their session and stop all tracking.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForceLogoutTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmForceLogout} className="gap-2">
              <Power className="h-4 w-4" /> Force Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SessionTimeline;
