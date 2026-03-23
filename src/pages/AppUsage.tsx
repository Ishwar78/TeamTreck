import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Monitor, Calendar, User, ExternalLink, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { PageGuard } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

const categoryColors: Record<string, string> = {
  Development: "bg-primary/20 text-primary",
  Browser: "bg-blue-500/20 text-blue-400",
  Design: "bg-violet-500/20 text-violet-400",
  Communication: "bg-emerald-500/20 text-emerald-400",
  Productivity: "bg-amber-500/20 text-amber-400",
  "Project Mgmt": "bg-rose-500/20 text-rose-400",
  Entertainment: "bg-red-500/20 text-red-400",
  Social: "bg-orange-500/20 text-orange-400",
};

const AppUsage = () => {
  const { token } = useAuth();
  const [selectedUser, setSelectedUser] = useState("all");
  const [period, setPeriod] = useState("today");
  const [employees, setEmployees] = useState<{ id: string, name: string }[]>([]);
  const [data, setData] = useState<{ apps: any[], urls: any[] }>({ apps: [], urls: [] });
  const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  
  const [appSearch, setAppSearch] = useState("");
  const [urlSearch, setUrlSearch] = useState("");
  
  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUsage();
    }
  }, [token, selectedUser, period]);

  const fetchEmployees = async () => {
    try {
      const res = await apiFetch("/api/company/users", token);
      const formatted = [
        { id: "all", name: "All Users" },
        ...(res.users || []).map((u: any) => ({ id: u._id, name: u.name }))
      ];
      setEmployees(formatted);
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        userId: selectedUser,
        period: period
      }).toString();
      const res = await apiFetch(`/api/activity/usage?${query}`, token);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch usage", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const mergeIntervals = (intervals: { start: string, end: string }[]) => {
    if (!intervals || intervals.length === 0) return [];
    
    // Sort by start time
    const sorted = [...intervals].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    const merged = [];
    let current = { ...sorted[0] };

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      const currentEnd = new Date(current.end).getTime();
      const nextStart = new Date(next.start).getTime();

      // Allow 15 seconds gap for merging (slack for 10s reporting interval)
      if (nextStart <= currentEnd + 15000) {
        if (new Date(next.end).getTime() > currentEnd) {
          current.end = next.end;
        }
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);
    return merged;
  };

  const apps = data.apps || [];
  const urls = data.urls || [];

  const filteredApps = apps.filter((a: any) => a.name?.toLowerCase().includes(appSearch.toLowerCase()));
  const filteredUrls = urls.filter((u: any) => u.url?.toLowerCase().includes(urlSearch.toLowerCase()));

  const maxAppSeconds = useMemo(() => Math.max(...apps.map((a: any) => a.seconds || 0), 1), [apps]);

  const maxUrlSeconds = useMemo(() => Math.max(...urls.map((u: any) => u.seconds || 0), 1), [urls]);

  const toggleApp = (appName: string) => {
    setExpandedApps(prev => ({ ...prev, [appName]: !prev[appName] }));
  };


  const periodLabel = period === "today" ? "Today" : period === "week" ? "This Week" : "This Month";
  const userName = employees.find(e => e.id === selectedUser)?.name || "All Users";

  return (
    <DashboardLayout>
      <PageGuard permission="view_app_usage">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Globe size={22} className="text-primary" /> App & URL Usage
            </h1>
            <p className="text-sm text-muted-foreground">Track application and website usage across your team</p>
          </div>

          {loading && (
            <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-medium">Crunching data...</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-gradient-card border border-border">
            <div className="flex items-center gap-2">
              <User size={14} className="text-muted-foreground" />
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-muted-foreground" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedUser !== "all" && (
              <span className="ml-auto text-xs text-muted-foreground">
                Showing data for <span className="text-primary font-medium">{userName}</span> · {periodLabel}
              </span>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Applications */}
            <motion.div
              key={`apps-${selectedUser}-${period}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-gradient-card border border-border"
            >
              <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-primary" />
                  <h2 className="font-semibold text-foreground text-sm">Top Applications</h2>
                </div>
                <div className="relative w-full sm:w-48">
                  <input
                    type="text"
                    placeholder="Search apps..."
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="p-4 space-y-3">
                {filteredApps.map((app: any, i: number) => {
                  const merged = mergeIntervals(app.intervals);
                  const latestInterval = merged[merged.length - 1];
                  
                  return (
                    <div key={app.name} className="space-y-2">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={() => toggleApp(app.name)}>
                            <div className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                              {expandedApps[app.name] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-foreground truncate">{app.name}</span>
                              <div className="flex items-center gap-2 mt-0.5 overflow-x-auto no-scrollbar pb-1">
                                {merged.slice(-3).map((interval: any, idx: number) => (
                                  <span key={idx} className="shrink-0 px-1.5 py-0.5 rounded bg-secondary/80 border border-border/50 text-[9px] font-mono text-muted-foreground">
                                    {formatTime(interval.start)}-{formatTime(interval.end)}
                                  </span>
                                ))}
                                {merged.length > 3 && <span className="text-[9px] text-muted-foreground">+{merged.length - 3} more</span>}
                              </div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${categoryColors[app.category] || "bg-muted text-muted-foreground"}`}>
                              {app.category}
                            </span>
                          </div>
                          <div className="text-right shrink-0 pl-4">
                            <span className="text-sm font-semibold text-foreground">{formatDuration(app.seconds)}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">
                              {selectedUser === "all" ? `${app.users} users` : ""}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-card rounded-full overflow-hidden border border-border">
                          <motion.div
                            className="h-full rounded-full bg-primary/60"
                            initial={{ width: 0 }}
                            animate={{ width: `${(app.seconds / maxAppSeconds) * 100}%` }}
                            transition={{ delay: i * 0.04 + 0.2, duration: 0.5 }}
                          />
                        </div>
                      </motion.div>

                      {/* Nested Details (URLs and Intervals) */}
                      <AnimatePresence>
                        {expandedApps[app.name] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-6 border-l-2 border-border ml-2"
                          >
                            <div className="py-2 space-y-4">
                              {/* Time Intervals for this App */}
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Full Usage Timeline</p>
                                <div className="flex flex-wrap gap-2">
                                  {merged.map((interval: any, idx: number) => (
                                    <div key={idx} className="px-2 py-1 rounded bg-secondary/50 border border-border text-[10px] font-mono">
                                      {formatTime(interval.start)} - {formatTime(interval.end)}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Nested URLs if any */}
                              {app.children && app.children.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Specific URLs</p>
                                  {app.children.map((url: any, j: number) => (
                                    <div key={`${app.name}-url-${j}`} className="text-xs">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="truncate max-w-[250px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                                          <ExternalLink size={10} /> {url.url}
                                        </span>
                                        <span className="font-mono text-muted-foreground">{formatDuration(url.seconds)}</span>
                                      </div>
                                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-primary/40 rounded-full"
                                          style={{ width: `${(url.seconds / app.seconds) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                {filteredApps.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                )}
              </div>
            </motion.div>

            {/* Top Websites */}
            <motion.div
              key={`urls-${selectedUser}-${period}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl bg-gradient-card border border-border"
            >
              <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-primary" />
                  <h2 className="font-semibold text-foreground text-sm">Top Websites</h2>
                </div>
                <div className="relative w-full sm:w-48">
                  <input
                    type="text"
                    placeholder="Search websites..."
                    value={urlSearch}
                    onChange={(e) => setUrlSearch(e.target.value)}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="p-4 space-y-3">
                {filteredUrls.map((site: any, i: number) => {
                  const mergedSite = mergeIntervals(site.intervals);
                  const isExpanded = expandedApps[`url-${site.url}`];

                  return (
                    <motion.div
                      key={site.url}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={() => setExpandedApps(prev => ({ ...prev, [`url-${site.url}`]: !prev[`url-${site.url}`] }))}>
                          <div className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-foreground flex items-center gap-1 truncate">
                              {site.url} <ExternalLink size={10} className="text-muted-foreground shrink-0" />
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 overflow-x-auto no-scrollbar pb-1">
                              {mergedSite.slice(-3).map((interval: any, idx: number) => (
                                <span key={idx} className="shrink-0 px-1.5 py-0.5 rounded bg-secondary/80 border border-border/50 text-[9px] font-mono text-muted-foreground">
                                  {formatTime(interval.start)}-{formatTime(interval.end)}
                                </span>
                              ))}
                              {mergedSite.length > 3 && <span className="text-[9px] text-muted-foreground">+{mergedSite.length - 3} more</span>}
                            </div>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${categoryColors[site.category] || "bg-muted text-muted-foreground"}`}>
                            {site.category}
                          </span>
                        </div>
                        <div className="text-right shrink-0 pl-4">
                          <span className="text-sm font-semibold text-foreground">{formatDuration(site.seconds)}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-2">{site.visits} visits</span>
                        </div>
                      </div>
                      <div className="h-2 bg-card rounded-full overflow-hidden border border-border">
                        <motion.div
                          className="h-full rounded-full bg-accent/60"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(site.seconds / maxUrlSeconds) * 100
                              }%`
                          }}
                          transition={{ delay: i * 0.04 + 0.2, duration: 0.5 }}
                        />
                      </div>

                      {/* URL Intervals */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-6 border-l-2 border-border ml-2 py-2"
                          >
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Visit Timeline</p>
                                <div className="flex flex-wrap gap-2">
                                  {mergedSite.map((interval: any, idx: number) => (
                                    <div key={idx} className="px-2 py-1 rounded bg-secondary/50 border border-border text-[10px] font-mono">
                                      {formatTime(interval.start)} - {formatTime(interval.end)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
                {filteredUrls.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Category Breakdown */}
          <motion.div
            key={`cats-${selectedUser}-${period}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-gradient-card border border-border p-6"
          >
            <h2 className="font-semibold text-foreground text-sm mb-4">Time by Category</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(
                [...apps, ...urls].reduce<Record<string, number>>((acc, item) => {
                  acc[item.category] = (acc[item.category] || 0) + (item.seconds || 0);

                  return acc;
                }, {})
              )
                .sort(([, a], [, b]) => b - a)
                .map(([cat, hours]) => (
                  <div
                    key={cat}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card"
                  >
                    <span className={`w-2.5 h-2.5 rounded-sm ${categoryColors[cat]?.split(" ")[0] || "bg-muted"}`} />
                    <span className="text-sm text-foreground">{cat}</span>
                    <span className="text-xs text-muted-foreground font-mono">{formatDuration(hours)}
                    </span>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      </PageGuard>
    </DashboardLayout>
  );
};

export default AppUsage;
