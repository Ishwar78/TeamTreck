import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface OtpVerificationProps {
  phone: string;
  onVerified: () => void;
  onCancel?: () => void;
}

const OtpVerification = ({ phone, onVerified, onCancel }: OtpVerificationProps) => {
  const { pendingOtp, verifyOtp, sendOtp } = useAuth();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [showCode, setShowCode] = useState(true);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("Please enter the 6-digit OTP."); return; }
    const result = verifyOtp(phone, otp);
    if (result.success) {
      onVerified();
    } else {
      setError(result.error || "Verification failed.");
    }
  };

  const handleResend = () => {
    sendOtp(phone);
    setCountdown(30);
    setOtp("");
    setError("");
    setShowCode(true);
  };

  const maskedPhone = phone.slice(0, -4).replace(/./g, "•") + phone.slice(-4);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
      <div className="rounded-xl bg-gradient-card border border-border p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Verify Your Phone</h2>
          <p className="text-sm text-muted-foreground mt-1">
            OTP sent to <span className="font-mono text-foreground">{maskedPhone}</span>
          </p>
        </div>

        {/* Demo: show the OTP code */}
        {pendingOtp && showCode && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-4 text-center">
            <p className="text-[10px] font-medium text-primary mb-1">Demo: Your OTP Code</p>
            <p className="text-2xl font-bold font-mono tracking-[0.3em] text-foreground">{pendingOtp.code}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <Label htmlFor="otp">Enter 6-digit OTP</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1.5 text-center text-lg font-mono tracking-[0.3em]"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle size={14} /> {error}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" size="lg" disabled={otp.length !== 6}>
            <ShieldCheck size={16} /> Verify OTP
          </Button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline flex items-center gap-1"
            >
              <RefreshCw size={12} /> {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default OtpVerification;
