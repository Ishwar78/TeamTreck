import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, UserCheck, UserX, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TeamManagement = () => {
  const { token } = useAuth();
  const { toast } = useToast();

  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [newWorkingHours, setNewWorkingHours] = useState("");

  useEffect(() => {
    if (token) fetchMembers();
  }, [token]);

  useEffect(() => {
    handleSearch();
  }, [search, members]);

  const fetchMembers = async () => {
    try {
      const data = await apiFetch("/api/company/users", token);
      setMembers(data.users || []);
      setFilteredMembers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!search) {
      setFilteredMembers(members);
      return;
    }

    const filtered = members.filter((member) =>
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredMembers(filtered);
  };

  const handleEditClick = (member: any) => {
    setEditingMember(member);
    setNewWorkingHours(member.workingHours || "9:00 AM to 6:00 PM");
    setIsEditOpen(true);
  };

  const handleUpdateHours = async () => {
    if (!editingMember) return;
    try {
      const res = await apiFetch(`/api/company/users/${editingMember._id}/hours`, token, {
        method: "PUT",
        body: JSON.stringify({ workingHours: newWorkingHours.trim() }),
      });
      if (res.success) {
        toast({ title: "Success", description: "Working hours updated successfully" });
        setIsEditOpen(false);
        fetchMembers();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update hours", variant: "destructive" });
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading team...
      </div>
    );

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users size={28} />
              Team Members
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your team and their permissions
            </p>
          </div>

          {/* 🔍 SEARCH BAR */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users size={18} />
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <UserCheck size={18} />
              <div>
                <p className="text-2xl font-bold">
                  {members.filter(m => m.status === 'active').length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <UserX size={18} />
              <div>
                <p className="text-2xl font-bold">
                  {members.filter(m => m.status === 'invited').length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Directory</CardTitle>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Working Hours</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Mail size={14} />
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(member)} className="gap-2">
                            <Edit2 size={12} /> Edit Hours
                          </Button>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {member.workingHours || "9:00 AM to 6:00 PM"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      No members found 😔
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Working Hours Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Working Hours</DialogTitle>
              <DialogDescription>
                Assign custom working hours for {editingMember?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Working Hours</Label>
                <Input
                  type="text"
                  placeholder="e.g. 9:00 AM to 6:00 PM"
                  value={newWorkingHours}
                  onChange={(e) => setNewWorkingHours(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateHours}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default TeamManagement;