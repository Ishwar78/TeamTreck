// COMPLETE CLEAN PRODUCTION VERSION

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Monitor,
  Phone
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import { ROLE_LABELS } from "@/lib/permissions";


const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token) fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      const res = await fetch(`${API_URL}/invite/${token}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setInvite(data.invitation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Name required");
    if (!phone.trim()) return setError("Phone required");
    if (password.length < 6)
      return setError("Password must be minimum 6 characters");
    if (password !== confirmPassword)
      return setError("Passwords do not match");

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/accept-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name,
          password,
          phone
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast({
        title: "Account Activated",
        description: "You can now login"
      });

      navigate("/login");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {error}
      </div>
    );
  }

  if (invite?.status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Invitation Expired
      </div>
    );
  }

  if (invite?.status === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Invitation Already Used
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md border rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-center mb-4">
            Accept Invitation
          </h2>

          <p className="text-sm text-center mb-4">
            Join <b>{invite?.companyName}</b>
          </p>

          <Badge className="mb-4">
            {ROLE_LABELS[invite?.role]}
          </Badge>

          <form onSubmit={handleSubmit} className="space-y-4">

            <Input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <Button type="submit" className="w-full">
              Activate Account
            </Button>

          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AcceptInvite;
