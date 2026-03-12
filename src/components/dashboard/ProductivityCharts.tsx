import { motion } from "framer-motion";
import { BarChart3, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const weeklyData = [
  { day: "Mon", active: 7.2, idle: 1.1, total: 8.3 },
  { day: "Tue", active: 6.8, idle: 1.5, total: 8.3 },
  { day: "Wed", active: 7.5, idle: 0.8, total: 8.3 },
  { day: "Thu", active: 6.3, idle: 2.0, total: 8.3 },
  { day: "Fri", active: 5.9, idle: 1.4, total: 7.3 },
  { day: "Sat", active: 2.1, idle: 0.5, total: 2.6 },
  { day: "Sun", active: 0, idle: 0, total: 0 },
];

const hourlyData = Array.from({ length: 10 }, (_, i) => ({
  hour: `${9 + i}:00`,
  productivity: Math.round(60 + Math.random() * 35),
}));

const appData = [
  { name: "VS Code", value: 32, color: "hsl(192, 91%, 54%)" },
  { name: "Chrome", value: 24, color: "hsl(210, 100%, 60%)" },
  { name: "Slack", value: 15, color: "hsl(142, 71%, 45%)" },
  { name: "Figma", value: 12, color: "hsl(38, 92%, 50%)" },
  { name: "Terminal", value: 10, color: "hsl(270, 60%, 55%)" },
  { name: "Other", value: 7, color: "hsl(215, 20%, 55%)" },
];

const customTooltipStyle = {
  backgroundColor: "hsl(222, 47%, 8%)",
  border: "1px solid hsl(222, 30%, 16%)",
  borderRadius: "8px",
  color: "hsl(210, 40%, 96%)",
  fontSize: "12px",
};

const ProductivityCharts = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 size={20} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Productivity Analytics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Active vs Idle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-gradient-card border border-border p-5"
        >
          <h3 className="text-sm font-medium text-foreground mb-4">Weekly Active vs Idle Hours</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="active" fill="hsl(192, 91%, 54%)" radius={[4, 4, 0, 0]} name="Active" />
              <Bar dataKey="idle" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Idle" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Hourly Productivity Trend */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl bg-gradient-card border border-border p-5"
        >
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            Hourly Productivity <TrendingUp size={14} className="text-status-active" />
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(192, 91%, 54%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(192, 91%, 54%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
              <XAxis dataKey="hour" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Area type="monotone" dataKey="productivity" stroke="hsl(192, 91%, 54%)" fill="url(#prodGradient)" strokeWidth={2} name="Productivity %" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* App Usage Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-gradient-card border border-border p-5"
        >
          <h3 className="text-sm font-medium text-foreground mb-4">App Usage Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={appData}
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {appData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "hsl(215, 20%, 55%)" }}
              />
              <Tooltip contentStyle={customTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl bg-gradient-card border border-border p-5"
        >
          <h3 className="text-sm font-medium text-foreground mb-4">This Week Summary</h3>
          <div className="space-y-4">
            {[
              { label: "Average Productivity", value: "78%", bar: 78, color: "bg-primary" },
              { label: "Active Hours / Day", value: "6.3h", bar: 76, color: "bg-status-active" },
              { label: "Idle Hours / Day", value: "1.2h", bar: 15, color: "bg-status-idle" },
              { label: "Screenshots Captured", value: "1,284", bar: 90, color: "bg-primary" },
              { label: "Top App", value: "VS Code (32%)", bar: 32, color: "bg-primary" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className="text-sm font-medium text-foreground">{stat.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary">
                  <motion.div
                    className={`h-full rounded-full ${stat.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.bar}%` }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductivityCharts;
