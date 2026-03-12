import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Calendar, User, Download, FileText, FileSpreadsheet, TrendingUp, Clock, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { PageGuard } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const prodColor = (p: number) => p >= 90 ? "text-status-active" : p >= 80 ? "text-primary" : p >= 70 ? "text-status-idle" : "text-destructive";
const prodBg = (p: number) => p >= 90 ? "bg-status-active" : p >= 80 ? "bg-primary" : p >= 70 ? "bg-status-idle" : "bg-destructive";

const Reports = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("daily");
  const [selectedUser, setSelectedUser] = useState("All Users");

  const [totals, setTotals] = useState({
    active: 0,
    idle: 0,
    total: 0,
    screenshots: 0,
    avgProd: 0
  });

  const [weeklyData, setWeeklyData] = useState<{ day: string, hours: number }[]>([]);
  const [userSummaries, setUserSummaries] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<string[]>(["All Users"]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Summary
        // const summaryRes = await axios.get(`http://localhost:5000/api/reports/summary?period=${period}`, { headers });

const summaryRes = await axios.get(`${API_BASE}/api/reports/summary?period=${period}`, { headers });

        if (summaryRes.data.success) {
          setTotals(summaryRes.data.totals);
          setWeeklyData(summaryRes.data.weekly);
        }

        // Fetch User Stats
        // const usersRes = await axios.get(`http://localhost:5000/api/reports/users?period=${period}`, { headers });

const usersRes = await axios.get(`${API_BASE}/api/reports/users?period=${period}`, { headers });

        if (usersRes.data.success) {
          setUserSummaries(usersRes.data.users);
          setUsersList(["All Users", ...usersRes.data.users.map((u: any) => u.name)]);
        }

      } catch (error) {
        console.error("Failed to load reports", error);
        toast({ title: "Error", description: "Failed to load report data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, period]);

  const handleExport = (type: "pdf" | "csv") => {
    toast({ title: `${type.toUpperCase()} export started`, description: "Your report will download shortly." });
  };

  const filteredUsers = selectedUser === "All Users"
    ? userSummaries
    : userSummaries.filter(u => u.name === selectedUser);

  // Recalculate totals for filtered view if needed, but for now we keep global totals
  // or we could map them. Let's keep global structure for consistency with original design unless specified.

  const maxWeekly = Math.max(...weeklyData.map(d => d.hours), 1); // Avoid div by 0

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageGuard permission="view_reports">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 size={22} className="text-primary" /> Reports
              </h1>
              <p className="text-sm text-muted-foreground">Productivity summaries and exportable reports</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport("pdf")}>
                <FileText size={14} /> Export PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport("csv")}>
                <FileSpreadsheet size={14} /> Export CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-gradient-card border border-border">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-muted-foreground" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <User size={14} className="text-muted-foreground" />
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {usersList.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Active Hours", value: `${totals.active.toFixed(1)}h`, icon: Clock, color: "text-status-active" },
              { label: "Idle Hours", value: `${totals.idle.toFixed(1)}h`, icon: Clock, color: "text-status-idle" },
              { label: "Total Hours", value: `${totals.total.toFixed(1)}h`, icon: Clock, color: "text-primary" },
              { label: "Screenshots", value: totals.screenshots.toString(), icon: Camera, color: "text-primary" },
              { label: "Avg Productivity", value: `${totals.avgProd}%`, icon: TrendingUp, color: prodColor(totals.avgProd) },
            ].map(c => (
              <div key={c.label} className="rounded-xl bg-gradient-card border border-border p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">{c.label}</span>
                  <c.icon size={14} className={c.color} />
                </div>
                <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Weekly Chart */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-gradient-card border border-border p-6">
            <h2 className="font-semibold text-foreground text-sm mb-4">Team Hours — This Week</h2>
            <div className="flex items-end gap-3 h-40">
              {weeklyData.map((d, i) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{d.hours}h</span>
                  <motion.div
                    className="w-full rounded-t-md bg-primary/30 hover:bg-primary/50 transition-colors"
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.hours / maxWeekly) * 130}px` }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  />
                  <span className="text-xs text-muted-foreground">{d.day}</span>
                </div>
              ))}
              {weeklyData.length === 0 && <div className="w-full text-center text-muted-foreground text-sm">No activity this week</div>}
            </div>
          </motion.div>

          {/* User Summaries Table */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl bg-gradient-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm">User Productivity Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="p-4">User</th>
                    <th className="p-4">Active</th>
                    <th className="p-4">Idle</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Screenshots</th>
                    <th className="p-4">Top App</th>
                    <th className="p-4">Productivity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-foreground">{u.name}</div>
                        <div className="text-[10px] text-muted-foreground">{u.role}</div>
                      </td>
                      <td className="p-4 text-status-active font-medium">{u.activeH}h</td>
                      <td className="p-4 text-status-idle">{u.idleH}h</td>
                      <td className="p-4 text-foreground font-medium">{u.totalH}h</td>
                      <td className="p-4 text-muted-foreground">{u.screenshots}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className="text-[10px]">{u.topApp}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-card rounded-full overflow-hidden border border-border">
                            <div className={`h-full rounded-full ${prodBg(u.productivity)}`} style={{ width: `${u.productivity}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${prodColor(u.productivity)}`}>{u.productivity}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">No user data found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </PageGuard>
    </DashboardLayout>
  );
};

export default Reports;
