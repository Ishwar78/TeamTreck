import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Building2, AlertTriangle, ArrowRight, UserPlus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Simplified role labels helper
const ROLE_LABELS: Record<string, string> = {
    admin: "Administrator",
    sub_admin: "Sub Admin",
    employee: "Employee",
    user: "User"
};

const SignUp = () => {
    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get('token');

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        password: ""
    });

    const [inviteData, setInviteData] = useState<any>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingInvite, setIsFetchingInvite] = useState(false);

    const navigate = useNavigate();

    // Load invite details if token exists
    useEffect(() => {
        if (inviteToken) {
            fetchInviteDetails();
        }
    }, [inviteToken]);

    const fetchInviteDetails = async () => {
        setIsFetchingInvite(true);
        try {
            // const res = await fetch(`http://localhost:5000/api/auth/invite/${inviteToken}`);
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/invite/${inviteToken}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Invalid invitation");

            setInviteData(data.invitation);
            setFormData(prev => ({
                ...prev,
                email: data.invitation.email,
                companyName: data.invitation.companyName
            }));

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsFetchingInvite(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation based on mode
        if (inviteToken) {
            if (!formData.name || !formData.password || !formData.phone) {
                setError("Name, Phone, and Password are required");
                return;
            }
        } else {
            if (!formData.name || !formData.companyName || !formData.email || !formData.password) {
                setError("All fields are required");
                return;
            }
        }

        try {
            setIsLoading(true);

            // let url = "http://localhost:5000/api/company/register";
            let url = `${import.meta.env.VITE_API_BASE_URL}/api/company/register`;
            let body: any = {};

            if (inviteToken) {
                // Determine endpoint for accepting invite
                // Assuming existing endpoint /api/auth/accept-invite handles this
                // url = "http://localhost:5000/api/auth/accept-invite";
                url = `${import.meta.env.VITE_API_BASE_URL}/api/auth/accept-invite`;
                body = {
                    token: inviteToken,
                    name: formData.name,
                    password: formData.password,
                    phone: formData.phone
                };
            } else {
                // New Company Registration
                body = {
                    adminName: formData.name,
                    companyName: formData.companyName,
                    domain: formData.companyName.toLowerCase().replace(/\s+/g, '-') + ".com",
                    email: formData.email,
                    password: formData.password
                };
            }

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Registration failed");
            }

            toast({
                title: inviteToken ? "Invitation Accepted" : "Registration Successful",
                description: inviteToken ? "Your account is active. Please login." : "Please login with your new account.",
            });

            navigate("/admin/login");

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (inviteToken && isFetchingInvite) {
        return (
            <div className="min-h-screen text-white flex items-center justify-center" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (inviteToken && error && !inviteData) {
        return (
            <div className="min-h-screen text-white flex items-center justify-center flex-col gap-4" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <p className="text-xl text-foreground font-semibold">Invitation Error</p>
                <p className="text-muted-foreground">{error}</p>
                <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white flex flex-col" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
            <Navbar />

            <div className="flex-1 flex items-center justify-center px-4 pt-16">
                <div className="w-full max-w-md">
                    <div className="rounded-xl bg-gradient-card border border-border p-8">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                {inviteToken ? <UserPlus size={24} className="text-primary" /> : <Building2 size={24} className="text-primary" />}
                            </div>

                            <h1 className="text-2xl font-bold text-foreground">
                                {inviteToken ? "Join Team" : "Create Account"}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {inviteToken
                                    ? `You've been invited to join ${inviteData?.companyName || 'a workspace'}`
                                    : "Start your journey with Workwise Hub"}
                            </p>

                            {inviteToken && inviteData && (
                                <Badge className="mt-2 text-xs" variant="secondary">
                                    Role: {ROLE_LABELS[inviteData.role] || inviteData.role}
                                </Badge>
                            )}
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {/* Name */}
                            <div>
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    className="mt-1.5"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Company Name - ReadOnly if Invite */}
                            {!inviteToken && (
                                <div>
                                    <Label htmlFor="companyName">Company Name</Label>
                                    <Input
                                        id="companyName"
                                        type="text"
                                        placeholder="Acme Inc."
                                        className="mt-1.5"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                    />
                                </div>
                            )}

                            {/* Email - ReadOnly if Invite */}
                            <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    className="mt-1.5"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={!!inviteToken} // Disable if inviting
                                />
                            </div>

                            {/* Phone - Only if Invite (or add to create if needed) */}
                            {inviteToken && (
                                <div>
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="text"
                                        placeholder="+1 234 567 890"
                                        className="mt-1.5"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            )}

                            {/* Password */}
                            <div>
                                <Label htmlFor="password">Password</Label>
                                <div className="relative mt-1.5">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={16} />
                                        ) : (
                                            <Eye size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && !isFetchingInvite && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertTriangle size={14} /> {error}
                                </p>
                            )}

                            {/* Submit */}
                            <Button
                                className="w-full gap-2"
                                size="lg"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? "Processing..." : (inviteToken ? "Accept Invitation" : "Sign Up")}
                                {!isLoading && <ArrowRight size={16} />}
                            </Button>
                        </form>

                        <p className="text-center text-sm text-muted-foreground mt-4">
                            {inviteToken ? "Already accepted?" : "Already have an account?"}{" "}
                            <Link
                                to="/admin/login"
                                className="text-primary hover:underline"
                            >
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
