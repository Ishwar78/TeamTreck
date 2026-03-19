import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

const UserUrls = () => {
    const { token, user } = useAuth();
    const [urls, setUrls] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUrls = async () => {
            setLoading(true);
            try {
                const data = await apiFetch(`/api/activity/usage?userId=${user?.id}&period=today`, token);
                if (data.success) {
                    setUrls(data.urls || []);
                }
            } catch (error) {
                console.error("Failed to fetch URLs", error);
            } finally {
                setLoading(false);
            }
        };
        if (token && user?.id) fetchUrls();
    }, [token, user]);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const mergeIntervals = (intervals: { start: string, end: string }[]) => {
        if (!intervals || intervals.length === 0) return [];
        const sorted = [...intervals].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        const merged = [];
        let current = { ...sorted[0] };
        for (let i = 1; i < sorted.length; i++) {
            const next = sorted[i];
            const currentEnd = new Date(current.end).getTime();
            const nextStart = new Date(next.start).getTime();
            if (nextStart <= currentEnd + 15000) {
                if (new Date(next.end).getTime() > currentEnd) {
                    current.end = next.end;
                }
            } else {
                merged.push(current);
                current = { ...next };
            }
        }
        merged.push(current);
        return merged;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Globe className="text-primary" /> Visited URLs Today
            </h2>
            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="animate-spin text-primary" />
                </div>
            ) : urls.length === 0 ? (
                <Card className="bg-secondary/10 border-border/50">
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No URL activity tracked for today yet.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {urls.map((item, index) => {
                        const merged = mergeIntervals(item.intervals);
                        const latest = merged[merged.length - 1];
                        return (
                            <Card key={index} className="bg-secondary/10 border-border/50 overflow-hidden">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-3 overflow-hidden">
                                            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg mt-0.5">
                                                <Globe size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-foreground truncate">{item.url}</h3>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {latest && (
                                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                                            Last: {formatTime(latest.start)} - {formatTime(latest.end)}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                                        {item.visits} visits
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-primary">{formatDuration(item.seconds)}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2 border-t border-border/50">
                                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Usage Timeline</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {merged.map((iv, i) => (
                                                <span key={i} className="text-[9px] font-mono bg-secondary/30 px-2 py-0.5 rounded border border-border/30">
                                                    {formatTime(iv.start)} - {formatTime(iv.end)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default UserUrls;
