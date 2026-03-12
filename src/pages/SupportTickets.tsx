import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { LifeBuoy, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// const API_BASE_URL = "http://localhost:5000/api";
// const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;
const API_BASE_URL = "https://teamtreck-backend.onrender.com/api";


const SupportTickets = () => {
    const { token, user } = useAuth();
    const { toast } = useToast();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

    // New Ticket Form
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");

    // Reply Form
    const [replyMsg, setReplyMsg] = useState("");

    const fetchTickets = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/company/tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setTickets(data.data);
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to fetch tickets", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchTickets();
    }, [token]);

    const handleCreateTicket = async () => {
        if (!newTitle.trim() || !newDesc.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/company/tickets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ title: newTitle, description: newDesc })
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Success", description: "Ticket created" });
                setIsNewTicketOpen(false);
                setNewTitle("");
                setNewDesc("");
                fetchTickets();
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to create ticket", variant: "destructive" });
        }
    };

    const handleReply = async () => {
        if (!replyMsg.trim() || !selectedTicket) return;
        try {
            const res = await fetch(`${API_BASE_URL}/company/tickets/${selectedTicket._id}/reply`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ message: replyMsg })
            });
            const data = await res.json();
            if (data.success) {
                setReplyMsg("");
                setSelectedTicket(data.data);
                fetchTickets();
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Open": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "In Progress": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "Resolved": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
            default: return "";
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <DashboardLayout>
            <div className="p-8 max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <LifeBuoy className="text-primary" /> Support Tickets
                        </h1>
                        <p className="text-muted-foreground text-sm">Need help? Contact super admin support here.</p>
                    </div>
                    <Button onClick={() => setIsNewTicketOpen(true)} className="gap-2">
                        <Plus size={16} /> New Ticket
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Ticket List */}
                    <div className="lg:col-span-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[70vh]">
                        <div className="p-4 border-b border-border bg-muted/30 font-semibold">Your Tickets</div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {tickets.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">No tickets found.</div>
                            ) : (
                                tickets.map((t) => (
                                    <div
                                        key={t._id}
                                        onClick={() => setSelectedTicket(t)}
                                        className={`p-4 rounded-lg cursor-pointer transition-colors border ${selectedTicket?._id === t._id ? "bg-primary/10 border-primary/30" : "bg-background hover:bg-muted border-transparent"}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-sm truncate pr-2">{t.title}</h3>
                                            <Badge variant="outline" className={`text-xs px-2 py-0 ${getStatusColor(t.status)}`}>
                                                {t.status}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Ticket Details */}
                    <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[70vh]">
                        {selectedTicket ? (
                            <>
                                <div className="p-5 border-b border-border">
                                    <div className="flex justify-between items-start mb-4">
                                        <h2 className="text-xl font-bold">{selectedTicket.title}</h2>
                                        <Badge variant="outline" className={getStatusColor(selectedTicket.status)}>
                                            {selectedTicket.status}
                                        </Badge>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap">
                                        {selectedTicket.description}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">
                                        Created by {selectedTicket.createdBy?.name || "You"} on {new Date(selectedTicket.createdAt).toLocaleString()}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                    {selectedTicket.replies?.map((r: any, idx: number) => {
                                        const isSuperAdmin = r.senderModel === "SuperAdmin";
                                        return (
                                            <div key={idx} className={`flex ${isSuperAdmin ? "justify-start" : "justify-end"}`}>
                                                <div className={`max-w-[80%] rounded-xl p-3 text-sm ${isSuperAdmin ? "bg-secondary text-secondary-foreground rounded-tl-none" : "bg-primary text-primary-foreground rounded-tr-none"}`}>
                                                    <div className="font-semibold text-xs mb-1 opacity-70">
                                                        {isSuperAdmin ? "Support Team" : "You"}
                                                    </div>
                                                    <div className="whitespace-pre-wrap">{r.message}</div>
                                                    <div className="text-[10px] mt-2 opacity-50 text-right">
                                                        {new Date(r.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {selectedTicket.status !== "Resolved" && (
                                    <div className="p-4 border-t border-border bg-muted/10 gap-2 flex items-center">
                                        <Textarea
                                            placeholder="Type your reply..."
                                            className="flex-1 min-h-[40px] h-[40px]"
                                            value={replyMsg}
                                            onChange={(e) => setReplyMsg(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleReply();
                                                }
                                            }}
                                        />
                                        <Button onClick={handleReply} className="h-[40px]">Send</Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                                <MessageSquare size={48} className="mb-4 opacity-20" />
                                <p>Select a ticket to view details</p>
                            </div>
                        )}
                    </div>
                </div>

                <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Support Ticket</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input placeholder="Issue summary..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    placeholder="Detailed description of your issue..."
                                    className="min-h-[120px]"
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsNewTicketOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateTicket}>Submit Ticket</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default SupportTickets;
