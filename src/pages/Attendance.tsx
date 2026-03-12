import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageGuard } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subWeeks, addWeeks, subMonths, addMonths, subDays, addDays as addDay, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";

type ViewMode = "day" | "week" | "month" | "dateRange";

interface AttendanceData {
  date: string;
  inTime: string | null;
  finishTime: string | null;
  workHours: string;
  idleHours: string;
  hourlyData: { [hour: string]: string };
  timeline?: {
    start: string;
    end: string;
    type: string;
    duration: string;
  }[];
}


// Mock hourly columns like in the reference screenshot


// Mock generation removed
const HOURLY_COLUMNS = ["7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM"];

const Attendance = () => {
  const { token, user } = useAuth();
  const { can, role } = usePermissions();
  const isAdmin = can("manage_team") || role === "company_admin" || role === "sub_admin";

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user?.id) {
      setSelectedUser(user.id);
      if (isAdmin) {
        fetchTeamMembers();
      }
    }
  }, [token, user]);

  const fetchTeamMembers = async () => {
    try {
      const data = await apiFetch("/api/company/users", token);
      setTeamMembers(data.users || []);
    } catch (err) {
      console.error("Failed to fetch team members", err);
    }
  };

  const { startDate, endDate, displayRange } = useMemo(() => {
    let start: Date, end: Date, display: string;

    switch (viewMode) {
      case "day":
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
        display = format(currentDate, "dd MMM yyyy");
        break;
      case "week":
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(currentDate, { weekStartsOn: 1 });
        display = `${format(start, "dd MMM")} - ${format(end, "dd MMM yyyy")}`;
        break;
      case "month":
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        display = format(currentDate, "MMMM yyyy");
        break;
      case "dateRange":
        start = subDays(currentDate, 30);
        end = currentDate;
        display = `${format(start, "dd MMM")} - ${format(end, "dd MMM yyyy")}`;
        break;
    }

    return { startDate: start, endDate: end, displayRange: display };
  }, [viewMode, currentDate]);



  useEffect(() => {
    if (token && startDate && endDate) {
      fetchAttendance();
    }
  }, [token, startDate, endDate, selectedUser]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        detailed: viewMode === 'day' ? 'true' : 'false',
        ...(selectedUser && selectedUser !== "all" && { userId: selectedUser })
      }).toString();

      const res = await apiFetch(`/api/reports/attendance?${query}`, token);

      const formattedData = res.data.map((record: any) => ({
        ...record,
        date: format(new Date(record.date), "dd MMM yyyy EEE"),
        inTime: record.inTime ? format(new Date(record.inTime), "hh:mm a") : "-",
        finishTime: record.finishTime ? format(new Date(record.finishTime), "hh:mm a") : "-",
        timeline: record.timeline?.map((t: any) => ({
          ...t,
          start: format(new Date(t.start), "HH:mm"),
          end: format(new Date(t.end), "HH:mm"),
        })) || []
      }));

      // Fill in missing days if showing a range/week
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      const fullData = allDays.map(day => {
        const dateStr = format(day, "dd MMM yyyy EEE");
        const existing = formattedData.find((d: any) => d.date === dateStr);
        if (existing) return existing;

        return {
          date: dateStr,
          inTime: null,
          finishTime: null,
          workHours: "00:00:00",
          idleHours: "00:00:00",
          hourlyData: {}
        };
      }).reverse(); // Most recent first

      setAttendanceData(fullData);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalWork = attendanceData.reduce((acc, d) => {
      const [h, m, s] = d.workHours.split(":").map(Number);
      return acc + h * 3600 + m * 60 + s;
    }, 0);

    const totalIdle = attendanceData.reduce((acc, d) => {
      const [h, m, s] = d.idleHours.split(":").map(Number);
      return acc + h * 3600 + m * 60 + s;
    }, 0);

    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    return {
      timeSpent: formatTime(totalWork + totalIdle),
      workingTime: formatTime(totalWork),
      idleTime: formatTime(totalIdle),
    };
  }, [attendanceData]);

  const handlePrev = () => {
    switch (viewMode) {
      case "day":
        setCurrentDate((d) => subDays(d, 1));
        break;
      case "week":
        setCurrentDate((d) => subWeeks(d, 1));
        break;
      case "month":
        setCurrentDate((d) => subMonths(d, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case "day":
        setCurrentDate((d) => addDay(d, 1));
        break;
      case "week":
        setCurrentDate((d) => addWeeks(d, 1));
        break;
      case "month":
        setCurrentDate((d) => addMonths(d, 1));
        break;
    }
  };

  const getHourColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/20 text-green-400";
      case "Idle":
        return "bg-yellow-500/20 text-yellow-400";
      case "Away":
        return "bg-orange-500/20 text-orange-400";
      case "Absent":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout>
      <PageGuard permission="view_attendance">
        <div className="space-y-6">
          {/* Header with Navigation */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handlePrev}>
                  <ChevronLeft size={18} />
                </Button>
                <div className="flex items-center gap-2 min-w-[140px] justify-center">
                  <Calendar className="text-primary hidden sm:block" size={20} />
                  <h2 className="text-base sm:text-lg font-semibold whitespace-nowrap">{displayRange}</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={handleNext}>
                  <ChevronRight size={18} />
                </Button>
              </div>

              {/* Employee Selector (Admin Only) */}
              {isAdmin && teamMembers.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-2 sm:border-l sm:pl-4 border-border">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-full sm:w-56 bg-card border-border">
                      <Users size={14} className="mr-2 text-muted-foreground" />
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member._id} value={member._id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* View Mode Tabs */}
            <div className="flex overflow-x-auto w-full md:w-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
              {(["day", "week", "month", "dateRange"] as ViewMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className="capitalize whitespace-nowrap"
                >
                  {mode === "dateRange" ? "Date Range" : mode}
                </Button>
              ))}
            </div>
          </div>

          {/* Detailed Day View */}
          {viewMode === 'day' && attendanceData.length > 0 ? (
            <div className="space-y-6">
              {/* Day Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-foreground mb-1">Start Time</p>
                    <p className="text-2xl font-bold text-primary">{attendanceData[0]?.inTime && attendanceData[0].inTime !== '-' ? attendanceData[0].inTime : '-'}</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/5 border-blue-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-foreground mb-1">Work Duration</p>
                    <p className="text-2xl font-bold text-blue-500">{attendanceData[0]?.workHours || "00:00:00"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-500/5 border-yellow-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-foreground mb-1">Offline Duration</p>
                    <p className="text-2xl font-bold text-yellow-500">{attendanceData[0]?.idleHours || "00:00:00"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/5 border-green-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-foreground mb-1">Total Duration</p>
                    {/* Calculate total duration roughly */}
                    <p className="text-2xl font-bold text-green-500">{stats.timeSpent || "00:00:00"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Timeline Table */}
              <Card className="overflow-hidden border-border bg-card">
                <CardContent className="p-0 overflow-x-auto">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow className="bg-primary hover:bg-primary/90">
                        <TableHead className="text-white font-semibold">Start</TableHead>
                        <TableHead className="text-white font-semibold">End</TableHead>
                        <TableHead className="text-white font-semibold">Type</TableHead>
                        <TableHead className="text-white font-semibold">Duration</TableHead>
                        <TableHead className="text-white font-semibold">Reason</TableHead>
                        <TableHead className="text-white font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceData[0]?.timeline?.map((segment, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/50 border-b border-border/50">
                          <TableCell className="text-foreground font-medium">{segment.start}</TableCell>
                          <TableCell className="text-foreground font-medium">{segment.end}</TableCell>
                          <TableCell className={segment.type === 'Work' ? "text-foreground font-medium" : "text-yellow-500 font-medium"}>
                            {segment.type}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{segment.duration}</TableCell>
                          <TableCell className="text-muted-foreground"></TableCell>
                          <TableCell className="text-muted-foreground"></TableCell>
                        </TableRow>
                      )) || (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                              No activity recorded for this day.
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Standard View for Week/Month
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Time Spent</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-500">{stats.timeSpent}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total Working Time</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-500">{stats.workingTime}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Idle Time</p>
                      <p className="text-2xl sm:text-3xl font-bold text-yellow-500">{stats.idleTime}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Table with Hourly Breakdown */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-primary/5">
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold text-center">In Time</TableHead>
                          <TableHead className="font-semibold text-center">Finish</TableHead>
                          <TableHead className="font-semibold text-center">Work</TableHead>
                          <TableHead className="font-semibold text-center">Idle</TableHead>
                          {HOURLY_COLUMNS.map((hour) => (
                            <TableHead key={hour} className="font-semibold text-center text-xs">
                              {hour}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceData.map((record, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{record.date}</TableCell>
                            <TableCell className="text-center text-sm">
                              {record.inTime || "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {record.finishTime || "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm font-mono">
                              {record.workHours}
                            </TableCell>
                            <TableCell className="text-center text-sm font-mono">
                              {record.idleHours}
                            </TableCell>
                            {HOURLY_COLUMNS.map((hour) => (
                              <TableCell key={hour} className="text-center p-1">
                                <div
                                  className={`rounded px-2 py-1 text-xs font-medium ${getHourColor(
                                    record.hourlyData[hour]
                                  )}`}
                                >
                                  {record.hourlyData[hour] === "Absent" ? "Absent" : ""}
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

        </div>
      </PageGuard>
    </DashboardLayout>
  );
};

export default Attendance;
