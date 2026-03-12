import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2, User, CreditCard, Users, Check, ArrowRight, ArrowLeft,
  Eye, EyeOff, Plus, X, Rocket, Globe, Shield, Camera, Clock,
  Mail, Briefcase, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

// ─── Types ───
interface CompanyData {
  name: string;
  website: string;
  industry: string;
  size: string;
  country: string;
}

interface AdminData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface PlanData {
  selectedPlan: string;
}

interface InviteData {
  invites: { email: string; role: string }[];
}

const API = import.meta.env.VITE_API_BASE_URL;
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

interface BackendPlan {
  id: string;
  name: string;
  price: number;
  users: number;
  features: string[];
  popular?: boolean;
}

type StepId = "company" | "admin" | "plan" | "invite" | "complete";

const steps: { id: StepId; label: string; icon: React.ElementType }[] = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "admin", label: "Admin Account", icon: User },
  { id: "plan", label: "Select Plan", icon: CreditCard },
  { id: "invite", label: "Invite Team", icon: Users },
  { id: "complete", label: "Complete", icon: Rocket },
];

const industries = [
  "Technology", "Finance", "Healthcare", "Education", "Marketing",
  "Consulting", "E-commerce", "Manufacturing", "Media", "Other",
];

const companySizes = ["1-10", "11-25", "26-50", "51-100", "100+"];

// ─── Step Components ───
const CompanyStep = ({ data, onChange }: { data: CompanyData; onChange: (d: CompanyData) => void }) => (
  <div className="space-y-5">
    <div className="text-center mb-6">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Building2 size={24} className="text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Set up your company</h2>
      <p className="text-sm text-muted-foreground mt-1">Tell us about your organization</p>
    </div>

    <div>
      <Label htmlFor="company-name">Company Name *</Label>
      <Input
        id="company-name"
        placeholder="Acme Corp"
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        className="mt-1.5"
      />
    </div>

    <div>
      <Label htmlFor="website">Website</Label>
      <div className="relative mt-1.5">
        <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="website"
          placeholder="https://acme.com"
          value={data.website}
          onChange={(e) => onChange({ ...data, website: e.target.value })}
          className="pl-9"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Industry *</Label>
        <Select value={data.industry} onValueChange={(v) => onChange({ ...data, industry: v })}>
          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select industry" /></SelectTrigger>
          <SelectContent>
            {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Company Size *</Label>
        <Select value={data.size} onValueChange={(v) => onChange({ ...data, size: v })}>
          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Employees" /></SelectTrigger>
          <SelectContent>
            {companySizes.map(s => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>

    <div>
      <Label>Country</Label>
      <div className="relative mt-1.5">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="United States"
          value={data.country}
          onChange={(e) => onChange({ ...data, country: e.target.value })}
          className="pl-9"
        />
      </div>
    </div>
  </div>
);

const AdminStep = ({ data, onChange }: { data: AdminData; onChange: (d: AdminData) => void }) => {
  const [showPass, setShowPass] = useState(false);
  const passwordMatch = data.password === data.confirmPassword && data.confirmPassword.length > 0;
  const passwordStrong = data.password.length >= 8;

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Shield size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Create admin account</h2>
        <p className="text-sm text-muted-foreground mt-1">You'll be the Company Admin with full control</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first-name">First Name *</Label>
          <Input id="first-name" placeholder="Jane" value={data.firstName} onChange={(e) => onChange({ ...data, firstName: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="last-name">Last Name *</Label>
          <Input id="last-name" placeholder="Smith" value={data.lastName} onChange={(e) => onChange({ ...data, lastName: e.target.value })} className="mt-1.5" />
        </div>
      </div>

      <div>
        <Label htmlFor="admin-email">Email *</Label>
        <div className="relative mt-1.5">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input id="admin-email" type="email" placeholder="jane@acme.com" value={data.email} onChange={(e) => onChange({ ...data, email: e.target.value })} className="pl-9" />
        </div>
      </div>

      <div>
        <Label htmlFor="admin-password">Password *</Label>
        <div className="relative mt-1.5">
          <Input id="admin-password" type={showPass ? "text" : "password"} placeholder="Min 8 characters" value={data.password} onChange={(e) => onChange({ ...data, password: e.target.value })} />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {data.password.length > 0 && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className={`h-1 flex-1 rounded-full ${passwordStrong ? "bg-status-active" : "bg-destructive"}`} />
            <span className={`text-[10px] ${passwordStrong ? "text-status-active" : "text-destructive"}`}>
              {passwordStrong ? "Strong" : "Too short"}
            </span>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="confirm-password">Confirm Password *</Label>
        <Input id="confirm-password" type="password" placeholder="Re-enter password" value={data.confirmPassword} onChange={(e) => onChange({ ...data, confirmPassword: e.target.value })} className="mt-1.5" />
        {data.confirmPassword.length > 0 && !passwordMatch && (
          <p className="text-[11px] text-destructive mt-1">Passwords don't match</p>
        )}
        {passwordMatch && (
          <p className="text-[11px] text-status-active mt-1 flex items-center gap-1"><Check size={10} /> Passwords match</p>
        )}
      </div>

      <div className="rounded-lg bg-secondary/30 border border-border p-3">
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Shield size={12} className="text-primary shrink-0" />
          You will be assigned the <strong className="text-foreground">Company Admin</strong> role with full access to settings, team management, and billing.
        </p>
      </div>
    </div>
  );
};

const PlanStep = ({ data, onChange, plans, loading }: { data: PlanData; onChange: (d: PlanData) => void; plans: BackendPlan[]; loading: boolean }) => (
  <div className="space-y-5">
    <div className="text-center mb-6">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <CreditCard size={24} className="text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Choose your plan</h2>
      <p className="text-sm text-muted-foreground mt-1">All plans include a 14-day free trial</p>
    </div>

    {loading ? (
      <div className="flex justify-center py-10 text-muted-foreground">Loading plans...</div>
    ) : plans.length === 0 ? (
      <div className="flex justify-center py-10 text-muted-foreground">No plans available. Contact support.</div>
    ) : (
      <div className="grid sm:grid-cols-2 gap-3">
        {plans.map(plan => {
          const isSelected = data.selectedPlan === plan.id;
          return (
            <motion.button
              key={plan.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange({ selectedPlan: plan.id })}
              className={`text-left rounded-xl border p-4 transition-all ${isSelected
                ? "border-primary bg-primary/5 shadow-glow ring-1 ring-primary/30"
                : "border-border bg-gradient-card hover:border-primary/30"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">{plan.name}</h3>
                <div className="flex items-center gap-1.5">
                  {plan.popular && <Badge className="text-[9px] bg-primary/10 text-primary">Popular</Badge>}
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check size={12} className="text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ${plan.price}<span className="text-xs text-muted-foreground font-normal">/mo</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {(plan.features ?? []).map(f => (
                  <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Check size={10} className="text-status-active mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </motion.button>
          );
        })}
      </div>
    )}

    <div className="rounded-lg bg-secondary/30 border border-border p-3 text-center">
      <p className="text-xs text-muted-foreground">
        🎉 <strong className="text-foreground">14-day free trial</strong> on all plans. No credit card required to start.
      </p>
    </div>
  </div>
);

const InviteStep = ({ data, onChange }: { data: InviteData; onChange: (d: InviteData) => void }) => {
  const addInvite = () => onChange({ invites: [...data.invites, { email: "", role: "user" }] });
  const removeInvite = (i: number) => onChange({ invites: data.invites.filter((_, idx) => idx !== i) });
  const updateInvite = (i: number, field: "email" | "role", value: string) => {
    const updated = [...data.invites];
    updated[i] = { ...updated[i], [field]: value };
    onChange({ invites: updated });
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Users size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Invite your team</h2>
        <p className="text-sm text-muted-foreground mt-1">Add team members now or skip and do it later</p>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {data.invites.map((invite, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 items-start"
            >
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={invite.email}
                  onChange={(e) => updateInvite(i, "email", e.target.value)}
                />
              </div>
              <Select value={invite.role} onValueChange={(v) => updateInvite(i, "role", v)}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="sub_admin">Sub-Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeInvite(i)}>
                <X size={14} />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Button variant="outline" size="sm" onClick={addInvite} className="gap-1 w-full">
        <Plus size={14} /> Add team member
      </Button>

      {data.invites.length > 0 && data.invites.some(i => i.email) && (
        <div className="rounded-lg bg-secondary/30 border border-border p-3">
          <p className="text-xs text-muted-foreground">
            <Mail size={12} className="inline mr-1.5 text-primary" />
            {data.invites.filter(i => i.email).length} invitation(s) will be sent after setup is complete.
          </p>
        </div>
      )}
    </div>
  );
};

const CompleteStep = ({ companyData, planData, inviteData, plans }: { companyData: CompanyData; planData: PlanData; inviteData: InviteData; plans: BackendPlan[] }) => {
  const selectedPlan = plans.find(p => p.id === planData.selectedPlan);
  const inviteCount = inviteData.invites.filter(i => i.email).length;

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-2xl bg-status-active/10 flex items-center justify-center mx-auto mb-4"
        >
          <Rocket size={32} className="text-status-active" />
        </motion.div>
        <h2 className="text-xl font-bold text-foreground">You're all set! 🎉</h2>
        <p className="text-sm text-muted-foreground mt-1">Your company is ready to start monitoring</p>
      </div>

      <div className="rounded-xl bg-gradient-card border border-border p-5 space-y-4">
        <h3 className="text-sm font-medium text-foreground">Setup Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Company</span>
            <p className="text-foreground font-medium">{companyData.name}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Industry</span>
            <p className="text-foreground">{companyData.industry}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Plan</span>
            <p className="text-foreground font-medium">{selectedPlan?.name} — ${selectedPlan?.price}/mo</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Team Invites</span>
            <p className="text-foreground">{inviteCount > 0 ? `${inviteCount} pending` : "None yet"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-card border border-border p-5 space-y-3">
        <h3 className="text-sm font-medium text-foreground">Next Steps</h3>
        {[
          { icon: Camera, text: "Download the desktop agent for your team", done: false },
          { icon: Users, text: "Invite remaining team members", done: inviteCount > 0 },
          { icon: Clock, text: "Configure monitoring rules (idle timeout, screenshot frequency)", done: false },
          { icon: Briefcase, text: "Set up project/department structure", done: false },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-status-active/10" : "bg-secondary"}`}>
              {step.done ? <Check size={12} className="text-status-active" /> : <step.icon size={12} className="text-muted-foreground" />}
            </div>
            <span className={step.done ? "text-muted-foreground line-through" : "text-foreground"}>{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Wizard ───
const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planQueryId = searchParams.get("plan");
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [companyData, setCompanyData] = useState<CompanyData>({ name: "", website: "", industry: "", size: "", country: "" });
  const [adminData, setAdminData] = useState<AdminData>({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [planData, setPlanData] = useState<PlanData>({ selectedPlan: "" });
  const [inviteData, setInviteData] = useState<InviteData>({ invites: [{ email: "", role: "user" }] });
  const [processing, setProcessing] = useState(false);
  const [plans, setPlans] = useState<BackendPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Fetch plans from backend on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API}/api/public/plans`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          // If a plan was explicitly passed, filter other plans out or select it
          if (planQueryId) {
            const specificPlan = data.data.find((p: BackendPlan) => p.id === planQueryId);
            if (specificPlan) {
              setPlans([specificPlan]); // ONLY show the selected plan
              setPlanData({ selectedPlan: specificPlan.id });
            } else {
              setPlans(data.data);
              setPlanData({ selectedPlan: data.data[0].id });
            }
          } else {
            setPlans(data.data);
            const popular = data.data.find((p: BackendPlan) => p.popular);
            setPlanData({ selectedPlan: popular ? popular.id : data.data[0].id });
          }
        }
      } catch (err) {
        console.error("Failed to fetch plans", err);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return companyData.name.trim() !== "" && companyData.industry !== "" && companyData.size !== "";
      case 1: return adminData.firstName.trim() !== "" && adminData.lastName.trim() !== "" && adminData.email.trim() !== "" && adminData.password.length >= 8 && adminData.password === adminData.confirmPassword;
      case 2: return planData.selectedPlan !== "";
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    // When moving from Plan step (2) to Invite step (3), trigger registration + Razorpay
    if (currentStep === 2) {
      handleComplete();
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // const handleComplete = () => {
  //   toast({
  //     title: "Welcome to WEBMOK!",
  //     description: `${companyData.name} is ready. Redirecting to your dashboard...`,
  //   });
  //   setTimeout(() => navigate("/dashboard"), 1500);
  // };







  //   const handleComplete = async () => {
  //   try {
  //     const response = await fetch("http://localhost:5000/api/company/register", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         companyName: companyData.name,
  //         domain: companyData.website
  //           ? new URL(companyData.website).hostname
  //           : companyData.name.toLowerCase().replace(/\s+/g, ""),
  //         adminName: `${adminData.firstName} ${adminData.lastName}`,
  //         email: adminData.email,
  //         password: adminData.password,
  //       }),
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(data.message || "Registration failed");
  //     }

  //     toast({
  //       title: "Company Registered Successfully!",
  //       description: "Logging you in...",
  //     });

  //     // Auto login after registration
  //     const loginRes = await fetch("http://localhost:5000/api/auth/login", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         email: adminData.email,
  //         password: adminData.password,
  //         device_id: crypto.randomUUID(),
  //         device_name: "Web Browser",
  //         os: navigator.platform,
  //       }),
  //     });

  //     const loginData = await loginRes.json();

  //     if (!loginRes.ok) {
  //       throw new Error(loginData.message || "Login failed");
  //     }

  //     // Save token
  //     localStorage.setItem("token", loginData.token);
  //     localStorage.setItem("user", JSON.stringify(loginData.user));

  //     toast({
  //       title: "Welcome!",
  //       description: "Redirecting to dashboard...",
  //     });

  //     setTimeout(() => navigate("/dashboard"), 1200);
  //   } catch (error: any) {
  //     toast({
  //       title: "Error",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   }
  // };




  const handleComplete = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      /* ================= 1️⃣ REGISTER COMPANY ================= */

      const registerRes = await fetch(`${API}/api/company/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyData.name,
          domain: companyData.website
            ? companyData.website.replace(/^https?:\/\//, "")
            : companyData.name.toLowerCase().replace(/\s+/g, ""),
          adminName: `${adminData.firstName} ${adminData.lastName}`,
          email: adminData.email,
          password: adminData.password,
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        throw new Error(registerData.message || "Registration failed");
      }

      const companyId = registerData.company;

      /* ================= 2️⃣ FIND SELECTED PLAN ================= */

      const selectedPlan = plans.find((p) => p.id === planData.selectedPlan);

      if (!selectedPlan) {
        throw new Error("Please select a plan before continuing.");
      }

      /* ================= 3️⃣ BYPASS PAYMENT FOR FREE PLANS ================= */
      if (selectedPlan.price === 0) {
        // Directly auto-login and complete step since it's free
        const loginRes = await fetch(`${API}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: adminData.email,
            password: adminData.password,
            device_id: crypto.randomUUID(),
            device_name: "Web Browser",
            os: navigator.platform,
          }),
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          throw new Error(loginData.message || "Auto-login failed after registration.");
        }

        localStorage.setItem("token", loginData.token);
        if (loginData.refreshToken) {
          localStorage.setItem("refreshToken", loginData.refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(loginData.user));

        toast({
          title: "Registration Successful 🎉",
          description: "Your free plan is active.",
        });

        setProcessing(false);
        setCurrentStep(4);
        return;
      }

      /* ================= 4️⃣ CREATE ORDER (PAID PLANS ONLY) ================= */

      const orderRes = await fetch(`${API}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          companyId,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || "Payment initialization failed");
      }

      const order = orderData.order;

      if (!RAZORPAY_KEY) {
        throw new Error("Razorpay key missing in environment. Add VITE_RAZORPAY_KEY_ID to .env");
      }

      /* ================= 5️⃣ OPEN RAZORPAY ================= */

      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "Web Mok",
        description: "Subscription Payment",
        order_id: order.id,

        handler: async function (response: any) {
          /* ================= 6️⃣ VERIFY PAYMENT ================= */

          const verifyRes = await fetch(`${API}/api/payment/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              companyId,
              planId: selectedPlan.id,
            }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok || !verifyData.success) {
            toast({
              title: "Error",
              description: "Payment verification failed",
              variant: "destructive",
            });
            setProcessing(false);
            return;
          }

          /* ================= 7️⃣ AUTO LOGIN ================= */

          const loginRes = await fetch(`${API}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: adminData.email,
              password: adminData.password,
              device_id: crypto.randomUUID(),
              device_name: "Web Browser",
              os: navigator.platform,
            }),
          });

          const loginData = await loginRes.json();

          if (!loginRes.ok) {
            throw new Error(loginData.message || "Login failed");
          }

          localStorage.setItem("token", loginData.token);
          localStorage.setItem("refreshToken", loginData.refreshToken);
          localStorage.setItem("user", JSON.stringify(loginData.user));

          toast({
            title: "Payment Successful 🎉",
            description: "Your subscription is active!",
          });

          setProcessing(false);
          // Move to the Complete step after successful payment
          setCurrentStep(4);
        },

        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "You can try again.",
              variant: "destructive",
            });
          },
        },

        theme: { color: "#3B82F6" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      setProcessing(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const renderStep = () => {
    switch (currentStep) {
      case 0: return <CompanyStep data={companyData} onChange={setCompanyData} />;
      case 1: return <AdminStep data={adminData} onChange={setAdminData} />;
      case 2: return <PlanStep data={planData} onChange={setPlanData} plans={plans} loading={plansLoading} />;
      case 3: return <InviteStep data={inviteData} onChange={setInviteData} />;
      case 4: return <CompleteStep companyData={companyData} planData={planData} inviteData={inviteData} plans={plans} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-2xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < currentStep ? "bg-status-active text-background" :
                    i === currentStep ? "bg-primary text-primary-foreground shadow-glow" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                    {i < currentStep ? <Check size={14} /> : <step.icon size={14} />}
                  </div>
                  <span className={`text-xs hidden sm:block ${i === currentStep ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}>
                    {step.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={`w-6 lg:w-12 h-px mx-1 ${i < currentStep ? "bg-status-active" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          {/* Step Content */}
          <motion.div
            className="rounded-xl bg-gradient-card border border-border p-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ArrowLeft size={14} /> Back
              </Button>

              <div className="flex items-center gap-2">
                {currentStep === 3 && (
                  <Button variant="ghost" onClick={handleNext} className="text-muted-foreground">
                    Skip for now
                  </Button>
                )}
                {isLastStep ? (
                  <Button onClick={() => navigate("/dashboard")} className="gap-1" size="lg">
                    <Rocket size={14} /> Go to Dashboard
                  </Button>
                ) : (
                  <Button onClick={handleNext} disabled={!canProceed() || processing} className="gap-1">
                    {processing ? "Processing..." : <>Continue <ArrowRight size={14} /></>}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
