import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays as addDay, subWeeks, addWeeks, subMonths, addMonths, eachDayOfInterval } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For consistency if needed later

type ViewMode = "day" | "week" | "month";

const HOURLY_COLUMNS = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM"];

// Helper to generate mock data if API fails or for demo
const generateMockAttendance = (startDate: Date, endDate: Date) => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.map((day) => {
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const isAbsent = Math.random() < 0.1 && !isWeekend;

        const hourlyData: any = {};
        HOURLY_COLUMNS.forEach(h => {
            if (isWeekend || isAbsent) hourlyData[h] = "Absent";
            else hourlyData[h] = Math.random() > 0.2 ? "Active" : "Idle";
        });

        return {
            date: format(day, "yyyy-MM-dd"),
            displayDate: format(day, "dd MMM EEE"),
            inTime: (isWeekend || isAbsent) ? null : "09:00 AM",
            finishTime: (isWeekend || isAbsent) ? null : "06:00 PM",
            workHours: (isWeekend || isAbsent) ? "00:00:00" : "08:15:00",
            idleHours: (isWeekend || isAbsent) ? "00:00:00" : "00:45:00",
            hourlyData,
            status: isWeekend ? "Weekend" : isAbsent ? "Absent" : "Present"
        };
    });
};

const UserAttendance = () => {
    const { token, user } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>("week");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const { startDate, endDate, displayRange } = useMemo(() => {
        let start: Date, end: Date, display: string;
        switch (viewMode) {
            case "day":
                start = end = currentDate;
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
        }
        return { startDate: start, endDate: end, displayRange: display };
    }, [viewMode, currentDate]);

    // Fetch Data
    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            try {
                const startStr = format(startDate, "yyyy-MM-dd");
                const endStr = format(endDate, "yyyy-MM-dd");

                const result = await apiFetch(`/api/reports/attendance?startDate=${startStr}&endDate=${endStr}`, token);

                if (result.success) {
                    const formattedData = result.data.map((item: any) => ({
                        date: item.date,
                        displayDate: format(new Date(item.date), "dd MMM EEE"),
                        inTime: item.inTime ? format(new Date(item.inTime), "hh:mm a") : '-',
                        finishTime: item.finishTime ? format(new Date(item.finishTime), "hh:mm a") : '-',
                        workHours: item.workHours,
                        idleHours: item.idleHours,
                        hourlyData: item.hourlyData || {},
                        status: item.workHours !== "00:00:00" ? "Present" : "Absent" // Basic status logic
                    }));
                    setAttendanceData(formattedData);
                }
            } catch (error) {
                console.error("Failed to fetch attendance", error);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchAttendance();
    }, [startDate, endDate, token]);

    const handlePrev = () => {
        if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
        if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
        if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNext = () => {
        if (viewMode === 'day') setCurrentDate(addDay(currentDate, 1));
        if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Active": return "bg-green-500/20 text-green-400";
            case "Idle": return "bg-yellow-500/20 text-yellow-400";
            case "Absent": return "bg-red-500/20 text-red-400";
            default: return "bg-gray-500/20 text-gray-400";
        }
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-lg">
                    <Button variant="ghost" size="icon" onClick={handlePrev}><ChevronLeft size={18} /></Button>
                    <div className="flex items-center gap-2 min-w-[150px] justify-center font-medium">
                        <Calendar size={16} className="text-primary" />
                        {displayRange}
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleNext}><ChevronRight size={18} /></Button>
                </div>

                <div className="flex bg-secondary/30 p-1 rounded-lg">
                    {(["day", "week", "month"] as ViewMode[]).map((m) => (
                        <Button
                            key={m}
                            variant={viewMode === m ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode(m)}
                            className="capitalize"
                        >
                            {m}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <Card className="border-border/50 bg-secondary/10">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="w-[150px]">Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>In Time</TableHead>
                                    <TableHead>Out Time</TableHead>
                                    <TableHead>Work Hours</TableHead>
                                    {HOURLY_COLUMNS.map(h => <TableHead key={h} className="text-center min-w-[60px]">{h}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceData.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{row.displayDate}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded text-xs ${row.status === 'Present' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {row.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>{row.inTime || '-'}</TableCell>
                                        <TableCell>{row.finishTime || '-'}</TableCell>
                                        <TableCell className="font-mono text-xs">{row.workHours}</TableCell>
                                        {HOURLY_COLUMNS.map(h => (
                                            <TableCell key={h} className="text-center p-1">
                                                <div className={`h-6 w-full rounded flex items-center justify-center text-[10px] ${getStatusColor(row.hourlyData[h])}`}>
                                                    {/* Dot or code */}
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
        </div>
    );
};

export default UserAttendance;
