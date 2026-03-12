import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, LogOut, Camera, Monitor, Globe, MousePointer, Clock, Coffee,
  AlertTriangle, CheckCircle2, XCircle, Timer, BarChart3, Shield, Minus, X,
  Wifi, WifiOff, Lock, Eye, EyeOff, Mail, KeyRound, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AgentStatus = "idle" | "active" | "paused" | "logged_out";

interface SessionLog {
  type: "start" | "pause" | "resume" | "idle" | "logout" | "screenshot" | "login" | "error";
  time: Date;
  detail?: string;
}

interface SessionSummary {
  totalActive: number;
  totalPaused: number;
  totalIdle: number;
  screenshotCount: number;
  startTime: Date | null;
  endTime: Date | null;
}

const STATUS_CONFIG: Record<AgentStatus, { color: string; bg: string; label: string; dot: string; icon: string }> = {
  active: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "Active — Tracking", dot: "bg-green-500", icon: "🟢" },
  paused: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", label: "Paused", dot: "bg-yellow-500", icon: "🟡" },
  idle: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Idle — No Activity", dot: "bg-red-500", icon: "🔴" },
  logged_out: { color: "text-muted-foreground", bg: "bg-muted/50 border-border", label: "Logged Out", dot: "bg-muted-foreground", icon: "⚫" },
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const AgentPanel = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Agent state
  const [status, setStatus] = useState<AgentStatus>("logged_out");
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [workStartTime, setWorkStartTime] = useState<Date | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [showIdleDialog, setShowIdleDialog] = useState(false);
  const [idleReason, setIdleReason] = useState("");
  const [showStartReminder, setShowStartReminder] = useState(false);
  const [forceLogoutTriggered, setForceLogoutTriggered] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState("controls");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenshotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const addLog = useCallback((log: Omit<SessionLog, "time">) => {
    setSessionLogs((prev) => [{ ...log, time: new Date() }, ...prev]);
  }, []);

  // Login handler
  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError("Please enter email and password");
      return;
    }
    setIsLoggingIn(true);
    setLoginError("");

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));

    // Demo: accept any credentials
    setIsAuthenticated(true);
    setIsLoggingIn(false);
    setStatus("logged_out");
    setSessionLogs([]);
    setActiveSeconds(0);
    setPausedSeconds(0);
    setIdleSeconds(0);
    setScreenshotCount(0);
    setWorkStartTime(null);
    setSummary(null);
    setShowSummary(false);
    addLog({ type: "login", detail: `Authenticated as ${email}` });
    toast.success("Logged in successfully — JWT token stored securely");

    // Remind if Start not clicked in 30s
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    reminderTimerRef.current = setTimeout(() => {
      if (!workStartTime) setShowStartReminder(true);
    }, 30000);
  };

  // Idle detection
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = new Date();
    if (status === "idle") {
      setStatus("active");
      addLog({ type: "resume", detail: "Activity resumed" });
    }
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (status === "active" || status === "idle") {
      idleTimerRef.current = setTimeout(() => {
        setStatus("idle");
        addLog({ type: "idle", detail: "No input detected" });
        setShowIdleDialog(true);
      }, 60000);
    }
  }, [status, addLog]);

  useEffect(() => {
    if (status === "active") {
      window.addEventListener("mousemove", resetIdleTimer);
      window.addEventListener("keydown", resetIdleTimer);
      resetIdleTimer();
    }
    return () => {
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [status, resetIdleTimer]);

  // Main timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (status === "active") {
      timerRef.current = setInterval(() => setActiveSeconds((s) => s + 1), 1000);
    } else if (status === "paused") {
      timerRef.current = setInterval(() => setPausedSeconds((s) => s + 1), 1000);
    } else if (status === "idle") {
      timerRef.current = setInterval(() => setIdleSeconds((s) => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  // Screenshot scheduler
  useEffect(() => {
    if (screenshotTimerRef.current) clearInterval(screenshotTimerRef.current);
    if (status === "active") {
      const scheduleNext = () => {
        const base = 300;
        const jitter = Math.floor(Math.random() * 180) - 90;
        return Math.max(10, base + jitter) * 1000;
      };
      const capture = () => {
        setScreenshotCount((c) => c + 1);
        addLog({ type: "screenshot", detail: "Screenshot captured" });
        screenshotTimerRef.current = setTimeout(capture, Math.min(scheduleNext(), 15000));
      };
      screenshotTimerRef.current = setTimeout(capture, 5000);
    }
    return () => { if (screenshotTimerRef.current) clearTimeout(screenshotTimerRef.current); };
  }, [status, addLog]);

  const handleStart = () => {
    const now = new Date();
    setStatus("active");
    setWorkStartTime(now);
    setShowStartReminder(false);
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    addLog({ type: "start", detail: "Work session started" });
    toast.success("Work started — all tracking modules enabled");
  };

  const handlePause = () => {
    setStatus("paused");
    addLog({ type: "pause", detail: "Work paused — tracking stopped" });
    toast("Work paused — tracking stopped", { icon: "⏸️" });
  };

  const handleResume = () => {
    setStatus("active");
    addLog({ type: "resume", detail: "Work resumed" });
    toast.success("Work resumed — tracking re-enabled");
  };

  const handleLogout = () => {
    const now = new Date();
    const sessionSummary: SessionSummary = {
      totalActive: activeSeconds,
      totalPaused: pausedSeconds,
      totalIdle: idleSeconds,
      screenshotCount,
      startTime: workStartTime,
      endTime: now,
    };
    setSummary(sessionSummary);
    setStatus("logged_out");
    setWorkStartTime(null);
    addLog({ type: "logout", detail: "Session ended" });
    setShowSummary(true);
    toast("Logged out — session ended", { icon: "⏹️" });
  };

  const handleFullLogout = () => {
    setShowSummary(false);
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
    setSessionLogs([]);
    setActiveSeconds(0);
    setPausedSeconds(0);
    setIdleSeconds(0);
    setScreenshotCount(0);
    toast("Token cleared — redirected to login");
  };

  const handleForceLogout = () => {
    setForceLogoutTriggered(true);
    addLog({ type: "error", detail: "⚠️ Force logout by admin" });
    toast.error("Your session was ended remotely by an administrator.");
    setTimeout(() => {
      handleLogout();
      setForceLogoutTriggered(false);
    }, 1500);
  };

  const handleIdleSubmit = () => {
    addLog({ type: "idle", detail: `Idle reason: ${idleReason || "No reason given"}` });
    setIdleReason("");
    setShowIdleDialog(false);
    setStatus("active");
    toast.success("Idle reason submitted");
  };

  const isWorking = status === "active" || status === "paused" || status === "idle";
  const statusCfg = STATUS_CONFIG[status];
  const totalSeconds = activeSeconds + pausedSeconds + idleSeconds;
  const activePercent = totalSeconds > 0 ? (activeSeconds / totalSeconds) * 100 : 0;

  // ─── LOGIN SCREEN ───
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <Card className="border-border/60 shadow-2xl overflow-hidden">
            {/* Title bar */}
            <div className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">TeamTreck Agent</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0">v2.1.0</Badge>
              </div>
              <div className="flex gap-1">
                <button className="w-3 h-3 rounded-full bg-yellow-500/60 hover:bg-yellow-500 transition-colors" />
                <button className="w-3 h-3 rounded-full bg-red-500/60 hover:bg-red-500 transition-colors" />
              </div>
            </div>

            <CardContent className="p-6 space-y-5">
              <div className="text-center space-y-1">
                <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">Agent Login</h2>
                <p className="text-xs text-muted-foreground">Sign in to start monitoring session</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="employee@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-9 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 h-9 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {loginError}
                  </p>
                )}

                <Button onClick={handleLogin} className="w-full gap-2 h-9" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating...</>
                  ) : (
                    <><Lock className="h-4 w-4" /> Sign In</>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                {isOnline ? (
                  <><Wifi className="h-3 w-3 text-green-500" /> Connected</>
                ) : (
                  <><WifiOff className="h-3 w-3 text-red-500" /> Offline</>
                )}
                <span className="mx-1">·</span>
                <span>Secured with JWT</span>
              </div>
            </CardContent>
          </Card>

          <p className="text-[10px] text-muted-foreground text-center mt-3">
            Monitoring agent managed by your organization
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── AGENT CONTROL PANEL ───
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="border-border/60 shadow-2xl overflow-hidden">
          {/* Title Bar (frameless window simulation) */}
          <div className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between select-none"
            style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">TeamTreck Agent</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0">v2.1.0</Badge>
              {isOnline ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
            </div>
            <div className="flex gap-1" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
              <button className="w-6 h-5 rounded-sm hover:bg-muted flex items-center justify-center transition-colors">
                <Minus className="h-3 w-3 text-muted-foreground" />
              </button>
              <button className="w-6 h-5 rounded-sm hover:bg-destructive/20 flex items-center justify-center transition-colors">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Status Bar */}
            <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-border ${statusCfg.bg}`}>
              <div className="relative">
                <div className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot}`} />
                {status === "active" && (
                  <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${statusCfg.dot} animate-ping`} />
                )}
              </div>
              <span className={`text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                {email}
              </span>
            </div>

            {/* Timer Display */}
            {isWorking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center px-4 pt-4">
                <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">Active Time</p>
                <p className="text-4xl font-mono font-bold text-foreground tracking-wider">
                  {formatDuration(activeSeconds)}
                </p>
                {totalSeconds > 0 && (
                  <div className="mt-2 space-y-1">
                    <Progress value={activePercent} className="h-1" />
                    <p className="text-[10px] text-muted-foreground">
                      {activePercent.toFixed(0)}% productive · {screenshotCount} screenshots
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Not started yet */}
            {isAuthenticated && !isWorking && status === "logged_out" && (
              <div className="text-center px-4 pt-6 pb-2">
                <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Click <span className="text-green-400 font-medium">Start Work</span> to begin tracking</p>
                <p className="text-[10px] text-muted-foreground mt-1">No tracking until you start</p>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pt-3 pb-4">
              <TabsList className="w-full h-7 p-0.5">
                <TabsTrigger value="controls" className="text-[10px] h-6 flex-1">Controls</TabsTrigger>
                <TabsTrigger value="modules" className="text-[10px] h-6 flex-1">Modules</TabsTrigger>
                <TabsTrigger value="log" className="text-[10px] h-6 flex-1">Log ({sessionLogs.length})</TabsTrigger>
              </TabsList>

              {/* Controls Tab */}
              <TabsContent value="controls" className="mt-3 space-y-3">
                {/* Main Action Buttons */}
                <div className="space-y-2">
                  {!isWorking && status === "logged_out" && (
                    <Button onClick={handleStart} className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white h-11 text-sm font-semibold" size="lg">
                      <Play className="h-5 w-5" /> Start Work
                    </Button>
                  )}

                  {status === "active" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={handlePause} variant="outline" className="gap-2 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 h-10">
                        <Pause className="h-4 w-4" /> Pause
                      </Button>
                      <Button onClick={handleLogout} variant="outline" className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 h-10">
                        <LogOut className="h-4 w-4" /> End Session
                      </Button>
                    </div>
                  )}

                  {status === "paused" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={handleResume} className="gap-2 bg-green-600 hover:bg-green-700 text-white h-10">
                        <Play className="h-4 w-4" /> Resume
                      </Button>
                      <Button onClick={handleLogout} variant="outline" className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 h-10">
                        <LogOut className="h-4 w-4" /> End Session
                      </Button>
                    </div>
                  )}

                  {status === "idle" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => setShowIdleDialog(true)} variant="outline" className="gap-2 border-red-500/40 text-red-400 hover:bg-red-500/10 h-10">
                        <AlertTriangle className="h-4 w-4" /> Justify
                      </Button>
                      <Button onClick={handleLogout} variant="outline" className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 h-10">
                        <LogOut className="h-4 w-4" /> End Session
                      </Button>
                    </div>
                  )}
                </div>

                {/* Session Stats */}
                {isWorking && (
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="rounded-md bg-green-500/10 p-2 text-center">
                      <p className="text-[9px] text-green-400 uppercase">Active</p>
                      <p className="text-xs font-mono font-semibold text-green-400">{formatDuration(activeSeconds)}</p>
                    </div>
                    <div className="rounded-md bg-yellow-500/10 p-2 text-center">
                      <p className="text-[9px] text-yellow-400 uppercase">Paused</p>
                      <p className="text-xs font-mono font-semibold text-yellow-400">{formatDuration(pausedSeconds)}</p>
                    </div>
                    <div className="rounded-md bg-red-500/10 p-2 text-center">
                      <p className="text-[9px] text-red-400 uppercase">Idle</p>
                      <p className="text-xs font-mono font-semibold text-red-400">{formatDuration(idleSeconds)}</p>
                    </div>
                  </div>
                )}

                {/* Admin simulation */}
                {isWorking && (
                  <div className="rounded-md border border-border bg-muted/30 p-2.5">
                    <p className="text-[9px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">🔧 Admin Simulation</p>
                    <Button
                      onClick={handleForceLogout}
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2 text-xs h-7"
                      disabled={forceLogoutTriggered}
                    >
                      <LogOut className="h-3 w-3" />
                      {forceLogoutTriggered ? "Force Logout In Progress..." : "Simulate Admin Force Logout"}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Modules Tab */}
              <TabsContent value="modules" className="mt-3">
                <div className="space-y-1.5">
                  {[
                    { icon: Clock, label: "Time Tracking", desc: "Recording work duration", active: status === "active" },
                    { icon: Camera, label: "Screenshots", desc: `12/hr randomized · ${screenshotCount} captured`, active: status === "active" },
                    { icon: Monitor, label: "App Tracking", desc: "Active application monitoring", active: status === "active" },
                    { icon: Globe, label: "URL Tracking", desc: "Browser activity logging", active: status === "active" },
                    { icon: MousePointer, label: "Idle Detection", desc: "Mouse & keyboard monitoring", active: status === "active" || status === "idle" },
                  ].map((mod) => (
                    <div key={mod.label} className="flex items-center gap-3 rounded-md border border-border/50 p-2.5">
                      {mod.active ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <mod.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${mod.active ? "text-foreground" : "text-muted-foreground"}`}>{mod.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{mod.desc}</p>
                      </div>
                      <Badge variant={mod.active ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                        {mod.active ? "ON" : "OFF"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Log Tab */}
              <TabsContent value="log" className="mt-3">
                {sessionLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No activity yet</p>
                ) : (
                  <div className="space-y-0.5 max-h-52 overflow-y-auto">
                    {sessionLogs.slice(0, 30).map((log, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] py-1 px-1.5 rounded hover:bg-muted/30">
                        <span className="text-muted-foreground font-mono w-14 shrink-0">
                          {log.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                        <span className={`shrink-0 ${
                          log.type === "error" ? "text-red-400" :
                          log.type === "screenshot" ? "text-primary" :
                          log.type === "start" || log.type === "resume" ? "text-green-400" :
                          log.type === "pause" ? "text-yellow-400" :
                          "text-foreground"
                        }`}>
                          {log.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-[9px] text-muted-foreground text-center mt-2">
          Tracking managed by your organization · User cannot disable monitoring permanently
        </p>
      </motion.div>

      {/* Idle Justification Dialog */}
      <Dialog open={showIdleDialog} onOpenChange={setShowIdleDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Idle Time Detected
            </DialogTitle>
            <DialogDescription className="text-xs">
              No activity detected. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g., In a meeting, Phone call, Training..."
            value={idleReason}
            onChange={(e) => setIdleReason(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowIdleDialog(false); setStatus("active"); }}>
              Dismiss
            </Button>
            <Button size="sm" onClick={handleIdleSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Reminder Dialog */}
      <Dialog open={showStartReminder} onOpenChange={setShowStartReminder}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Coffee className="h-4 w-4 text-yellow-500" /> Reminder
            </DialogTitle>
            <DialogDescription className="text-xs">
              You logged in but haven't started work yet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => { setShowStartReminder(false); handleStart(); }} className="gap-2 bg-green-600 hover:bg-green-700 text-white" size="sm">
              <Play className="h-4 w-4" /> Start Work Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-primary" /> Session Summary
            </DialogTitle>
          </DialogHeader>
          {summary && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-green-500/10 border border-green-500/20 p-2.5 text-center">
                  <p className="text-[10px] text-green-400">Active</p>
                  <p className="text-sm font-mono font-bold text-green-400">{formatDuration(summary.totalActive)}</p>
                </div>
                <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-2.5 text-center">
                  <p className="text-[10px] text-yellow-400">Paused</p>
                  <p className="text-sm font-mono font-bold text-yellow-400">{formatDuration(summary.totalPaused)}</p>
                </div>
                <div className="rounded-md bg-red-500/10 border border-red-500/20 p-2.5 text-center">
                  <p className="text-[10px] text-red-400">Idle</p>
                  <p className="text-sm font-mono font-bold text-red-400">{formatDuration(summary.totalIdle)}</p>
                </div>
                <div className="rounded-md bg-primary/10 border border-primary/20 p-2.5 text-center">
                  <p className="text-[10px] text-primary">Screenshots</p>
                  <p className="text-sm font-mono font-bold text-primary">{summary.screenshotCount}</p>
                </div>
              </div>
              {summary.startTime && summary.endTime && (
                <p className="text-[10px] text-muted-foreground text-center">
                  {summary.startTime.toLocaleTimeString()} — {summary.endTime.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSummary(false)}>Stay Logged In</Button>
            <Button size="sm" variant="destructive" onClick={handleFullLogout}>Logout Completely</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentPanel;
