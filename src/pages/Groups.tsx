import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersRound, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const Groups = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const [addDialog, setAddDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    userIds: [] as string[],
  });

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users for the company to show in the dropdown/checkboxes
      const usersData = await apiFetch("/api/company/users", token);
      setMembers(usersData.users || []);

      // Fetch existing groups
      try {
        const groupsData = await apiFetch("/api/company/groups", token);
        setGroups(groupsData.groups || groupsData || []);
      } catch (err) {
        // If endpoint doesn't exist yet, we catch the error but don't break the page
        console.error("Failed to fetch groups, endpoint might not exist:", err);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast({ title: "Validation Error", description: "Group name is required.", variant: "destructive" });
      return;
    }

    try {
      // Assuming a standard POST endpoint to create a group
      const res = await apiFetch("/api/company/groups", token, {
        method: "POST",
        body: JSON.stringify(newGroup)
      });

      toast({
        title: "Group Created",
        description: `${newGroup.name} has been successfully created.`,
      });

      setAddDialog(false);
      setNewGroup({ name: "", userIds: [] });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group. Backend endpoint might not exist.",
        variant: "destructive",
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    setNewGroup(prev => {
      const selected = prev.userIds.includes(userId);
      if (selected) {
        return { ...prev, userIds: prev.userIds.filter(id => id !== userId) };
      } else {
        return { ...prev, userIds: [...prev.userIds, userId] };
      }
    });
  };

  const handleViewGroup = (group: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Viewing group:", group);
    setSelectedGroup(group);
    setViewDialog(true);
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading groups...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UsersRound className="text-primary" size={28} />
              Groups
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your company groups and assign users
            </p>
          </div>
          <Button onClick={() => setAddDialog(true)} className="gap-2 w-full sm:w-auto">
            <Plus size={16} />
            Create Group
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <UsersRound size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold">{groups.length}</p>
                <p className="text-xs text-muted-foreground">Total Groups</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Users size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-xs text-muted-foreground">Total Users Available</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Groups Table */}
        <Card className="overflow-hidden border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Group List</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Members Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                      No groups found. Create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group, index) => (
                    <TableRow key={group._id || index}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{group.users ? group.users.length : (group.userIds?.length || 0)} members</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          type="button"
                          onClick={(e) => handleViewGroup(group, e)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Group Dialog */}
        <Dialog open={addDialog} onOpenChange={setAddDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a group and add users from your company.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Sales Team"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Select Members</Label>
                <div className="border border-border rounded-md p-3 max-h-48 overflow-y-auto space-y-3">
                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users available.</p>
                  ) : (
                    members.map(member => (
                      <div key={member._id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`user-${member._id}`} 
                          checked={newGroup.userIds.includes(member._id)}
                          onCheckedChange={() => toggleUserSelection(member._id)}
                        />
                        <Label
                          htmlFor={`user-${member._id}`}
                          className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {member.name} ({member.email})
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {newGroup.userIds.length} user(s) selected
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateGroup}>Create Group</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Group Dialog */}
        <Dialog open={viewDialog} onOpenChange={setViewDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>View Group Members</DialogTitle>
              <DialogDescription>
                Members of the {selectedGroup?.name} group.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {!selectedGroup?.users || selectedGroup.users.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No members in this group.</p>
                ) : (
                  selectedGroup.users.map((member: any) => (
                    <div key={member._id} className="flex items-center space-x-3 p-2 bg-muted/50 rounded-md">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                        {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{member.name || 'Unknown User'}</span>
                        <span className="text-xs text-muted-foreground">{member.email || 'No email provided'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Groups;
