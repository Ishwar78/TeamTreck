import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import axios from "axios";
import { PageGuard } from "@/components/RoleGuard";

const API_BASE = import.meta.env.VITE_API_BASE_URL;


const TimeClaim = () => {
    const { token } = useAuth();
    const { toast } = useToast();
    const [claims, setClaims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectDialog, setRejectDialog] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const fetchClaims = async () => {
        try {

            const res = await axios.get(`${API_BASE}/api/claims/pending`, {
  headers: { Authorization: `Bearer ${token}` }
});
            // const res = await axios.get("http://localhost:5000/api/claims/pending", {
            //     headers: { Authorization: `Bearer ${token}` }
            // });
            if (res.data.claims) setClaims(res.data.claims);
        } catch (error) {
            console.error("Failed to fetch claims", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchClaims();
    }, [token]);

    const handleAction = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
        try {
            // await axios.put(`http://localhost:5000/api/claims/${id}/action`, 
                await axios.put(`${API_BASE}/api/claims/${id}/action`, {
                status,
                rejectionReason: reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast({ title: `Claim ${status}`, description: `Time claim has been ${status}.` });
            setRejectDialog(null);
            setRejectionReason("");
            fetchClaims(); // Refresh list
        } catch (error) {
            toast({ title: "Error", description: "Failed to update claim", variant: "destructive" });
        }
    };

    return (
        <DashboardLayout>
            <PageGuard permission="manage_team">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                            <Clock className="text-primary" /> Time Claims
                        </h1>
                        <p className="text-muted-foreground">Review and approve manual time entry requests from employees.</p>
                    </div>

                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle>Pending Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading...</div>
                            ) : claims.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                                    <CheckCircle2 size={48} className="text-green-500/20 mb-4" />
                                    <p>All caught up! No pending claims.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {claims.map((claim) => (
                                            <TableRow key={claim._id}>
                                                <TableCell>
                                                    <div className="font-medium">{claim.user_id.name}</div>
                                                    <div className="text-xs text-muted-foreground">{claim.user_id.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{claim.date}</div>
                                                    <div className="text-xs text-muted-foreground">{claim.startTime} - {claim.endTime}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{claim.type}</Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={claim.reason}>
                                                    {claim.reason}
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {Math.floor(claim.duration / 60)}h {claim.duration % 60}m
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-500 hover:text-green-400 hover:bg-green-500/10 border-green-500/20"
                                                            onClick={() => handleAction(claim._id, 'approved')}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/20"
                                                            onClick={() => setRejectDialog(claim._id)}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Reject Dialog */}
                    <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reject Claim</DialogTitle>
                                <DialogDescription>Please provide a reason for rejecting this time claim.</DialogDescription>
                            </DialogHeader>
                            <Textarea
                                placeholder="Reason for rejection..."
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                            />
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setRejectDialog(null)}>Cancel</Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => rejectDialog && handleAction(rejectDialog, 'rejected', rejectionReason)}
                                    disabled={!rejectionReason.trim()}
                                >
                                    Confirm Rejection
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </PageGuard>
        </DashboardLayout>
    );
};

export default TimeClaim;
