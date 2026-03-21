import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const UserNotifications = ({ onUnreadCountChange }: { onUnreadCountChange?: (count: number) => void }) => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchNotifications();
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch("/api/notifications", token);
      setNotifications(data.notifications || []);
      if (onUnreadCountChange && data.unreadCount !== undefined) {
        onUnreadCountChange(data.unreadCount);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load notifications.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, is_read: boolean) => {
    if (is_read) return; // already read

    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, token, {
        method: "PATCH",
      });
      
      if (res.success) {
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, is_read: true } : n)
        );
        // We can re-fetch to update count, or just decrement local count via a prop if we handled it that way.
        // For accuracy, let's re-fetch. Or if we just want to update local, we can, but it's safer to re-fetch quickly.
        // fetchNotifications();
        // Since we emit count change, let's notify the parent
        if (onUnreadCountChange) {
           const unread = notifications.filter(n => !n.is_read && n._id !== id).length;
           onUnreadCountChange(unread);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await apiFetch(`/api/notifications/read-all`, token, { method: "PATCH" });
      if (res.success) {
        setNotifications(prev => prev.map(n => ({...n, is_read: true})));
        if (onUnreadCountChange) onUnreadCountChange(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-4 text-center text-muted-foreground">Loading notifications...</div>;

  return (
    <Card className="overflow-hidden border-border bg-card mt-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">My Notifications</CardTitle>
        {notifications.some(n => !n.is_read) && (
          <button onClick={markAllAsRead} className="text-sm text-primary hover:underline">
            Mark all as read
          </button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col max-h-[500px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground h-24">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif._id} 
                onClick={() => markAsRead(notif._id, notif.is_read)}
                className={`p-4 border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer ${notif.is_read ? 'opacity-70' : 'bg-primary/5'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-semibold ${!notif.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {notif.message}
                </p>
                {!notif.is_read && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-500 rounded-full">
                    New
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserNotifications;
