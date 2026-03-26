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
import { Users, Mail, UserCheck, UserX, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { Checkbox } from "@/components/ui/checkbox";

const TeamManagement = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const { canAction } = usePermissions();

  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [newWorkingHours, setNewWorkingHours] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isOTPRequesting, setIsOTPRequesting] = useState(false);
  const [isOTPConfirmOpen, setIsOTPConfirmOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [userIdsToDelete, setUserIdsToDelete] = useState<string[]>([]);

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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMembers.map(m => m._id));
    }
  };

  const handleDeleteRequest = async (ids: string[]) => {
    setIsOTPRequesting(true);
    try {
      const res = await apiFetch("/api/company/users/delete-request", token, {
        method: "POST"
      });
      if (res.success) {
        setUserIdsToDelete(ids);
        setIsOTPConfirmOpen(true);
        toast({ title: "OTP Sent", description: "Please check your email for the deletion code." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to request deletion", variant: "destructive" });
    } finally {
      setIsOTPRequesting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!otp) return;
    try {
      const res = await apiFetch("/api/company/users/bulk-delete", token, {
        method: "POST",
        body: JSON.stringify({ userIds: userIdsToDelete, otp })
      });
      if (res.success) {
        toast({ title: "Success", description: res.message });
        setIsOTPConfirmOpen(false);
        setSelectedIds([]);
        setOtp("");
        fetchMembers();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete users", variant: "destructive" });
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

          {/* 🔍 SEARCH BAR & DELETE */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 items-center">
            {selectedIds.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteRequest(selectedIds)}
                disabled={isOTPRequesting}
                className="gap-2"
              >
                <Trash2 size={16} /> Delete Selected ({selectedIds.length})
              </Button>
            )}
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72"
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
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedIds.length === filteredMembers.length && filteredMembers.length > 0} 
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <TableRow key={member._id} className={selectedIds.includes(member._id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(member._id)} 
                          onCheckedChange={() => toggleSelect(member._id)}
                        />
                      </TableCell>
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
                        <div className="flex justify-end gap-2">
                          {canAction("team", "edit") && (
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(member)} title="Edit Hours">
                              <Edit2 size={12} />
                            </Button>
                          )}
                          {canAction("team", "delete") && (
                             <Button variant="destructive" size="sm" onClick={() => handleDeleteRequest([member._id])} disabled={isOTPRequesting} title="Delete Member">
                              <Trash2 size={12} />
                             </Button>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground block mt-1">
                           {member.workingHours || "9:00 AM to 6:00 PM"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
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
        {/* OTP Deletion Dialog */}
        <Dialog open={isOTPConfirmOpen} onOpenChange={setIsOTPConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <Trash2 size={20} /> Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                This action is irreversible. You are about to delete {userIdsToDelete.length} member(s).
                A 6-digit code has been sent to your email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Enter 6-digit OTP</Label>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-[1em] font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOTPConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={otp.length !== 6}>
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default TeamManagement;