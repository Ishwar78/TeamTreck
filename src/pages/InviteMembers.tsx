import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Mail, Shield, AlertTriangle, CheckCircle2, Copy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { PageGuard } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

const roles = [
  { value: "employee", label: "Employee", desc: "Desktop tracking only" },
  { value: "sub_admin", label: "Sub-Admin", desc: "View reports & screenshots" },
  { value: "company_admin", label: "Admin", desc: "Full company control" },
];


const InviteMembers = () => {
  const { token, user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [invites, setInvites] = useState<any[]>([]);
  const [planLimits, setPlanLimits] = useState({ name: "...", maxUsers: 0, currentUsers: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvites();
      fetchPlanLimits();
    }
  }, [token]);

  const fetchInvites = async () => {
    try {
      const data = await apiFetch("/api/company/invites", token);
      setInvites(data.invites || []);
    } catch (err) {
      console.error("Failed to fetch invites", err);
    }
  };

  const fetchPlanLimits = async () => {
    try {
      const data = await apiFetch("/api/company/users", token);
      const companyDetails = await apiFetch("/api/company/details", token);

      const plan = companyDetails.company?.plan_id || {};

      setPlanLimits({
        name: plan.name || (companyDetails.company?.subscription?.status === 'trialing' ? "Trial" : "Standard"),
        maxUsers: companyDetails.company?.max_users || plan.max_users || 5,
        currentUsers: data.users?.length || 0
      });
    } catch (err) {
      console.error("Failed to fetch plan limits", err);
    }
  };

  const remaining = planLimits.maxUsers - planLimits.currentUsers - (invites.filter(i => i.status === 'pending').length);
  const canInvite = remaining > 0;

  const handleInvite = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await apiFetch("/api/company/invites", token, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });

      toast({ title: "Invite sent!", description: `Invitation sent to ${email}` });
      setEmail("");
      fetchInvites();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send invite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageGuard permission="invite_members">
        <div className="space-y-6 max-w-3xl">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UserPlus size={22} className="text-primary" /> Invite Team Members
            </h1>
            <p className="text-sm text-muted-foreground">Add employees to your organization</p>
          </div>

          {/* Plan Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border flex items-center gap-4 ${canInvite ? "border-border bg-gradient-card" : "border-destructive/30 bg-destructive/5"
              }`}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{planLimits.name} Plan</div>
              <div className="text-xs text-muted-foreground">
                {planLimits.currentUsers} / {planLimits.maxUsers} users
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${canInvite ? "text-primary" : "text-destructive"}`}>{remaining}</div>
              <div className="text-[10px] text-muted-foreground">seats left</div>
            </div>
            {!canInvite && (
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
                Upgrade Plan
              </Button>
            )}
          </motion.div>

          {/* Invite Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-gradient-card border border-border space-y-4"
          >
            <h2 className="font-semibold text-foreground text-sm">Send Invitation</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label className="text-xs">Email Address</Label>
                <div className="relative mt-1.5">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Label className="text-xs">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <div>
                          <div className="font-medium">{r.label}</div>
                          <div className="text-[10px] text-muted-foreground">{r.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleInvite} disabled={!canInvite || !email} className="gap-2">
              <UserPlus size={14} /> Send Invite
            </Button>
            {!canInvite && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle size={12} /> User limit reached. Upgrade to invite more members.
              </p>
            )}
          </motion.div>

          {/* Pending Invites */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-gradient-card border border-border"
          >
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm">Pending Invitations ({invites.length})</h2>
            </div>
            <div className="divide-y divide-border">
              {invites.map((inv) => (
                <div key={inv.token} className="flex items-center gap-4 p-4 hover:bg-secondary/20 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground">
                    {inv.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{inv.email}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {inv.role.replace("_", "-")} • Sent {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <Badge variant={inv.status === "pending" ? "default" : "destructive"} className="text-[10px]">
                    {inv.status === "pending" ? (
                      <span className="flex items-center gap-1"><CheckCircle2 size={10} /> Pending</span>
                    ) : (
                      <span className="flex items-center gap-1"><AlertTriangle size={10} /> {inv.status}</span>
                    )}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const link = `${window.location.origin}/invite/${inv.token}`;
                      navigator.clipboard.writeText(link);
                      toast({ title: "Link copied!", description: link });
                    }}
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </PageGuard>
    </DashboardLayout>
  );
};

export default InviteMembers;
