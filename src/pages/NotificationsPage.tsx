import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Mail, Send, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NotificationsPage = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) fetchMembers();
  }, [token]);

  const fetchMembers = async () => {
    try {
      const data = await apiFetch("/api/company/users", token);
      setMembers(data.users || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load team members.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === members.length) {
      setSelectedUserIds([]); // Deselect all
    } else {
      setSelectedUserIds(members.map(m => m._id)); // Select all
    }
  };

  const handleSendNotification = async () => {
    if (selectedUserIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one user.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Validation Error",
        description: "Message body cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const resp = await apiFetch("/api/company/notifications/send", token, {
        method: "POST",
        body: JSON.stringify({
          userIds: selectedUserIds,
          subject,
          message
        })
      });

      if (resp.success) {
        toast({
          title: "Success",
          description: resp.message || "Notifications sent successfully.",
        });
        setSubject("");
        setMessage("");
        setSelectedUserIds([]);
      }
    } catch (error: any) {
      toast({
        title: "Failed to Send",
        description: error.message || "An error occurred while sending notifications.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="text-primary" size={28} />
              Send Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select employees and send them an email notification directly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Compose Section */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail size={18} /> Compose Notification
              </CardTitle>
              <CardDescription>
                {selectedUserIds.length > 0
                  ? `Sending to ${selectedUserIds.length} selected employee(s).`
                  : "Please select employees from the list to send a notification."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Input
                  id="subject"
                  placeholder="E.g., Important Update"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={sending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your notification message here..."
                  className="min-h-[150px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                />
              </div>
              <Button 
                className="w-full gap-2" 
                onClick={handleSendNotification} 
                disabled={sending || selectedUserIds.length === 0 || !message.trim()}
              >
                <Send size={16} />
                {sending ? "Sending..." : "Send Notification"}
              </Button>
            </CardContent>
          </Card>

          {/* User List Section */}
          <Card className="lg:col-span-2 overflow-hidden border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users size={18} /> Select Recipients
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all" 
                  checked={selectedUserIds.length === members.length && members.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <Label htmlFor="select-all" className="cursor-pointer font-medium text-sm">Select All</Label>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto max-h-[500px] overflow-y-auto">
              {members.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No employees found. Please add team members first.
                </div>
              ) : (
                <Table className="min-w-[500px]">
                  <TableHeader className="sticky top-0 bg-secondary">
                    <TableRow>
                      <TableHead className="w-12 text-center"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow 
                        key={member._id} 
                        className="cursor-pointer"
                        onClick={() => toggleUserSelection(member._id)}
                      >
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedUserIds.includes(member._id)}
                            onCheckedChange={() => toggleUserSelection(member._id)}
                            aria-label={`Select ${member.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{member.name}</TableCell>
                        <TableCell>
                          <span className="text-muted-foreground flex items-center gap-2 whitespace-nowrap">
                            {member.email}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize whitespace-nowrap">
                            {member.role?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
