import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { ShieldBan, UserPlus, X, AlertCircle, CheckCircle2, ShieldCheck, Trash2, Edit2, Eye } from "lucide-react";

// Explicit complete match to sidebar modular items
const MODULES = [
  "dashboard", "team", "groups", "time_logs", "screenshots", "app_usage", 
  "reports", "invite_members", "notifications", "justifications", "time_claims", 
  "attendance", "chat", "tasks", "roles", "billing", "settings", "support"
];

const RoleManagement = () => {
  const { token } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");

  const [users, setUsers] = useState<any[]>([]);
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create User Modal  
  const [showUserModal, setShowUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState({ name: "", email: "", password: "", role: "employee", custom_role_id: "" });
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userModalStatus, setUserModalStatus] = useState<{ type: "success" | "error", text: string } | null>(null);

  // Create Role Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleMatrix, setRoleMatrix] = useState<Record<string, boolean>>({});
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([
        apiFetch("/api/company/users", token),
        apiFetch("/api/company/roles", token).catch(() => ({ roles: [] })) // handle if endpoint not immediately ready
      ]);
      setUsers(uRes?.users || []);
      setCustomRoles(rRes?.roles || []);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  /* ================= USERS TAB ================= */
  const handleRoleChange = async (userId: string, newRoleValue: string) => {
    try {
      let payload: any = { role: newRoleValue };
      if (newRoleValue === "custom") {
        return; // wait for them to select a specific custom role from the optgroup instead
      }
      
      if (newRoleValue.startsWith("custom_")) {
        payload = { role: "custom", custom_role_id: newRoleValue.split("_")[1] };
      }

      await apiFetch(`/api/company/users/${userId}/role`, token, {
        method: "PUT",
        body: payload
      });

      // Local State Map Update
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: payload.role, custom_role_id: payload.custom_role_id } : u));
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSubmitting(true);
    setUserModalStatus(null);
    try {
      let payload: any = { ...userFormData };
      if (payload.role.startsWith("custom_")) {
        payload.custom_role_id = payload.role.split("_")[1];
        payload.role = "custom";
      } else {
        delete payload.custom_role_id;
      }

      const res = await apiFetch("/api/company/users/create", token, {
        method: "POST",
        body: payload
      });
      
      if (res.success && res.user) {
        setUserModalStatus({ type: "success", text: "User created successfully" });
        setUsers([res.user, ...users]);
        setTimeout(() => {
          setShowUserModal(false);
          setUserModalStatus(null);
          setUserFormData({ name: "", email: "", password: "", role: "employee", custom_role_id: "" });
        }, 1500);
      }
    } catch (err: any) {
      setUserModalStatus({ type: "error", text: err.message || "Failed to create user" });
    } finally {
      setUserSubmitting(false);
    }
  };

  /* ================= ROLES TAB ================= */
  const togglePermission = (mod: string) => {
    setRoleMatrix((prev) => ({
      ...prev,
      [mod]: !prev[mod]
    }));
  };

  const handleRoleModalOpen = (role: any = null) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleMatrix(role.permissions || {});
    } else {
      setEditingRole(null);
      setRoleName("");
      setRoleMatrix({});
    }
    setShowRoleModal(true);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) return alert("Role name required");

    setRoleSubmitting(true);
    try {
      if (editingRole) {
        // Edit mode
        const res = await apiFetch(`/api/company/roles/${editingRole._id}`, token, {
          method: "PUT",
          body: { name: roleName, permissions: roleMatrix }
        });
        if (res.success && res.role) {
          setCustomRoles(prev => prev.map(r => r._id === editingRole._id ? res.role : r));
        }
      } else {
        // Create mode
        const res = await apiFetch("/api/company/roles", token, {
          method: "POST",
          body: { name: roleName, permissions: roleMatrix }
        });
        if (res.success && res.role) {
          setCustomRoles([...customRoles, res.role]);
        }
      }
      
      setShowRoleModal(false);
      setRoleName("");
      setRoleMatrix({});
      setEditingRole(null);
    } catch (err: any) {
      alert(err.message || "Failed to save custom role");
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this custom role?")) return;
    try {
      await apiFetch(`/api/company/roles/${roleId}`, token, { method: "DELETE" });
      setCustomRoles(prev => prev.filter(r => r._id !== roleId));
    } catch (err: any) {
      alert(err.message || "Failed to delete role");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldBan className="text-primary" />
              Role Management
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Create specific granular access roles and assign them to your users directly.
            </p>
          </div>

          <div className="flex gap-2">
            {activeTab === "users" ? (
              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm"
              >
                <UserPlus size={16} />
                Create User
              </button>
            ) : (
              <button
                onClick={() => handleRoleModalOpen()}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm"
              >
                <ShieldCheck size={16} />
                Create Role
              </button>
            )}
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex border-b border-border gap-6">
          <button 
            className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'users' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'roles' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('roles')}
          >
            Custom Roles
          </button>
        </div>

        {/* User Table Tab */}
        {activeTab === "users" && (
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading users...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-secondary/50 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-medium uppercase text-xs">Name</th>
                      <th className="px-6 py-4 font-medium uppercase text-xs">Email</th>
                      <th className="px-6 py-4 font-medium uppercase text-xs">Role Assignment</th>
                      <th className="px-6 py-4 font-medium uppercase text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4 text-foreground font-medium">{user.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role === 'custom' ? `custom_${user.custom_role_id}` : user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            className="bg-secondary text-foreground border border-border rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary w-full max-w-[200px]"
                          >
                            <optgroup label="Default System Roles">
                              <option value="company_admin">Company Admin</option>
                              <option value="sub_admin">Sub Admin</option>
                              <option value="employee">Employee</option>
                              <option value="user">User</option>
                            </optgroup>
                            
                            {customRoles.length > 0 && (
                              <optgroup label="Custom Matrix Roles">
                                {customRoles.map(cr => (
                                  <option key={cr._id} value={`custom_${cr._id}`}>{cr.name}</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.status === "active" ? "bg-green-500/10 text-green-500" :
                            user.status === "suspended" ? "bg-red-500/10 text-red-500" :
                            "bg-yellow-500/10 text-yellow-500"
                          }`}>
                            {user.status || "active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === "roles" && (
           <div className="border border-border rounded-xl bg-card overflow-hidden">
           {loading ? (
             <div className="p-8 text-center text-muted-foreground">Loading custom roles...</div>
           ) : customRoles.length === 0 ? (
             <div className="p-8 text-center text-muted-foreground">No custom roles built yet. Create one!</div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-secondary/50 text-muted-foreground">
                   <tr>
                     <th className="px-6 py-4 font-medium uppercase text-xs">Role Title</th>
                     <th className="px-6 py-4 font-medium uppercase text-xs">Matrix Highlights</th>
                     <th className="px-6 py-4 font-medium uppercase text-xs text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                   {customRoles.map((r) => (
                     <tr key={r._id} className="hover:bg-secondary/20 transition-colors">
                       <td className="px-6 py-4 text-foreground font-medium">{r.name}</td>
                       <td className="px-6 py-4 text-muted-foreground bg-secondary/10 border-l border-r border-border min-w-[300px] overflow-hidden truncate">
                          <code className="text-xs">{Object.keys(r.permissions || {}).filter(k => r.permissions[k]).length} Modules Active</code>
                       </td>
                       <td className="px-6 py-4 text-right flex justify-end gap-2">
                         <button onClick={() => handleRoleModalOpen(r)} className="text-blue-500 hover:text-blue-600 p-1 bg-blue-500/10 rounded" title="View / Edit Role">
                           <Edit2 size={16} />
                         </button>
                         <button onClick={() => handleDeleteRole(r._id)} className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded" title="Delete Role">
                           <Trash2 size={16} />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </div>
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* Create User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UserPlus size={18} className="text-primary" />
                Create New User
              </h2>
              <button onClick={() => setShowUserModal(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {userModalStatus && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${userModalStatus.type === "error" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}>
                  {userModalStatus.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  {userModalStatus.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Full Name</label>
                <input required type="text" placeholder="John Doe" className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                  value={userFormData.name} onChange={e => setUserFormData({ ...userFormData, name: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email Address</label>
                <input required type="email" placeholder="john@example.com" className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                  value={userFormData.email} onChange={e => setUserFormData({ ...userFormData, email: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Temporary Password</label>
                <input required type="text" placeholder="SecurePass123" className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                  value={userFormData.password} onChange={e => setUserFormData({ ...userFormData, password: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Assigned Role</label>
                <select required className="w-full bg-secondary text-foreground border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                  value={userFormData.role} onChange={e => setUserFormData({ ...userFormData, role: e.target.value })}>
                  <optgroup label="Default System Roles">
                    <option value="sub_admin">Sub Admin</option>
                    <option value="employee">Employee</option>
                    <option value="user">User</option>
                  </optgroup>
                  {customRoles.length > 0 && (
                    <optgroup label="Custom Matrix Roles">
                      {customRoles.map(cr => (
                        <option key={cr._id} value={`custom_${cr._id}`}>{cr.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="submit" disabled={userSubmitting} className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                  {userSubmitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Custom Role Matrix Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-border shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border bg-secondary/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                Build Custom Role Matrix
              </h2>
              <button onClick={() => setShowRoleModal(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-md">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="mb-6">
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Role Title</label>
                <input required type="text" placeholder="E.g., Junior Editor, Strict Viewer" className="w-full max-w-sm bg-secondary text-foreground border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                  value={roleName} onChange={e => setRoleName(e.target.value)} />
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/30 text-left border-b border-border">
                        <th className="px-4 py-3 font-semibold text-muted-foreground">MODULE</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground text-center">ACCESS ENABLED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map((mod) => (
                        <tr key={mod} className="border-b border-border last:border-0 hover:bg-secondary/10 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground uppercase text-xs tracking-wider">
                            {mod.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <label className="flex justify-center items-center h-full w-full cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-600 bg-secondary checked:bg-primary accent-primary cursor-pointer"
                                checked={!!roleMatrix[mod]}
                                onChange={() => togglePermission(mod)}
                              />
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-3 bg-secondary/30">
              <button type="button" onClick={() => setShowRoleModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleCreateRole} disabled={roleSubmitting || !roleName} className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                {roleSubmitting ? "Saving Matrix..." : "Save Custom Role"}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default RoleManagement;
