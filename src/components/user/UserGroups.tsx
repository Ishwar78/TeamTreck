import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersRound, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const UserGroups = () => {
  const { token } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (token) {
      fetchMyGroups();
    }
  }, [token]);

  const fetchMyGroups = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/company/my-groups", token);
      if (data.success && data.groups) {
        setGroups(data.groups);
      } else {
        setGroups(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch my groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter((g: any) => g.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading groups...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <UsersRound className="text-primary" size={24} />
          My Groups
        </h2>
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
      </div>

      {filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            You are not part of any groups at the moment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group: any) => (
            <Card key={group._id} className="hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-md">
                    <UsersRound size={16} />
                  </div>
                  {group.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  {group.users?.length || group.userIds?.length || 0} members
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.users && group.users.slice(0, 5).map((u: any) => (
                    <span key={u._id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground" title={u.email}>
                      {u.name?.split(" ")[0] || "User"}
                    </span>
                  ))}
                  {group.users && group.users.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      +{group.users.length - 5} more
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserGroups;
