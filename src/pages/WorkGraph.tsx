import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Calendar, Clock, Camera, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { PageGuard } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { format } from "date-fns";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://multiclout.in";

const prodColor = (p: number) => p >= 90 ? "text-status-active" : p >= 80 ? "text-primary" : p >= 70 ? "text-status-idle" : "text-destructive";

const WorkGraph = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("weekly");
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 0),
  });

  const [totals, setTotals] = useState({
    active: 0,
    idle: 0,
    total: 0,
    screenshots: 0,
    avgProd: 0
  });

  const [weeklyData, setWeeklyData] = useState<{ day: string, hours: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        let queryParams = `period=${period}`;
        if (period === "custom" && date?.from && date?.to) {
          queryParams += `&startDate=${date.from.toISOString()}&endDate=${date.to.toISOString()}`;
        }

        const summaryRes = await axios.get(`${API_BASE}/api/reports/summary?${queryParams}`, { headers });

        if (summaryRes.data.success) {
          setTotals(summaryRes.data.totals);
          setWeeklyData(summaryRes.data.weekly);
        }

      } catch (error) {
        console.error("Failed to load work graph", error);
        toast({ title: "Error", description: "Failed to load work activity data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, period, date]);

  const maxWeekly = Math.max(...weeklyData.map(d => d.hours), 1); 

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
      <PageGuard permission="view_dashboard">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp size={22} className="text-primary" /> My Work Graph
              </h1>
              <p className="text-sm text-muted-foreground">Detailed overview of your personal productivity and activity</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-gradient-card border border-border">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-muted-foreground" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Today</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === "custom" && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-[260px] justify-start text-left font-normal h-9 bg-card border-border",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <Calendar size={14} className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarUI
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "Active Hours", value: `${totals.active.toFixed(1)}h`, icon: Clock, color: "text-status-active" },
              { label: "Idle Hours", value: `${totals.idle.toFixed(1)}h`, icon: Clock, color: "text-status-idle" },
              { label: "Total Hours", value: `${totals.total.toFixed(1)}h`, icon: Clock, color: "text-primary" },
              { label: "Screenshots", value: totals.screenshots.toString(), icon: Camera, color: "text-primary" },
              { label: "Avg Productivity", value: `${totals.avgProd}%`, icon: TrendingUp, color: prodColor(totals.avgProd) },
            ].map(c => (
              <div key={c.label} className="rounded-xl bg-gradient-card border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">{c.label}</span>
                  <c.icon size={14} className={c.color} />
                </div>
                <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-gradient-card border border-border p-6 shadow-sm">
            <h2 className="font-semibold text-foreground text-sm mb-4">
              {period === 'daily' ? 'Activity Timeline' : 'Work Trend'}
            </h2>
            <div className="flex items-end gap-3 h-48 mt-4">
              {weeklyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-[30px]">
                  <span className="text-[11px] font-medium text-muted-foreground">{d.hours}h</span>
                  <motion.div
                    className="w-full max-w-[40px] rounded-t-lg bg-primary/40 hover:bg-primary/80 transition-colors shadow-sm"
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.hours / maxWeekly) * 150}px` }}
                    transition={{ delay: i * 0.05, duration: 0.5, type: 'spring' }}
                  />
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium text-center truncate w-full">{d.day}</span>
                </div>
              ))}
              {weeklyData.length === 0 && (
                 <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                   No work activity found for this period
                 </div>
              )}
            </div>
          </motion.div>
        </div>
      </PageGuard>
    </DashboardLayout>
  );
};

export default WorkGraph;
