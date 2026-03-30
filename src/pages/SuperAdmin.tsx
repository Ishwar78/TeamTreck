import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Building2, BarChart3, CreditCard, Settings, Users, Package,
  LogOut, ChevronLeft, ShieldCheck, TrendingUp, TrendingDown, DollarSign,
  Activity, Ban, CheckCircle2, AlertTriangle, Plus, Search, MoreHorizontal,
  Eye, EyeOff, UserX, UserCheck, ArrowUpDown, Edit2, Trash2, Mail, Globe, Clock,
  MoreVertical, FileText, LifeBuoy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { usePlatform, Plan, Company } from "@/contexts/PlatformContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import axios from "axios";



const API_BASE = import.meta.env.VITE_API_BASE_URL;


// ─── Sidebar Data ───
const superAdminMenu = [
  { icon: BarChart3, label: "Overview", path: "/super-admin" },
  { icon: Building2, label: "Companies", path: "/super-admin/companies" },
  { icon: Users, label: "Users", path: "/super-admin/users" },
  { icon: Package, label: "Plans", path: "/super-admin/plans" },
  // { icon: CreditCard, label: "Subscriptions", path: "/super-admin/subscriptions" },
  { icon: Activity, label: "Analytics", path: "/super-admin/analytics" },
  { icon: Settings, label: "Settings", path: "/super-admin/settings" },
  { icon: Mail, label: "Demo Inquiries", path: "/super-admin/demo-inquiries" },
  { icon: LifeBuoy, label: "Support Tickets", path: "/super-admin/tickets" },
];

const SuperAdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside className={cn(
      "h-screen sticky top-0 border-r border-border bg-sidebar flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div>
              <span className="font-bold text-foreground text-sm block leading-tight">MULTICLOUT</span>
              <span className="text-xs text-primary">Super Admin</span>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground hidden md:block">
          <ChevronLeft size={18} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {superAdminMenu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon size={18} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t border-border">
        <Link to="/super/admin/login" className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
          <LogOut size={18} />
          {!collapsed && "Logout"}
        </Link>
      </div>
    </aside>
  );
};

// ─── Main Component ───
export default function SuperAdmin() {
  const { loading } = usePlatform();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes("/companies")) return "companies";
    if (path.includes("/users")) return "users";
    if (path.includes("/plans")) return "plans";
    if (path.includes("/subscriptions")) return "subscriptions";
    if (path.includes("/analytics")) return "analytics";
    if (path.includes("/settings")) return "settings";
    if (path.includes("/demo-inquiries")) return "demo";
    if (path.includes("/tickets")) return "tickets";
    return "overview";
  };

  const activeTab = getTabFromPath();

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0B0E14] text-white">Loading...</div>;

  return (
    <div className="flex h-screen bg-[#0B0E14] text-gray-100 overflow-hidden font-sans selection:bg-cyan-500/30 relative">
      {/* Mobile Header with Hamburger (Visible only on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-[#13161C] absolute top-0 left-0 right-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs">W</div>
          <span className="font-bold text-foreground text-sm">MULTICLOUT</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <Trash2 size={24} className="hidden" /> : <MoreHorizontal size={24} />}
        </Button>
      </div>

      {/* Sidebar Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "fixed md:relative inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:transform-none bg-[#0B0E14]",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <SuperAdminSidebar />
      </div>

      <main className="flex-1 w-full md:w-auto h-screen overflow-y-auto overflow-x-hidden pt-16 md:pt-0 bg-[#0B0E14] relative">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "companies" && <CompaniesTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "plans" && <PlansTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "demo" && <DemoInquiriesTab />}
          {activeTab === "tickets" && <TicketsTab />}
          {activeTab === "subscriptions" && (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <Activity size={48} className="mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold">Coming Soon</h2>
                <p>This module is currently under development.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Shared Comps ───

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    trial: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    suspended: "bg-red-500/10 text-red-400 border-red-500/20",
    invited: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
  };
  const style = styles[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} flex items-center gap-1.5 w-fit`}>
      <div className="w-1.5 h-1.5 rounded-full bg-current" />
      <span className="capitalize">{status}</span>
    </span>
  );
}

// ─── Tabs ───

// OVERVIEW
function OverviewTab() {
  const { companies, plans, users } = usePlatform();

  // Dynamic Stats
  const totalMRR = companies.reduce((acc, c) => acc + (c.mrr || 0), 0);
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  // Use mock revenue data for chart for now in Overview as requested only Plans/Companies/Users dynamic
  const monthlyRevenue = [
    { month: "Jan", revenue: totalMRR * 0.8 },
    { month: "Feb", revenue: totalMRR }
  ]; // Simplified

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck size={22} className="text-primary" /> Super Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Platform-wide overview and revenue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={CreditCard} label="Total MRR" value={`₹${totalMRR.toLocaleString()}`} trend="+12%" />
        <StatsCard icon={Building2} label="Active Companies" value={activeCompanies.toString()} trend="+4%" />
        <StatsCard icon={Users} label="Total Users" value={users.length.toString()} trend="+8%" />
        <StatsCard icon={Activity} label="Active Plans" value={plans.length.toString()} trend="0%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 rounded-xl bg-gray-900/50 border border-gray-800 p-6">
          <h3 className="font-semibold mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-800/20 rounded">
            Revenue Chart Placeholder (Dynamic Data requires historical DB)
          </div>
        </div>
        <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-6">
          <h3 className="font-semibold mb-4">Recent Companies</h3>
          <div className="space-y-4">
            {companies.slice(0, 5).map(c => (
              <div key={c.id} className="flex justify-between items-center text-sm">
                <div>
                  <div className="font-medium text-white">{c.name}</div>
                  <div className="text-gray-500 text-xs">{c.email}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function StatsCard({ icon: Icon, label, value, trend }: any) {
  return (
    <div className="bg-[#13161C] p-6 rounded-xl border border-gray-800">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-800/50 rounded-lg text-cyan-500">
          <Icon size={24} />
        </div>
      </div>
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

// COMPANIES
function CompaniesTab() {
  const { toast } = useToast();
  const { companies, plans, addCompany, suspendCompany, activateCompany, updateCompany, deleteCompany } = usePlatform();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [planDialog, setPlanDialog] = useState<Company | null>(null);
  const [newPlan, setNewPlan] = useState("");
  const [addDialog, setAddDialog] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "", email: "", password: "", plan: "", country: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const filtered = companies.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateCompany = async () => {
    try {
      await addCompany(newCompany);
      toast({ title: "Success", description: "Company created successfully" });
      setAddDialog(false);
      setNewCompany({ name: "", email: "", password: "", plan: "", country: "" });
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.message || "Failed to create company";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    }
  };

  const handlePlanAssign = async () => {
    if (!planDialog || !newPlan) return;
    try {
      await updateCompany(String(planDialog.id), { plan: newPlan });
      toast({ title: "Success", description: "Plan updated successfully" });
      setPlanDialog(null);
    } catch (e) {
      toast({ title: "Error", description: "Failed to update plan", variant: "destructive" });
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (confirm("Are you sure you want to delete this company? All associated users will also be deleted.")) {
      try {
        await deleteCompany(id);
        toast({ title: "Success", description: "Company and its users deleted." });
      } catch (e) {
        toast({ title: "Error", description: "Failed to delete company.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground">{companies.length} registered companies</p>
        </div>
        <Button size="sm" className="gap-1 bg-cyan-600 hover:bg-cyan-500" onClick={() => setAddDialog(true)}><Plus size={14} /> Add Company</Button>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9 bg-gray-900 border-gray-800" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-gray-900 border-gray-800"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl bg-[#13161C] border border-gray-800 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm text-left">
          <thead className="bg-gray-900/50 text-gray-400">
            <tr>
              <th className="p-4">Company</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Users</th>
              <th className="p-4">MRR</th>
              <th className="p-4">Status</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-cyan-500/5">
                <td className="p-4">
                  <div className="font-medium text-white">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.email}</div>
                </td>
                <td className="p-4"><Badge variant="outline" className="border-gray-700 bg-gray-800/50">{c.plan}</Badge></td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span>{c.users}/{c.maxUsers}</span>
                    <Progress value={(c.users / c.maxUsers) * 100} className="w-12 h-1.5" />
                  </div>
                </td>
                <td className="p-4 text-white">₹{c.mrr}</td>
                <td className="p-4"><StatusBadge status={c.status} /></td>
                <td className="p-4 text-gray-500">{new Date(c.joined).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setPlanDialog(c); setNewPlan(c.plan); }}><Edit2 size={14} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-400" onClick={() => c.status === 'suspended' ? activateCompany(String(c.id)) : suspendCompany(String(c.id))}>
                      {c.status === 'suspended' ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDeleteCompany(String(c.id))}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Company</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name" value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} />
            <Input placeholder="Email" value={newCompany.email} onChange={e => setNewCompany({ ...newCompany, email: e.target.value })} />
            <div className="relative">
              <Input placeholder="Password" type={showPassword ? "text" : "password"} value={newCompany.password} onChange={e => setNewCompany({ ...newCompany, password: e.target.value })} className="pr-10" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Select value={newCompany.plan} onValueChange={v => setNewCompany({ ...newCompany, plan: v })}>
              <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
              <SelectContent>
                {plans.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={newCompany.country} onValueChange={v => setNewCompany({ ...newCompany, country: v })}>
              <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Singapore">Singapore</SelectItem>
                <SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateCompany}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Dialog */}
      <Dialog open={!!planDialog} onOpenChange={() => setPlanDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change Plan</DialogTitle></DialogHeader>
          <Select value={newPlan} onValueChange={setNewPlan}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {plans.map(p => <SelectItem key={p.id} value={p.name}>{p.name} (₹{p.price})</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={handlePlanAssign}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// PLANS
function PlansTab() {
  const { plans, addPlan, updatePlan, deletePlan } = usePlatform();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", price: 0, users: "", screenshots: "12", retention: "1 Month", features: "", popular: false });
  const [editForm, setEditForm] = useState({ id: "", name: "", price: 0, users: "", screenshots: "12", retention: "1 Month", features: "", popular: false });

  const handleCreate = async () => {
    try {
      await addPlan({ 
        ...form, 
        users: Number(form.users) || 5,
        features: form.features.split("\n").filter(f => f.trim() !== "")
      });
      toast({ title: "Success", description: "Plan created" });
      setCreateOpen(false);
      setForm({ name: "", price: 0, users: "", screenshots: "12", retention: "1 Month", features: "", popular: false });
    } catch (e) { toast({ title: "Error", description: "Failed to create plan", variant: "destructive" }); }
  };

  const handleEditClick = (plan: any) => {
    setEditForm({
      id: plan.id,
      name: plan.name,
      price: plan.price,
       users: String(plan.users),
      screenshots: String(plan.screenshots).replace("/hr", ""),
      retention: plan.retention,
      features: (plan.features || []).join("\n"),
      popular: plan.popular || false
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      await updatePlan(editForm.id, {
        name: editForm.name,
        price: Number(editForm.price),
        users: Number(editForm.users),
        screenshots: editForm.screenshots,
        retention: editForm.retention,
        features: editForm.features.split("\n").filter(f => f.trim() !== ""),
        popular: editForm.popular
      });
      toast({ title: "Success", description: "Plan updated" });
      setEditOpen(false);
    } catch (e) { toast({ title: "Error", description: "Failed to update plan", variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlan(id);
      toast({ title: "Success", description: "Plan deleted" });
    } catch (e) { toast({ title: "Error", description: "Failed to delete plan", variant: "destructive" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Plans</h2>
        <Button onClick={() => setCreateOpen(true)} className="bg-cyan-600 hover:bg-cyan-500">+ Create Plan</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan: any) => (
          <div key={plan.id} className="bg-[#13161C] border border-gray-800 rounded-xl p-6 relative group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="text-3xl font-bold mt-2">₹{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></div>
              </div>
              <Badge variant="secondary">{plan.active} active</Badge>
            </div>
            {plan.popular && (
              <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/50">Most Popular</Badge>
            )}
            <ul className="space-y-3 mb-6 text-sm text-gray-400">
              <li>Max Users: {plan.users}</li>
              <li>Screenshots: {plan.screenshots}</li>
              <li>Retention: {plan.retention}</li>
              {(plan.features || []).map((f: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-cyan-500" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="w-full border-gray-700 hover:bg-gray-800" onClick={() => handleEditClick(plan)}>Edit</Button>
              <Button variant="ghost" className="w-full border border-gray-700 hover:bg-gray-800 text-red-400 hover:text-red-300" onClick={() => handleDelete(plan.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Price (₹)" type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
            <Input placeholder="Max Users" value={form.users} onChange={e => setForm({ ...form, users: e.target.value })} />
            <Input placeholder="Screenshots per hour" value={form.screenshots} onChange={e => setForm({ ...form, screenshots: e.target.value })} />
            <Input placeholder="Data Retention" value={form.retention} onChange={e => setForm({ ...form, retention: e.target.value })} />
            <div className="space-y-2">
              <Label>Plan Features (one per line)</Label>
              <Textarea 
                placeholder="Advanced reporting&#10;API access" 
                value={form.features} 
                onChange={e => setForm({ ...form, features: e.target.value })} 
                className="min-h-[100px]"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Most Popular</Label>
              <Switch checked={form.popular} onCheckedChange={v => setForm({ ...form, popular: v })} />
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input placeholder="Price" type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Max Users</Label>
              <Input placeholder="Max Users" value={editForm.users} onChange={e => setEditForm({ ...editForm, users: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Screenshots Per Hour</Label>
              <Input placeholder="Screenshots" value={editForm.screenshots} onChange={e => setEditForm({ ...editForm, screenshots: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Data Retention</Label>
              <Input placeholder="Retention" value={editForm.retention} onChange={e => setEditForm({ ...editForm, retention: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Plan Features (one per line)</Label>
              <Textarea 
                placeholder="Advanced reporting&#10;API access" 
                value={editForm.features} 
                onChange={e => setEditForm({ ...editForm, features: e.target.value })} 
                className="min-h-[100px]"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Most Popular</Label>
              <Switch checked={editForm.popular} onCheckedChange={v => setEditForm({ ...editForm, popular: v })} />
            </div>
          </div>
          <DialogFooter><Button onClick={handleUpdate}>Update Plan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


// USERS
function UsersTab() {
  const { users, deleteUser } = usePlatform();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const handleDeleteUser = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(id);
        toast({ title: "Success", description: "User deleted successfully." });
      } catch (e) {
        toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users</h2>
        <div className="text-gray-400">{users.length} total</div>
      </div>
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search users..." className="pl-9 bg-gray-900 border-gray-800" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="rounded-xl bg-[#13161C] border border-gray-800 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm text-left">
          <thead className="bg-gray-900/50 text-gray-400">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Company</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Last Seen</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.filter((u: any) => u.name.toLowerCase().includes(search.toLowerCase())).map((u: any) => (
              <tr key={u.id} className="hover:bg-cyan-500/5">
                <td className="p-4">
                  <div className="font-medium text-white">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </td>
                <td className="p-4 text-gray-400">{u.company}</td>
                <td className="p-4"><Badge variant="outline" className="border-gray-700 bg-gray-800/50">{u.role}</Badge></td>
                <td className="p-4"><StatusBadge status={u.status} /></td>
                <td className="p-4 text-gray-500 text-xs">{new Date(u.lastSeen).toLocaleString()}</td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDeleteUser(u.id)}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// ANALYTICS
function AnalyticsTab() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/super-admin/analytics`,{
        // axios.get('http://localhost:5000/api/super-admin/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchAnalytics();
  }, [token]);

  if (loading) return <div className="text-gray-400">Loading analytics...</div>;
  if (!data) return <div className="text-gray-400">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Platform Analytics</h2>
        <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 bg-cyan-500/10">Live Data</Badge>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={Users} label="Total Users" value={data.totalUsers} />
        <StatsCard icon={Building2} label="Total Companies" value={data.totalCompanies} />
        <StatsCard icon={CheckCircle2} label="Active Companies" value={data.activeCompanies} />
        <StatsCard icon={DollarSign} label="Total MRR" value={`₹${data.totalMRR}`} />
      </div>

      {/* Charts */}
      <div className="bg-[#13161C] p-6 rounded-xl border border-gray-800">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <TrendingUp size={18} className="text-cyan-500" />
          Growth Trend (Last 6 Months)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="name" stroke="#9CA3AF" axisLine={false} tickLine={false} />
              <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                itemStyle={{ color: '#E5E7EB' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="companies" fill="#06b6d4" name="New Companies" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue (MRR)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// SETTINGS
function SettingsTab() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    allowSignups: true,
    defaultTrialDays: 14,
    maintenanceMode: false,
    supportEmail: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/super-admin/settings`,{
        // axios.get('http://localhost:5000/api/super-admin/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setSettings(res.data.data);
        } else {
          setError("Failed to fetch settings");
        }
      } catch (e: any) {
        console.error("Failed to fetch settings", e);
        setError(e.response?.data?.message || e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchSettings();
  }, [token]);

  const handleSave = async () => {
    try {

await axios.put(`${API_BASE}/api/super-admin/settings`, settings, {
  headers: { Authorization: `Bearer ${token}` }


      // await axios.put('http://localhost:5000/api/super-admin/settings', settings, {
      //   headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: "Settings Saved", description: "Platform configuration updated." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
  };

  if (loading) return <div className="p-8 text-white text-xl">Loading settings...</div>;
  if (error) return <div className="p-8 text-red-500 text-xl">Error: {error}</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Settings</h2>
        <p className="text-gray-400 text-sm">Manage global configuration for the Workwise Hub.</p>
      </div>

      <div className="bg-[#13161C] p-8 rounded-xl border border-gray-800 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-white">Allow New Signups</Label>
            <p className="text-sm text-muted-foreground">Enable or disable new company registrations.</p>
          </div>
          <Switch checked={settings.allowSignups} onCheckedChange={v => setSettings({ ...settings, allowSignups: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-white">Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">Prevent user logins during maintenance (Admins excluded).</p>
          </div>
          <Switch checked={settings.maintenanceMode} onCheckedChange={v => setSettings({ ...settings, maintenanceMode: v })} />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Default Trial Duration (Days)</Label>
          <Input
            type="number"
            value={settings.defaultTrialDays}
            onChange={e => setSettings({ ...settings, defaultTrialDays: +e.target.value })}
            className="bg-gray-900 border-gray-700"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white">Support Email</Label>
          <Input
            value={settings.supportEmail}
            onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
            className="bg-gray-900 border-gray-700"
          />
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-500 w-full md:w-auto">Save Changes</Button>
        </div>
      </div>







    </div>





  );
};
// ─── DEMO INQUIRIES TAB ───
function DemoInquiriesTab() {
  const { token } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/super-admin/demo-inquiries`,
        // axios.get(
        //   "http://localhost:5000/api/super-admin/demo-inquiries",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching demo inquiries", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  if (loading) {
    return <div className="text-gray-400">Loading demo inquiries...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Demo Inquiries</h2>
        <p className="text-sm text-muted-foreground">
          {data.length} total demo requests
        </p>
      </div>

      <div className="rounded-xl bg-[#13161C] border border-gray-800 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm text-left">
          <thead className="bg-gray-900/50 text-gray-400">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Organisation</th>
              <th className="p-4">Message</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((item) => (
              <tr key={item._id} className="hover:bg-cyan-500/5">
                <td className="p-4 text-white">{item.name}</td>
                <td className="p-4 text-gray-400">{item.email}</td>
                <td className="p-4 text-gray-400">{item.phone}</td>
                <td className="p-4 text-gray-400">
                  {item.organisation || "-"}
                </td>
                <td className="p-4 text-gray-400 max-w-xs truncate">
                  {item.message || "-"}
                </td>
                <td className="p-4 text-gray-500 text-xs">
                  {new Date(item.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No demo inquiries yet.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TICKETS TAB ───
function TicketsTab() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMsg, setReplyMsg] = useState("");

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/super-admin/tickets`,
      // axios.get("http://localhost:5000/api/super-admin/tickets", 
        {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setTickets(res.data.data);
    } catch (e) {
      toast({ title: "Error", description: "Failed to fetch tickets", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTickets();
  }, [token]);

  const handleReply = async () => {
    if (!replyMsg.trim() || !selectedTicket) return;
    try {
      const res = await axios.post(
`${API_BASE}/api/super-admin/tickets/${selectedTicket._id}/reply`,
      // axios.post(
      //   `http://localhost:5000/api/super-admin/tickets/${selectedTicket._id}/reply`,

        { message: replyMsg },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setReplyMsg("");
        setSelectedTicket(res.data.data);
        fetchTickets();
        toast({ title: "Success", description: "Reply sent" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const res = await axios.put(
`${API_BASE}/api/super-admin/tickets/${selectedTicket._id}/status`,
      // axios.put(
      //   `http://localhost:5000/api/super-admin/tickets/${selectedTicket._id}/status`,

        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSelectedTicket(res.data.data);
        fetchTickets();
        toast({ title: "Success", description: "Status updated" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  if (loading) return <div className="text-gray-400">Loading tickets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2"><LifeBuoy className="text-primary" /> Support Tickets</h2>
        <div className="text-gray-400">{tickets.length} total tickets</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-[#13161C] flex flex-col h-[70vh]">
          <div className="p-4 border-b border-gray-800 font-semibold text-white">All Tickets</div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {tickets.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No tickets found.</div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors border ${selectedTicket?._id === t._id ? "bg-cyan-500/10 border-cyan-500/30" : "bg-[#1A1D24] hover:bg-gray-800 border-transparent"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm text-white truncate pr-2">{t.title}</h3>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${t.status === 'Open' ? 'text-green-400 border-green-400/30' : t.status === 'In Progress' ? 'text-blue-400 border-blue-400/30' : 'text-gray-400 border-gray-400/30'}`}>
                      {t.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400 flex justify-between">
                    <span>{t.companyId?.name || "Unknown"}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-[#13161C] flex flex-col h-[70vh]">
          {selectedTicket ? (
            <>
              <div className="p-5 border-b border-gray-800">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedTicket.title}</h2>
                    <div className="text-xs text-gray-400 mt-1">From: {selectedTicket.companyId?.name} ({selectedTicket.createdBy?.email})</div>
                  </div>
                  <Select value={selectedTicket.status} onValueChange={updateStatus}>
                    <SelectTrigger className="w-[140px] bg-gray-900 border-gray-700 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 rounded-lg bg-gray-900/50 text-sm text-gray-300 whitespace-pre-wrap border border-gray-800">
                  {selectedTicket.description}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedTicket.replies?.map((r: any, idx: number) => {
                  const isSuperAdmin = r.senderModel === "SuperAdmin";
                  return (
                    <div key={idx} className={`flex ${isSuperAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl p-3 text-sm ${isSuperAdmin ? "bg-cyan-600/20 text-cyan-50 border border-cyan-500/30 rounded-tr-none" : "bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none"}`}>
                        <div className="font-semibold text-xs mb-1 opacity-70">
                          {isSuperAdmin ? "You (Support)" : "Customer"}
                        </div>
                        <div className="whitespace-pre-wrap">{r.message}</div>
                        <div className="text-[10px] mt-2 opacity-50 text-right">
                          {new Date(r.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-gray-800 bg-gray-900/30 gap-2 flex items-stretch">
                <textarea
                  placeholder="Type your reply to the customer..."
                  className="flex-1 min-h-[40px] max-h-[120px] bg-gray-900 border border-gray-700 rounded-md p-2 text-sm text-white focus:outline-none focus:border-cyan-500 resize-y"
                  value={replyMsg}
                  onChange={(e) => setReplyMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                />
                <Button onClick={handleReply} className="h-auto bg-cyan-600 hover:bg-cyan-500">Reply</Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
              <LifeBuoy size={48} className="mb-4 opacity-20" />
              <p>Select a ticket to view conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}