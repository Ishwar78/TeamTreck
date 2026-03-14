import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2, AlertTriangle, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If no token, show an error state instantly
  if (!token) {
    return (
      <div className="min-h-screen text-white flex flex-col" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 pt-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="rounded-xl bg-gradient-card border border-border p-8 text-center">
              <AlertTriangle size={48} className="text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Reset Link</h1>
              <p className="text-sm text-muted-foreground mb-6">
                The password reset link is invalid or has expired. Please request a new one.
              </p>
              <Button asChild className="w-full">
                <Link to="/forgot-password">Request New Link</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setIsLoading(true);
      
      const result = await apiFetch("/api/auth/reset-password", "", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password })
      });

      setIsLoading(false);

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Success",
          description: "Your password has been successfully reset.",
        });
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(result.error || "Failed to reset password.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="rounded-xl bg-gradient-card border border-border p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Building2 size={24} className="text-primary" />
              </div>

              <h1 className="text-2xl font-bold text-foreground">
                Set New Password
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your new password below
              </p>
            </div>

            {isSuccess ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-emerald-500/10 p-5 flex flex-col items-center justify-center text-center gap-3">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                  <div>
                    <h3 className="text-emerald-500 font-bold mb-1">Password Updated</h3>
                    <p className="text-sm text-muted-foreground">
                      You will be redirected to the login page shortly...
                    </p>
                  </div>
                </div>
                <Button asChild className="w-full mt-4">
                  <Link to="/login">Go to Login</Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* NEW PASSWORD */}
                <div>
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* ERROR */}
                {error && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle size={14} /> {error}
                  </p>
                )}

                {/* SUBMIT BUTTON */}
                <Button
                  className="w-full gap-2 mt-4"
                  size="lg"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
