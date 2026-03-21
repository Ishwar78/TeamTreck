import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const UserTasks = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchTasks();
  }, [token]);

  const fetchTasks = async () => {
    try {
      const data = await apiFetch("/api/tasks", token);
      setTasks(data.tasks || []);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load tasks.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'in_progress' : currentStatus === 'in_progress' ? 'completed' : 'pending';
      const res = await apiFetch(`/api/tasks/${taskId}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.success) {
        toast({ title: "Status Updated", description: `Task status is now ${newStatus.replace('_', ' ')}` });
        fetchTasks();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500 font-medium">Completed</span>;
      case 'in_progress': return <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500 font-medium">In Progress</span>;
      default: return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500 font-medium">Pending</span>;
    }
  };

  if (loading) return <div className="p-4 text-center text-muted-foreground">Loading your tasks...</div>;

  return (
    <Card className="overflow-hidden border-border bg-card mt-2">
      <CardHeader>
        <CardTitle className="text-lg">My Assigned Tasks</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Task Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Assigned By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                  No tasks assigned to you yet.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task._id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{task.description || "N/A"}</TableCell>
                  <TableCell>{task.assignedBy?.name || "Admin"}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(task._id, task.status)}>
                      {task.status === 'pending' ? 'Start' : task.status === 'in_progress' ? 'Complete' : 'Reopen'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserTasks;
