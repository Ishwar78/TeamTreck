import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, AlertTriangle, Building2, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    try {
      setIsLoading(true);
      
      const result = await apiFetch("/api/auth/forgot-password", "", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() })
      });

      setIsLoading(false);

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Email Sent",
          description: "If the email is registered, you will receive password reset instructions.",
        });
      } else {
        setError(result.error || "Failed to send reset email.");
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
                Forgot Password
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your email to receive reset instructions
              </p>
            </div>

            {isSuccess ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-emerald-500/10 p-4 flex flex-col items-center justify-center text-center gap-3">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-emerald-500">
                      Check your email
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      We sent a password reset link to <strong>{email}</strong>
                    </p>
                  </div>
                </div>
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link to="/login">Return to Login</Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* EMAIL */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className="mt-1.5"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
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
                  {isLoading ? "Sending..." : "Send Reset Link"}
                  {!isLoading && <ArrowRight size={16} />}
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="text-primary hover:underline"
                  >
                    Login
                  </Link>
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
