import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Mail, Shield, AlertTriangle, CheckCircle2, Copy, Users, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { PageGuard } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

const roles = [
  { value: "employee", label: "Employee", desc: "Desktop tracking only" },
   { value: "intern", label: "Intern", desc: "Limited access / trainee" },
  // { value: "sub_admin", label: "Sub-Admin", desc: "View reports & screenshots" },
  // { value: "company_admin", label: "Admin", desc: "Full company control" },
];


const InviteMembers = () => {
  const { token, user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [workingHours, setWorkingHours] = useState("9:00 AM to 6:00 PM");
  const [invites, setInvites] = useState<any[]>([]);
  const [planLimits, setPlanLimits] = useState({ name: "...", maxUsers: 0, currentUsers: 0 });
  const [loading, setLoading] = useState(false);

  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Invitation Deletion States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingToken, setDeletingToken] = useState<string | null>(null);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [requestingDelete, setRequestingDelete] = useState(false);
  const [verifyingDelete, setVerifyingDelete] = useState(false);

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
        body: JSON.stringify({ email, role, workingHours: workingHours.trim() }),
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

  const toggleSelectAll = () => {
    const pendingInvites = invites.filter(i => i.status === "pending");
    if (selectedTokens.length === pendingInvites.length) {
      setSelectedTokens([]);
    } else {
      setSelectedTokens(pendingInvites.map(i => i.token));
    }
  };

  const toggleSelect = (token: string) => {
    setSelectedTokens(prev => 
      prev.includes(token) ? prev.filter(t => t !== token) : [...prev, token]
    );
  };

  const handleRequestDelete = async (invToken: string) => {
    setDeletingToken(invToken);
    setRequestingDelete(true);
    try {
      await apiFetch("/api/company/users/delete-request", token, { method: "POST" });
      toast({ title: "OTP Sent", description: "Verification code sent to your admin email" });
      setShowDeleteModal(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to request deletion", variant: "destructive" });
    } finally {
      setRequestingDelete(false);
    }
  };

  const handleVerifyDelete = async () => {
    if (!deleteOtp || !deletingToken) return;
    setVerifyingDelete(true);
    try {
      await apiFetch(`/api/company/invites/${deletingToken}`, token, {
        method: "DELETE",
        body: JSON.stringify({ otp: deleteOtp })
      });
      toast({ title: "Deleted", description: "Invitation removed successfully" });
      setShowDeleteModal(false);
      setDeleteOtp("");
      setDeletingToken(null);
      fetchInvites();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete invitation", variant: "destructive" });
    } finally {
      setVerifyingDelete(false);
    }
  };

  const handleSendBulkMessage = async () => {
    if (!bulkMessage.trim() || selectedTokens.length === 0) return;
    setSendingMessage(true);
    try {
      await apiFetch("/api/company/invites/message", token, {
        method: "POST",
        body: JSON.stringify({ tokens: selectedTokens, message: bulkMessage }),
      });
      toast({ title: "Success", description: "Messages sent to selected members" });
      setSelectedTokens([]);
      setBulkMessage("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send messages", variant: "destructive" });
    } finally {
      setSendingMessage(false);
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
              <div className="w-full sm:w-40">
                <Label className="text-xs">Working Hours</Label>
                <div className="mt-1.5">
                  <Input
                    type="text"
                    placeholder="e.g. 9:00 AM to 6:00 PM"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
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
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={invites.filter(i => i.status === "pending").length > 0 && selectedTokens.length === invites.filter(i => i.status === "pending").length} 
                  onCheckedChange={toggleSelectAll} 
                />
                <h2 className="font-semibold text-foreground text-sm">Pending Invitations ({invites.length})</h2>
              </div>
            </div>

            {selectedTokens.length > 0 && (
              <div className="p-4 bg-secondary/10 border-b border-border space-y-3">
                <Label className="text-xs">Send Message to Selected ({selectedTokens.length})</Label>
                <textarea 
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={2}
                  placeholder="Type your message here..."
                  value={bulkMessage}
                  onChange={e => setBulkMessage(e.target.value)}
                />
                <Button size="sm" onClick={handleSendBulkMessage} disabled={sendingMessage || !bulkMessage.trim()}>
                  {sendingMessage ? "Sending..." : "Send Message"}
                </Button>
              </div>
            )}

            <div className="divide-y divide-border">
              {invites.map((inv) => (
                <div key={inv.token} className="flex items-center gap-4 p-4 hover:bg-secondary/20 transition-colors">
                  {inv.status === "pending" ? (
                    <Checkbox 
                      checked={selectedTokens.includes(inv.token)} 
                      onCheckedChange={() => toggleSelect(inv.token)} 
                    />
                  ) : (
                    <div className="w-4" />
                  )}
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground">
                    {inv.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{inv.email}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {inv.role.replace("_", "-")} • {inv.workingHours || "9:00 AM to 6:00 PM"} • Sent {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <Badge variant={inv.status === "pending" ? "default" : "destructive"} className="text-[10px]">
                    {inv.status === "pending" ? (
                      <span className="flex items-center gap-1"><CheckCircle2 size={10} /> Pending</span>
                    ) : (
                      <span className="flex items-center gap-1"><AlertTriangle size={10} /> {inv.status}</span>
                    )}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        const link = `${window.location.origin}/invite/${inv.token}`;
                        navigator.clipboard.writeText(link);
                        toast({ title: "Link copied!", description: link });
                      }}
                    >
                      <Copy size={14} />
                    </Button>

                    {inv.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRequestDelete(inv.token)}
                        disabled={requestingDelete && deletingToken === inv.token}
                      >
                        <Trash2 size={14} className={requestingDelete && deletingToken === inv.token ? "animate-pulse" : ""} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* OTP Deletion Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card w-full max-w-sm rounded-xl border border-border shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-border bg-secondary/20">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Shield size={16} className="text-primary" />
                  Verify Admin Identity
                </h3>
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 space-y-4 text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                  <Mail size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">OTP Sent to {user?.email}</p>
                  <p className="text-xs text-muted-foreground">Please enter the 6-digit verification code to delete this invitation permanently.</p>
                </div>
                
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="text-center text-lg tracking-[0.5em] font-bold h-12 bg-secondary/50"
                  value={deleteOtp}
                  onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ""))}
                />

                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground h-11" 
                    onClick={handleVerifyDelete}
                    disabled={verifyingDelete || deleteOtp.length !== 6}
                  >
                    {verifyingDelete ? "Deleting Invitation..." : "Confirm Deletion"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-xs h-9" 
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel Action
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </PageGuard>
    </DashboardLayout>
  );
};

export default InviteMembers;
