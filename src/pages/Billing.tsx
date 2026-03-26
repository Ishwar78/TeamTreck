import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageGuard } from "@/components/RoleGuard";
import {
  CreditCard, Check, ArrowRight, Receipt, Calendar, Users, HardDrive, Camera,
  AlertTriangle, Download, ArrowUpDown, Pause, Play, Shield, Clock, FileText,
  ChevronDown, ChevronRight, Ban, CheckCircle2, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
const API = import.meta.env.VITE_API_BASE_URL;
// Interfaces for fetched data
interface Plan {
  id: string; 
  name: string;
  price: number;
  users: number;
  storage: string;
  screenshots: string;
  retention: string;
  features: string[];
}

interface CurrentPlanData {
  name: string;
  price: number;
  cycle: "monthly" | "yearly";
  nextBilling: string;
  maxUsers: number;
  currentUsers: number;
  screenshotRate: string;
  storageUsed: number;
  storageMax: number;
  status: "active" | "past_due" | "canceled" | "trialing";
  startedAt: string;
  paymentMethod: string;
  autoRenew: boolean;
}
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
// const invoices = [
//   { id: "INV-2026-02", date: "2026-02-12", amount: 99, status: "paid" as const, plan: "Professional", downloadUrl: "#" },
//   { id: "INV-2026-01", date: "2026-01-12", amount: 99, status: "paid" as const, plan: "Professional", downloadUrl: "#" },
//   { id: "INV-2025-12", date: "2025-12-12", amount: 99, status: "paid" as const, plan: "Professional", downloadUrl: "#" },
// ];

// const paymentEvents = [
//   { date: "2026-02-12", event: "Payment received", amount: "$99.00", type: "success" },
//   { date: "2026-01-12", event: "Payment received", amount: "$99.00", type: "success" },
// ];

const statusColors: Record<string, string> = {
  active: "bg-status-active/10 text-status-active",
  trialing: "bg-blue-500/10 text-blue-500",
  past_due: "bg-destructive/10 text-destructive",
  canceled: "bg-muted text-muted-foreground",
};

const Billing = () => {
  const { toast } = useToast();
  const { token, user } = useAuth();

  const [currentPlan, setCurrentPlan] = useState<CurrentPlanData | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const [upgradeDialog, setUpgradeDialog] = useState<Plan | null>(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [showAllInvoices, setShowAllInvoices] = useState(false);

  // Need to handle autoRenew state based on fetched data
  const [autoRenew, setAutoRenew] = useState(true);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Company Details
      const companyRes = await 
      // axios.get('http://localhost:5000/api/company/details', { headers });
axios.get(`${API}/api/company/details`, { headers });


      // 2. Fetch Available Plans
      const plansRes = await axios.get(`${API}/api/public/plans`);
      //  axios.get('http://localhost:5000/api/public/plans');

      if (plansRes.data.success) {
        const mappedPlans = plansRes.data.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          users: p.users,
          storage: "Unlimited", // Defaulting as backend doesn't send this yet
          screenshots: "12/hr",
          retention: "1 Months",
          features: p.features
        }));
        setAllPlans(mappedPlans);
      }

      if (companyRes.data.success) {
        const c = companyRes.data.company;
        const p = c.plan_id;

        const planData: CurrentPlanData = {
          name: p?.name || "Trial",
          price: p?.price_monthly || 0,
          cycle: "monthly",

          nextBilling: c.subscription?.current_period_end 
            ? formatDate(c.subscription.current_period_end)
            : "N/A",

          maxUsers: c.max_users,
          currentUsers: 0, 
          screenshotRate: "12/hr",
          storageUsed: 0,
          storageMax: 10,
          status: c.subscription?.status || "trialing",
          startedAt: formatDate(c.created_at),
          paymentMethod: "Razorpay",
          autoRenew: c.subscription ? !c.subscription.cancel_at_period_end : true
        };

        // Add raw date for expiry check
        (planData as any).rawExpiry = c.subscription?.current_period_end;

        setCurrentPlan(planData);
        setAutoRenew(planData.autoRenew);
      }

    } catch (error) {
      console.error("Failed to fetch billing data", error);
      toast({ title: "Error", description: "Failed to load billing details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) { 
      fetchCompany();
    }
  }, [token, toast]);


  if (loading || !currentPlan) {
    return (
      <DashboardLayout>
        <div className="h-[50vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const userPct = (currentPlan.currentUsers / currentPlan.maxUsers) * 100;
  const storagePct = (currentPlan.storageUsed / currentPlan.storageMax) * 100;
  // const displayedInvoices = showAllInvoices ? invoices : invoices.slice(0, 4);

  const isUpgrade = (plan: Plan) => plan.price > currentPlan.price;
  const isDowngrade = (plan: Plan) => plan.price < currentPlan.price;

  const handlePlanChange = () => {
    if (!upgradeDialog) return;
    const action = isUpgrade(upgradeDialog) ? "Upgraded" : "Downgraded";
    toast({
      title: `${action} to ${upgradeDialog.name}`,
      description: `Request to change plan to ${upgradeDialog.name} (₹${upgradeDialog.price}/mo) sent.`,
    });
    setUpgradeDialog(null);
  };

  const handleCancel = () => {
    toast({ title: "Subscription Cancelled", description: "Your plan will remain active until the end of the current billing cycle.", variant: "destructive" });
    setCancelDialog(false);
  };

  const handleUpgrade = async (plan: Plan) => {
    try {
      // 1. Get Razorpay Key
      const keyRes = await axios.get(`${API}/api/payment/key`, {

      // axios.get('http://localhost:5000/api/payment/key', {

        headers: { Authorization: `Bearer ${token}` }
      });
      const key = keyRes.data.key;

      if (!key) {
        toast({ title: "Error", description: "Payment configuration missing", variant: "destructive" });
        return;
      }

      // 2. Create Order
      const orderRes = await axios.post(`${API}/api/payment/create-order`,
      //  axios.post('http://localhost:5000/api/payment/create-order',
        { planId: plan.id, companyId: user?.company_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || "Failed to create order");
      }

      const order = orderRes.data.order;

      // 3. Initialize Razorpay
      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: "Multiclout",
        description: `Upgrade to ${plan.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // 4. Verify Payment
            await axios.post(`${API}/api/payment/verify`,
            // axios.post('http://localhost:5000/api/payment/verify',
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                companyId: user?.company_id,
                planId: plan.id
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            toast({ title: "Success", description: `Upgraded to ${plan.name} successfully!` });
            setUpgradeDialog(null);
            fetchCompany(); // Refresh data
          } catch (err) {
            toast({ title: "Error", description: "Payment verification failed", variant: "destructive" });
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#00f5d4"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to initiate payment", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <PageGuard permission="manage_billing">
        <div className="space-y-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CreditCard size={22} className="text-primary" /> Billing & Subscription
            </h1>
            <p className="text-sm text-muted-foreground">Manage your plan, usage, payment method, and invoices</p>
          </div>

          {/* Current Plan Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-gradient-card border border-border p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-foreground">{currentPlan.name} Plan</h2>
                  <Badge className={`text-[10px] ${statusColors[currentPlan.status] || "bg-secondary text-secondary-foreground"}`}>
                    <CheckCircle2 size={10} className="mr-1" /> {currentPlan.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Started {currentPlan.startedAt} • 
                  <span className={`flex items-center gap-1 ${
                    currentPlan.status === 'active' && (currentPlan as any).rawExpiry && 
                    (new Date((currentPlan as any).rawExpiry).getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000
                    ? "text-destructive font-medium animate-pulse" 
                    : ""
                  }`}>
                    { (currentPlan as any).rawExpiry && (new Date((currentPlan as any).rawExpiry).getTime() < new Date().getTime()) ? "Expired on" : "Expires on" } {currentPlan.nextBilling}
                    {currentPlan.status === 'active' && (currentPlan as any).rawExpiry && 
                    (new Date((currentPlan as any).rawExpiry).getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000 &&
                    <AlertTriangle size={14} />}
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <CreditCard size={14} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{currentPlan.paymentMethod}</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">Change</Button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-foreground">
                  ₹{currentPlan.price}<span className="text-sm text-muted-foreground font-normal">/mo</span>
                </div>
                <div className="flex items-center gap-2 mt-2 justify-end">
                  <Label htmlFor="auto-renew" className="text-xs text-muted-foreground">Auto-renew</Label>
                  <Switch id="auto-renew" checked={autoRenew} onCheckedChange={setAutoRenew} />
                </div>
              </div>
            </div>

            {/* Usage Meters */}
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Users size={14} /> Users</span>
                  <span className="text-foreground font-medium">{currentPlan.currentUsers}/{currentPlan.maxUsers}</span>
                </div>
                <Progress value={userPct} className="h-2" />
                {userPct > 80 && <p className="text-[10px] text-status-idle flex items-center gap-1"><AlertTriangle size={10} /> Nearing limit — upgrade to add more</p>}
              </div>
              {/* <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><HardDrive size={14} /> Storage</span>
                  <span className="text-foreground font-medium">{currentPlan.storageUsed}/{currentPlan.storageMax} GB</span>
                </div>
                <Progress value={storagePct} className="h-2" />
              </div> */}
              {/* <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Camera size={14} /> Screenshots</span>
                  <span className="text-foreground font-medium">{currentPlan.screenshotRate}</span>
                </div>
                <Progress value={100} className="h-2" />
                <p className="text-[10px] text-muted-foreground">Max rate for this plan</p>
              </div> */}
            </div>

            {/* Plan Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setCancelDialog(true)}>
                <Ban size={12} /> Cancel Subscription
              </Button>
            </div>
          </motion.div>

          {/* Plan Comparison */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <ArrowUpDown size={14} /> Upgrade or Downgrade
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {allPlans.map(plan => {
                const isCurrent = plan.name === currentPlan.name;
                const upgrade = isUpgrade(plan);
                const downgrade = isDowngrade(plan);
                return (
                  <div key={plan.id} className={`rounded-xl border p-4 transition-all ${isCurrent ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-gradient-card hover:border-primary/30"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground text-sm">{plan.name}</h3>
                      {isCurrent && <Badge className="text-[9px] bg-primary/10 text-primary">Current</Badge>}
                      {upgrade && !isCurrent && <Badge className="text-[9px] bg-status-active/10 text-status-active">Upgrade</Badge>}
                      {downgrade && !isCurrent && <Badge className="text-[9px] bg-status-idle/10 text-status-idle">Downgrade</Badge>}
                    </div>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      ₹{plan.price}<span className="text-xs text-muted-foreground font-normal">/mo</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <div className="flex justify-between"><span>Users</span><span className="text-foreground">{plan.users}</span></div>
                      <div className="flex justify-between"><span>Storage</span><span className="text-foreground">{plan.storage}</span></div>
                      <div className="flex justify-between"><span>Retention</span><span className="text-foreground">{plan.retention}</span></div>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {plan.features.map(f => (
                        <li key={f} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                          <Check size={10} className="text-status-active mt-0.5 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={isCurrent ? "outline" : upgrade ? "default" : "secondary"}
                      size="sm"
                      className="w-full mt-3 gap-1"
                      disabled={isCurrent}
                      onClick={() => !isCurrent && setUpgradeDialog(plan)}
                    >
                      {isCurrent ? <><Check size={12} /> Current Plan</> :
                        upgrade ? <>Upgrade <ArrowRight size={12} /></> :
                          <>Downgrade</>}
                    </Button>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Payment Timeline */}
          {/* <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl bg-gradient-card border border-border p-5">
            <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <Clock size={14} className="text-primary" /> Payment Timeline
            </h2>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-3">
                {paymentEvents.map((event, i) => (
                  <div key={i} className="flex items-start gap-4 pl-0">
                    <div className={`w-6 h-6 rounded-full border-2 border-background z-10 shrink-0 flex items-center justify-center ${event.type === "success" ? "bg-status-active" : "bg-primary"
                      }`}>
                      {event.type === "success" ? <Check size={10} className="text-background" /> : <ArrowUpDown size={10} className="text-primary-foreground" />}
                    </div>
                    <div className="flex-1 flex items-center justify-between pb-3">
                      <div>
                        <p className="text-sm text-foreground">{event.event}</p>
                        <span className="text-xs text-muted-foreground">{event.date}</span>
                      </div>
                      <span className={`text-sm font-medium ${event.amount.startsWith("-") ? "text-status-active" : "text-foreground"}`}>
                        {event.amount.replace('$', '₹')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div> */}

          {/* Invoices */}
          {/* <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-gradient-card border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-primary" />
                <h2 className="font-semibold text-foreground text-sm">Invoices</h2>
              </div>
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                <Download size={12} /> Export All
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="p-3">Invoice ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-medium text-foreground font-mono text-xs">{inv.id}</td>
                      <td className="p-3 text-muted-foreground text-xs">{inv.date}</td>
                      <td className="p-3 text-muted-foreground">{inv.plan}</td>
                      <td className="p-3 text-foreground font-medium">₹{inv.amount}</td>
                      <td className="p-3">
                        <Badge className="text-[10px] bg-status-active/10 text-status-active capitalize">{inv.status}</Badge>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          <Download size={10} /> PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {invoices.length > 4 && (
              <div className="p-3 border-t border-border text-center">
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setShowAllInvoices(!showAllInvoices)}>
                  {showAllInvoices ? "Show Less" : `View All (${invoices.length})`}
                  {showAllInvoices ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </Button>
              </div>
            )}
          </motion.div> */}

          {/* Upgrade/Downgrade Dialog */}
          <Dialog open={!!upgradeDialog} onOpenChange={() => setUpgradeDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {upgradeDialog && isUpgrade(upgradeDialog) ? "Upgrade" : "Downgrade"} to {upgradeDialog?.name}
                </DialogTitle>
                <DialogDescription>
                  {upgradeDialog && isUpgrade(upgradeDialog)
                    ? "Your plan will be upgraded immediately. You'll be charged the prorated difference."
                    : "Your plan will be downgraded at the end of your current billing cycle."}
                </DialogDescription>
              </DialogHeader>
              {upgradeDialog && currentPlan && (
                <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Plan</span>
                    <span className="text-foreground">{currentPlan.name} — ₹{currentPlan.price}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">New Plan</span>
                    <span className="text-foreground font-medium">{upgradeDialog.name} — ₹{upgradeDialog.price}/mo</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Difference</span>
                    <span className={isUpgrade(upgradeDialog) ? "text-destructive font-medium" : "text-status-active font-medium"}>
                      {isUpgrade(upgradeDialog) ? "+" : "-"}₹{Math.abs(upgradeDialog.price - currentPlan.price)}/mo
                    </span>
                  </div>
                  {isDowngrade(upgradeDialog) && currentPlan.currentUsers > upgradeDialog.users && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>You currently have {currentPlan.currentUsers} users but this plan only allows {upgradeDialog.users}. You'll need to remove users before downgrading.</span>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setUpgradeDialog(null)}>Cancel</Button>
                <Button
                  variant={upgradeDialog && isUpgrade(upgradeDialog) ? "default" : "secondary"}
                  onClick={() => {
                    if (upgradeDialog && isUpgrade(upgradeDialog)) {
                      handleUpgrade(upgradeDialog);
                    } else {
                      handlePlanChange();
                    }
                  }}
                  disabled={upgradeDialog ? isDowngrade(upgradeDialog) && currentPlan!.currentUsers > upgradeDialog.users : false}
                >
                  {upgradeDialog && isUpgrade(upgradeDialog) ? "Confirm Upgrade" : "Confirm Downgrade"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Cancel Dialog */}
          <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Subscription</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel? Your plan will remain active until {currentPlan.nextBilling}, after which tracking will be paused for all team members.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">What happens when you cancel:</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      <li>• All agent tracking will be paused</li>
                      <li>• Team members will lose access after billing cycle ends</li>
                      <li>• Data is retained for 30 days, then deleted</li>
                      <li>• You can reactivate anytime to restore access</li>
                    </ul>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCancelDialog(false)}>Keep Subscription</Button>
                <Button variant="destructive" onClick={handleCancel}>Cancel Subscription</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageGuard>
    </DashboardLayout>
  );
};

export default Billing;
// Add Razorpay type definition
declare global {
  interface Window {
    Razorpay: any;
  }
}

// ... existing code ...
