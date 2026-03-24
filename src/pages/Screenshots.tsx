import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Camera, Download, Users, Calendar } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";

// const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Screenshots = () => {
  const { token, user } = useAuth();
  const { can, role, canAction } = usePermissions();
  const isAdmin =
    role === "company_admin" ||
    role === "sub_admin" ||
    (role === "custom" && canAction("screenshots"));

  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // ✅ SEARCH STATE
  const [searchTerm, setSearchTerm] = useState("");

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    if (token && user?.id) {
      setSelectedUser(user.id);

      if (isAdmin) {
        fetchTeamMembers();
      } else {
        fetchScreenshots(user.id);
      }
    }
  }, [token, user]);

  /* ================= USER CHANGE ================= */

  useEffect(() => {
    if (selectedUser) {
      fetchScreenshots(selectedUser);
    }
  }, [selectedUser]);

  /* ================= FETCH TEAM ================= */

  const fetchTeamMembers = async () => {
    try {
      const data = await apiFetch("/api/company/users", token);
      setTeamMembers(data.users || []);

      if (data.users?.length > 0) {
        setSelectedUser(data.users[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch team members", err);
    }
  };

  /* ================= FETCH SCREENSHOTS ================= */

  const fetchScreenshots = async (userId: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(
        `/api/agent/screenshots/${userId}`,
        token
      );
      setScreenshots(data.screenshots || []);
    } catch (err) {
      console.error(err);
      setScreenshots([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployee = teamMembers.find(
    (m) => m._id === selectedUser
  );

  // ✅ FILTERED USERS
  const filteredMembers = teamMembers.filter((member) =>
    `${member.name} ${member.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Camera className="text-primary" size={28} />
              Screenshots
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View employee activity screenshots
            </p>
          </div>

          {/* ✅ SEARCH + SELECT */}
          {isAdmin && teamMembers.length > 0 && (
            <div className="flex items-center gap-3">
              
              {/* SEARCH BAR */}
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border px-3 py-2 rounded-md w-64 text-sm bg-card border-border outline-none"
              />

              {/* SELECT */}
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-64 bg-card border-border">
                  <Users size={14} className="mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMembers.map((member) => (
                    <SelectItem
                      key={member._id}
                      value={member._id}
                    >
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>
          )}
        </div>

        {/* ================= STATS CARD ================= */}
        {selectedEmployee && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Camera className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {selectedEmployee.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEmployee.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {screenshots.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Screenshots
                    </p>
                  </div>
                  {isAdmin && screenshots.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        window.open(
                          `${API_BASE}/api/agent/screenshots/download-all/${selectedUser}?token=${token}`,
                          "_blank"
                        );
                      }}
                    >
                      <Download size={14} />
                      Download All (ZIP)
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ================= GRID ================= */}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Loading screenshots...
          </div>
        ) : screenshots.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Camera
                className="mx-auto text-muted-foreground mb-4"
                size={48}
              />
              <p className="text-muted-foreground">
                No screenshots available
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {screenshots.map((shot) => (
              <Card key={shot._id} className="overflow-hidden">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      {shot.timestamp
                        ? format(
                          new Date(shot.timestamp),
                          "MMM dd, yyyy HH:mm"
                        )
                        : "Unknown"}
                    </div>

                    {/* DOWNLOAD BUTTON */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.open(
                          `${API_BASE}/api/agent/screenshots/download/${shot._id}`,
                          "_blank"
                        );
                      }}
                    >
                      <Download size={14} />
                    </Button>
                  </div>
                </CardHeader>

                {/* IMAGE PREVIEW FIXED */}
                <CardContent className="p-0">
                  <img
                    src={`${API_BASE}/api/agent/screenshots/view/${shot._id}?token=${token}`}
                    className="w-full h-56 object-cover cursor-pointer"
                    alt="Screenshot"
                    crossOrigin="anonymous"
                    onClick={() =>
                      window.open(
                        `${API_BASE}/api/agent/screenshots/view/${shot._id}`,
                        "_blank"
                      )
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Screenshots;