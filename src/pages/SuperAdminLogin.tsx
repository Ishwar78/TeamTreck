import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const SuperAdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setIsLoading(true);

    const result = await login(email, password, "super_admin");

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Login failed");
      return;
    }

    toast({
      title: "Login Successful",
      description: "Welcome Super Admin",
    });

    navigate("/super-admin");
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center px-4" style={{ background: 'linear-gradient(to right, #135F80, #2C7862)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-xl bg-gradient-card border border-border p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={24} className="text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Super Admin Portal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Platform management access only
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                className="mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              className="w-full gap-2"
              size="lg"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Sign In as Super Admin"}
              {!isLoading && <ArrowRight size={16} />}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;
