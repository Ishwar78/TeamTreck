import React, { useEffect, useState } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const TaskPage = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [addDialog, setAddDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
  });

  const isAdmin = user?.role === "company_admin" || user?.role === "sub_admin";

  useEffect(() => {
    if (token) {
      fetchTasks();
      if (isAdmin) {
        fetchEmployees();
      }
    }
  }, [token, isAdmin]);

  const fetchTasks = async () => {
    try {
      const data = await apiFetch("/api/tasks", token);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load tasks.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await apiFetch("/api/company/users", token);
      setEmployees(data.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast({ title: "Validation Error", description: "Task title is required.", variant: "destructive" });
      return;
    }
    if (!newTask.assignedTo) {
      toast({ title: "Validation Error", description: "Please select an employee.", variant: "destructive" });
      return;
    }

    try {
      await apiFetch("/api/tasks", token, {
        method: "POST",
        body: JSON.stringify(newTask)
      });
      toast({ title: "Success", description: "Task successfully assigned." });
      setAddDialog(false);
      setNewTask({ title: "", description: "", assignedTo: "" });
      fetchTasks();
    } catch (err) {
      toast({ title: "Error", description: "Failed to create task.", variant: "destructive" });
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

  if (loading) return <div className="flex h-screen items-center justify-center">Loading tasks...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="text-primary" size={28} />
              Tasks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? "Assign and manage employee tasks" : "View and update your assigned tasks"}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setAddDialog(true)} className="gap-2 w-full sm:w-auto">
              <Plus size={16} />
              Assign Task
            </Button>
          )}
        </div>

        <Card className="overflow-hidden border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Task List</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Task Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assigned {isAdmin ? "To" : "By"}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                      No tasks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task._id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{task.description || "N/A"}</TableCell>
                      <TableCell>
                        {isAdmin ? (
                           task.assignedTo?.name || "Unknown"
                        ) : (
                           task.assignedBy?.name || "Admin"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell className="text-right">
                        {/* Users can always update status. Admins can as well. */}
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

        {isAdmin && (
          <Dialog open={addDialog} onOpenChange={setAddDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Assign New Task</DialogTitle>
                <DialogDescription>
                  Create a task and assign it to an employee.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Design homepage mockup"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide additional details..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select value={newTask.assignedTo} onValueChange={(val) => setNewTask({ ...newTask, assignedTo: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp._id} value={emp._id}>
                          {emp.name} ({emp.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateTask}>Assign Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TaskPage;
