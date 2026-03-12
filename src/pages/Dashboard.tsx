import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, Camera, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import EmployeeDashboard from "./EmployeeDashboard";

const Dashboard = () => {
  const { token, loading, user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && token && user?.role !== 'employee') {
      fetchStats();
    }
  }, [token, loading, user]);

  const fetchStats = async () => {
    try {
      const data = await apiFetch("/api/dashboard/stats", token);
      setStats(data);
    } catch (err: any) {
      console.error(err);
      setError("Unable to load dashboard data");
    }
  };

  if (loading)
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </DashboardLayout>
    );

  // Render Employee Dashboard if role is employee
  if (user?.role === 'employee' || user?.role === 'user') {
    return <EmployeeDashboard />;
  }

  if (error)
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="bg-red-500/10 text-red-400 px-6 py-4 rounded-xl border border-red-500/30">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1">
          Monitor your company activity in real-time
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Active Now */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-md border border-cyan-500/20 p-6 rounded-2xl shadow-lg hover:scale-[1.02] transition">
          <div className="flex items-center justify-between mb-4">
            <Activity className="text-cyan-400" size={28} />
            <span className="text-sm text-gray-400">Live Users</span>
          </div>
          <h2 className="text-4xl font-bold text-white">
            {stats?.activeNow ?? 0}
          </h2>
        </div>

        {/* Screenshots */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-500/20 p-6 rounded-2xl shadow-lg hover:scale-[1.02] transition">
          <div className="flex items-center justify-between mb-4">
            <Camera className="text-purple-400" size={28} />
            <span className="text-sm text-gray-400">Screenshots</span>
          </div>
          <h2 className="text-4xl font-bold text-white">
            {stats?.screenshots ?? 0}
          </h2>
        </div>

        {/* Hours Today */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-md border border-emerald-500/20 p-6 rounded-2xl shadow-lg hover:scale-[1.02] transition">
          <div className="flex items-center justify-between mb-4">
            <Clock className="text-emerald-400" size={28} />
            <span className="text-sm text-gray-400">Hours Today</span>
          </div>
          <h2 className="text-4xl font-bold text-white">
            {stats?.hoursToday ?? 0}
          </h2>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
