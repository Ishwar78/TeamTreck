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
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
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
                    {urls.map((item, index) => (
                        <Card key={index} className="bg-secondary/10 border-border/50">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-start gap-3 overflow-hidden">
                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg mt-0.5">
                                        <Globe size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-foreground truncate">{item.url}</h3>
                                        <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-primary hover:underline flex items-center gap-1 truncate">
                                            {item.url} <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                                <div className="text-right whitespace-nowrap pl-4">
                                    <div className="font-bold text-primary">{formatDuration(item.seconds)}</div>
                                    <div className="text-xs text-muted-foreground">{item.visits} visits</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserUrls;
