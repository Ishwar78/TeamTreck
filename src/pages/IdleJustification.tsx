import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Clock, CheckCircle2, XCircle, AlertCircle, Send, FileText,
  Timer, CalendarDays, User, Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

type ReasonType = "Meeting" | "Call" | "Break" | "Other";
type RequestStatus = "pending" | "approved" | "rejected";

interface TimeClaim {
  _id: string;
  user_id: { _id: string; name: string; email: string };
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: ReasonType;
  reason: string;
  status: RequestStatus;
  rejectionReason?: string;
}

const REASON_LABELS: Record<string, string> = {
  Meeting: "Meeting",
  Call: "Phone Call",
  Break: "Break",
  Other: "Other",
};

const REASON_ICONS: Record<string, typeof Clock> = {
  Meeting: CalendarDays,
  Call: Clock,
  Break: FileText,
  Other: AlertCircle,
};

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const config = {
    pending: { label: "Pending", variant: "outline" as const, className: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10" },
    approved: { label: "Approved", variant: "outline" as const, className: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
    rejected: { label: "Rejected", variant: "destructive" as const, className: "" },
  };
  const c = config[status];
  return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
};

const IdleJustification = () => {
  const [claims, setClaims] = useState<TimeClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState("");
  const { toast } = useToast();
  const { role } = usePermissions();
  const { token } = useAuth();

  const isAdmin = role === "company_admin" || role === "sub_admin";

  useEffect(() => {
    if (token) fetchClaims();
  }, [token, isAdmin]);

  const fetchClaims = async () => {
    try {
      const endpoint = isAdmin ? "/api/claims/pending" : "/api/claims/my";
      const data = await apiFetch(endpoint, token);
      setClaims(data.claims || []);
    } catch (err: any) {
      console.error("Failed to fetch claims", err);
      toast({ title: "Error", description: "Failed to load claims", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reviewRequest = async (id: string, status: "approved" | "rejected") => {
    try {
      await apiFetch(`/api/claims/${id}/action`, token, {
        method: "PUT",
        body: JSON.stringify({
          status,
          rejectionReason: reviewNote
        })
      });

      toast({
        title: status === "approved" ? "Request Approved" : "Request Rejected",
        description: status === "approved" ? "Time claim approved." : "Time claim rejected.",
      });

      setClaims(prev => prev.filter(c => c._id !== id));
      setReviewNote("");

    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Time Claim Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin
              ? "Review and manage time claims from your team."
              : "View your submitted time claims."}
          </p>
        </div>

        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="text-amber-500" /> Pending Review
              </CardTitle>
              <CardDescription>Claims requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {claims.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No pending claims. All caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {claims.map((claim) => {
                    const ReasonIcon = REASON_ICONS[claim.type] || AlertCircle;
                    return (
                      <Card key={claim._id} className="border-amber-500/20">
                        <CardContent className="pt-4 pb-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-amber-500/10">
                                <ReasonIcon size={16} className="text-amber-500" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm flex items-center gap-2">
                                  <User size={13} className="text-muted-foreground" /> {claim.user_id?.name || "Unknown User"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {claim.date} · {claim.startTime}–{claim.endTime} ({claim.duration}m) · {REASON_LABELS[claim.type]}
                                </p>
                              </div>
                            </div>
                            <StatusBadge status={claim.status} />
                          </div>
                          <p className="text-sm text-foreground pl-11">{claim.reason}</p>
                          <Separator />
                          <div className="flex flex-col sm:flex-row gap-2 pl-11">
                            {claim.status === 'pending' && (
                              <>
                                <Textarea
                                  placeholder="Rejection reason (optional)..."
                                  className="flex-1 min-h-[40px] text-sm"
                                  value={reviewNote}
                                  onChange={(e) => setReviewNote(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => reviewRequest(claim._id, "approved")} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                                    <CheckCircle2 size={14} /> Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => reviewRequest(claim._id, "rejected")} className="gap-1.5">
                                    <XCircle size={14} /> Reject
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Recent Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim._id}>
                      <TableCell>{claim.date}</TableCell>
                      <TableCell>{claim.type}</TableCell>
                      <TableCell><StatusBadge status={claim.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default IdleJustification;
