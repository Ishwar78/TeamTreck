import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import axios from "axios";

const UserTimeClaim = () => {
    const { token } = useAuth();
    const { toast } = useToast();
    const [claims, setClaims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "",
        endTime: "",
        type: "Other",
        reason: ""
    });

    const [timeline, setTimeline] = useState<any[]>([]);
    const [timelineLoading, setTimelineLoading] = useState(false);

    const fetchClaims = async () => {
        try {
            const data = await apiFetch("/api/claims/my", token);
            if (data.claims) setClaims(data.claims);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeline = async () => {
        if (!token || !formData.date) return;
        setTimelineLoading(true);
        try {
            // Get detailed attendance for the selected date
            const data = await apiFetch(`/api/reports/attendance?startDate=${formData.date}&endDate=${formData.date}&detailed=true`, token);
            if (data.success && data.data.length > 0) {
                setTimeline(data.data[0].timeline || []);
            } else {
                setTimeline([]);
            }
        } catch (error) {
            console.error("Failed to fetch timeline", error);
            setTimeline([]);
        } finally {
            setTimelineLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchClaims();
            fetchTimeline();
        }
    }, [token, formData.date]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiFetch("/api/claims", token, {
                method: "POST",
                body: JSON.stringify(formData)
            });
            toast({ title: "Claim Submitted", description: "Your time claim has been sent for approval." });
            setFormData({ ...formData, startTime: "", endTime: "", reason: "" });
            fetchClaims();
        } catch (error: any) {
            const errorMsg = error.message || "Could not submit claim";
            toast({
                title: "Submission Failed",
                description: errorMsg,
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return "text-green-500 bg-green-500/10 border-green-500/20";
            case 'rejected': return "text-red-500 bg-red-500/10 border-red-500/20";
            default: return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
        }
    };

    // Helper to render the horizontal timeline
    const ActivityTimeline = () => {
        if (timelineLoading) return <div className="h-12 flex items-center justify-center text-xs text-muted-foreground">Loading activity...</div>;
        if (timeline.length === 0) return <div className="h-12 flex items-center justify-center text-xs text-muted-foreground bg-secondary/10 rounded border border-dashed">No activity recorded for this date</div>;

        // Find min/max time to calculate relative widths
        const startTs = new Date(timeline[0].start).getTime();
        const endTs = new Date(timeline[timeline.length - 1].end).getTime();
        const totalDuration = endTs - startTs;

        return (
            <div className="space-y-4">
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                    <span>{format(new Date(startTs), "hh:mm a")}</span>
                    <span className="font-semibold text-primary">Daily Session Activity</span>
                    <span>{format(new Date(endTs), "hh:mm a")}</span>
                </div>
                <div className="h-8 w-full flex rounded-lg overflow-hidden border border-border shadow-inner bg-secondary/20 relative group">
                    {timeline.map((seg, idx) => {
                        const segStart = new Date(seg.start).getTime();
                        const segEnd = new Date(seg.end).getTime();
                        const width = ((segEnd - segStart) / totalDuration) * 100;
                        const bgColor = seg.type === 'Work' ? "bg-green-500/80 hover:bg-green-400" : "bg-red-500/80 hover:bg-red-400";
                        const timeRange = `${format(new Date(segStart), "hh:mm a")} - ${format(new Date(segEnd), "hh:mm a")}`;

                        return (
                            <div
                                key={idx}
                                className={`h-full ${bgColor} transition-colors relative cursor-help transition-all duration-200`}
                                style={{ width: `${width}%` }}
                                title={`${seg.type}: ${timeRange} (${seg.duration})`}
                            />
                        );
                    })}
                </div>
                <div className="flex gap-4 justify-center">
                    <div className="flex items-center gap-1.5 text-[10px]">
                        <div className="w-2.5 h-2.5 rounded bg-green-500/80"></div>
                        <span className="text-muted-foreground">Tracked Work</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                        <div className="w-2.5 h-2.5 rounded bg-red-500/80"></div>
                        <span className="text-muted-foreground">Offline / Untracked</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Timeline Section */}
            <Card className="border-border/50 bg-secondary/5">
                <CardContent className="p-6">
                    <ActivityTimeline />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submit Form */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="text-primary" /> Request Time Claim
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={v => setFormData({ ...formData, type: v })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Meeting">Meeting</SelectItem>
                                        <SelectItem value="Call">Call</SelectItem>
                                        <SelectItem value="Break">Break</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Reason / Description</Label>
                                <Textarea
                                    placeholder="Explain why this time wasn't tracked..."
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={submitting}>
                                {submitting ? "Submitting..." : "Submit Claim"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Claims History */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>My Claims History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading claims...</div>
                        ) : claims.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-secondary/20 rounded-lg border border-dashed border-border">
                                No claims submitted yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {claims.map(claim => (
                                    <div key={claim._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-secondary/10 border border-border gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground">{claim.date}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({claim.startTime} - {claim.endTime})
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{claim.type}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{claim.reason}</p>
                                            {claim.rejectionReason && (
                                                <p className="text-xs text-red-400">Reason: {claim.rejectionReason}</p>
                                            )}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(claim.status)}`}>
                                            {claim.status === 'approved' && <CheckCircle2 size={12} />}
                                            {claim.status === 'rejected' && <XCircle size={12} />}
                                            {claim.status === 'pending' && <AlertCircle size={12} />}
                                            <span className="capitalize">{claim.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UserTimeClaim;
