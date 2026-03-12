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

  const apps = data.apps || [];
  const urls = data.urls || [];

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
              <div className="p-4 border-b border-border flex items-center gap-2">
                <Monitor size={16} className="text-primary" />
                <h2 className="font-semibold text-foreground text-sm">Top Applications</h2>
              </div>
              <div className="p-4 space-y-3">
                {apps.map((app, i) => (
                  <div key={app.name} className="space-y-2">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => app.children?.length ? toggleApp(app.name) : null}>
                          {app.children && app.children.length > 0 && (
                            <div className="text-muted-foreground hover:text-foreground transition-colors">
                              {expandedApps[app.name] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                          )}
                          <span className="text-sm font-medium text-foreground">{app.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${categoryColors[app.category] || "bg-muted text-muted-foreground"}`}>
                            {app.category}
                          </span>
                        </div>
                        <div className="text-right">
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

                    {/* Nested URLs */}
                    <AnimatePresence>
                      {expandedApps[app.name] && app.children && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-6 border-l-2 border-border ml-2"
                        >
                          <div className="py-2 space-y-2">
                            {app.children.map((url: any, j: number) => (
                              <div key={`${app.name}-url-${j}`} className="text-xs">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="truncate max-w-[200px] text-muted-foreground hover:text-foreground flex items-center gap-1">
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                {apps.length === 0 && (
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
              <div className="p-4 border-b border-border flex items-center gap-2">
                <Globe size={16} className="text-primary" />
                <h2 className="font-semibold text-foreground text-sm">Top Websites</h2>
              </div>
              <div className="p-4 space-y-3">
                {urls.map((site, i) => (
                  <motion.div
                    key={site.url}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground flex items-center gap-1">
                          {site.url} <ExternalLink size={10} className="text-muted-foreground" />
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${categoryColors[site.category] || "bg-muted text-muted-foreground"}`}>
                          {site.category}
                        </span>
                      </div>
                      <div className="text-right">
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
                  </motion.div>
                ))}
                {urls.length === 0 && (
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
