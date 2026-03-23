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
import { UsersRound, Plus, Users, Search, Edit, Trash2 } from "lucide-react";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [editMemberSearchQuery, setEditMemberSearchQuery] = useState("");
  
  const [editDialog, setEditDialog] = useState(false);
  const [editGroupState, setEditGroupState] = useState({
    _id: "",
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

  const toggleUserSelectionEdit = (userId: string) => {
    setEditGroupState(prev => {
      const selected = prev.userIds.includes(userId);
      if (selected) {
        return { ...prev, userIds: prev.userIds.filter(id => id !== userId) };
      } else {
        return { ...prev, userIds: [...prev.userIds, userId] };
      }
    });
  };

  const openEditGroup = (group: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditGroupState({
      _id: group._id,
      name: group.name,
      userIds: group.users ? group.users.map((u: any) => u._id) : (group.userIds || [])
    });
    setEditDialog(true);
  };

  const handleUpdateGroup = async () => {
    if (!editGroupState.name.trim()) {
      toast({ title: "Validation Error", description: "Group name is required.", variant: "destructive" });
      return;
    }

    try {
      await apiFetch(`/api/company/groups/${editGroupState._id}`, token, {
        method: "PUT",
        body: JSON.stringify({ name: editGroupState.name, userIds: editGroupState.userIds })
      });

      toast({
        title: "Group Updated",
        description: `${editGroupState.name} has been successfully updated.`,
      });

      setEditDialog(false);
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update group.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async (group: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (!window.confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      return;
    }

    try {
      await apiFetch(`/api/company/groups/${group._id}`, token, {
        method: "DELETE"
      });

      toast({
        title: "Group Deleted",
        description: `${group.name} has been deleted.`,
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete group.",
        variant: "destructive",
      });
    }
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

  const filteredGroups = groups.filter((g: any) => g.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredMembers = members.filter((m: any) => m.name?.toLowerCase().includes(memberSearchQuery.toLowerCase()) || m.email?.toLowerCase().includes(memberSearchQuery.toLowerCase()));
  const filteredEditMembers = members.filter((m: any) => m.name?.toLowerCase().includes(editMemberSearchQuery.toLowerCase()) || m.email?.toLowerCase().includes(editMemberSearchQuery.toLowerCase()));

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
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Group List</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search groups..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                {filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                      No groups found. Create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group: any, index: number) => (
                    <TableRow key={group._id || index}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{group.users ? group.users.length : (group.userIds?.length || 0)} members</TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          type="button"
                          onClick={(e) => handleViewGroup(group, e)}
                          title="View Members"
                        >
                          <UsersRound className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          type="button"
                          onClick={(e) => openEditGroup(group, e)}
                          title="Edit Group"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          type="button"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => handleDeleteGroup(group, e)}
                          title="Delete Group"
                        >
                          <Trash2 className="h-4 w-4" />
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
                <Input 
                  placeholder="Search users..." 
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="mb-2"
                />
                <div className="border border-border rounded-md p-3 max-h-48 overflow-y-auto space-y-3">
                  {filteredMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users found.</p>
                  ) : (
                    filteredMembers.map((member: any) => (
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

        {/* Edit Group Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>
                Update the group name or modify nested users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Group Name</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g. Sales Team"
                  value={editGroupState.name}
                  onChange={(e) => setEditGroupState({ ...editGroupState, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Select Members</Label>
                <Input 
                  placeholder="Search users..." 
                  value={editMemberSearchQuery}
                  onChange={(e) => setEditMemberSearchQuery(e.target.value)}
                  className="mb-2"
                />
                <div className="border border-border rounded-md p-3 max-h-48 overflow-y-auto space-y-3">
                  {filteredEditMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users found.</p>
                  ) : (
                    filteredEditMembers.map((member: any) => (
                      <div key={member._id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`edit-user-${member._id}`} 
                          checked={editGroupState.userIds.includes(member._id)}
                          onCheckedChange={() => toggleUserSelectionEdit(member._id)}
                        />
                        <Label
                          htmlFor={`edit-user-${member._id}`}
                          className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {member.name} ({member.email})
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {editGroupState.userIds.length} user(s) selected
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdateGroup}>Save Changes</Button>
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
