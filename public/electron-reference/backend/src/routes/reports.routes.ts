import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { Session } from '../models/Session';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { Company } from '../models/Company';
import { sendAttendanceReportEmail } from '../services/mail.service';
import { Types } from 'mongoose';

const router = Router();

// GET /summary - Overall company / user stats and chart data
router.get('/summary', authenticate, async (req: any, res, next) => {
    try {
        const companyId = new Types.ObjectId(req.auth.company_id as string);
        const { period, userId, startDate, endDate } = req.query;

        const matchQuery: any = { company_id: companyId };

        if (req.auth.role === 'employee' || req.auth.role === 'intern' || req.auth.role === 'user') {
            matchQuery.user_id = new Types.ObjectId(req.auth.user_id as string);
        } else if (userId && userId !== 'All Users') {
            matchQuery.user_id = new Types.ObjectId(userId as string);
        }

        if (period === 'daily') {
            matchQuery.start_time = { $gte: new Date(new Date().setHours(0, 0, 0, 0)) };
        } else if (period === 'weekly') {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            matchQuery.start_time = { $gte: lastWeek };
        } else if (period === 'monthly') {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            matchQuery.start_time = { $gte: lastMonth };
        } else if (period === 'custom' && startDate && endDate) {
            matchQuery.start_time = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        }

        // Aggregation for totals
        const totalStats = await Session.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalActive: { $sum: "$summary.active_duration" },
                    totalIdle: { $sum: "$summary.idle_duration" },
                    totalDuration: { $sum: "$summary.total_duration" },
                    totalScreenshots: { $sum: "$summary.screenshots_count" },
                    avgScore: { $avg: "$summary.activity_score" }
                }
            }
        ]);

        const stats = totalStats[0] || { totalActive: 0, totalIdle: 0, totalDuration: 0, totalScreenshots: 0, avgScore: 0 };

        // Chart data uses the exact same matchQuery so it reflects the selected period and user
        const weeklyStats = await Session.aggregate([
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$start_time" } },
                    hours: { $sum: "$summary.active_duration" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format weekly data
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const formattedWeekly = weeklyStats.map(d => {
            const date = new Date(d._id);
            return {
                day: days[date.getDay()],
                hours: Math.round((d.hours / 3600) * 10) / 10 // seconds to hours
            };
        });

        res.json({
            success: true,
            totals: {
                active: Math.round((stats.totalActive / 3600) * 10) / 10,
                idle: Math.round((stats.totalIdle / 3600) * 10) / 10,
                total: Math.round((stats.totalDuration / 3600) * 10) / 10,
                screenshots: stats.totalScreenshots,
                avgProd: Math.round(stats.avgScore || 0)
            },
            weekly: formattedWeekly
        });

    } catch (err) {
        next(err);
    }
});

// GET /my-summary - Current employee's stats (Dashboard)
router.get('/my-summary', authenticate, async (req: any, res, next) => {
    try {
        const userId = new Types.ObjectId(req.auth.user_id as string);
        const companyId = new Types.ObjectId(req.auth.company_id as string);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const stats = await ActivityLog.aggregate([
            {
                $match: {
                    user_id: userId,
                    company_id: companyId,
                    interval_start: { $gte: today, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    totalActive: {
                        $sum: {
                            $cond: [{ $eq: ["$idle", false] }, { $divide: [{ $subtract: ["$interval_end", "$interval_start"] }, 1000] }, 0]
                        }
                    },
                    totalIdle: {
                        $sum: {
                            $cond: [{ $eq: ["$idle", true] }, { $divide: [{ $subtract: ["$interval_end", "$interval_start"] }, 1000] }, 0]
                        }
                    }
                }
            }
        ]);

        const result = stats[0] || { totalActive: 0, totalIdle: 0 };
        const totalDuration = result.totalActive + result.totalIdle;

        res.json({
            success: true,
            stats: {
                activeSec: Math.round(result.totalActive),
                idleSec: Math.round(result.totalIdle),
                totalSec: Math.round(totalDuration)
            }
        });
    } catch (err) {
        next(err);
    }
});

// GET /users - Per user stats
router.get('/users', authenticate, requireRole('company_admin', 'sub_admin'), async (req: any, res, next) => {
    try {
        const companyId = new Types.ObjectId(req.auth.company_id as string);
        const { period, userId, startDate, endDate } = req.query;

        const matchQuery: any = { company_id: companyId };

        if (userId && userId !== 'All Users') {
            matchQuery.user_id = new Types.ObjectId(userId as string);
        }

        if (period === 'daily') {
            matchQuery.start_time = { $gte: new Date(new Date().setHours(0, 0, 0, 0)) };
        } else if (period === 'weekly') {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            matchQuery.start_time = { $gte: lastWeek };
        } else if (period === 'monthly') {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            matchQuery.start_time = { $gte: lastMonth };
        } else if (period === 'custom' && startDate && endDate) {
            matchQuery.start_time = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        }

        const userStats = await Session.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$user_id",
                    active: { $sum: "$summary.active_duration" },
                    idle: { $sum: "$summary.idle_duration" },
                    total: { $sum: "$summary.total_duration" },
                    screenshots: { $sum: "$summary.screenshots_count" },
                    avgScore: { $avg: "$summary.activity_score" }
                }
            }
        ]);

        // Populate user details and top app
        const populatedStats = await Promise.all(userStats.map(async (stat) => {
            const user = await User.findById(stat._id).select('name role').lean();

            // Get top app from ActivityLog
            const topApp = await ActivityLog.aggregate([
                { $match: { user_id: stat._id, company_id: companyId } },
                { $group: { _id: "$active_window.app_name", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]);

            return {
                id: stat._id,
                name: user?.name || 'Unknown',
                role: user?.role || 'User',
                activeH: Math.round((stat.active / 3600) * 10) / 10,
                idleH: Math.round((stat.idle / 3600) * 10) / 10,
                totalH: Math.round((stat.total / 3600) * 10) / 10,
                screenshots: stat.screenshots,
                productivity: Math.round(stat.avgScore || 0),
                topApp: topApp[0]?._id || 'N/A'
            };
        }));

        res.json({ success: true, users: populatedStats });

    } catch (err) {
        next(err);
    }
});

// GET /attendance - Detailed attendance sheet
router.get('/attendance', authenticate, async (req: any, res, next) => {
    try {
        const companyId = new Types.ObjectId(req.auth.company_id as string);
        const { userId, startDate, endDate } = req.query;

        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);

        const query: any = {
            company_id: companyId,
            interval_start: {
                $gte: start,
                $lte: end
            }
        };

        if (userId) {
            query.user_id = new Types.ObjectId(userId as string);
        } else if (req.auth.role === 'employee' || req.auth.role === 'intern' || req.auth.role === 'user') {
            // Employees, interns and standard users can only see their own attendance
            query.user_id = new Types.ObjectId(req.auth.user_id as string);
        }

        const stats = await ActivityLog.aggregate([
            { $match: query },
            { $sort: { interval_start: 1 } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$interval_start", timezone: "+05:30" } },
                        user: "$user_id"
                    },
                    inTime: { $first: "$interval_start" },
                    finishTime: { $last: "$interval_end" },
                    activeDuration: {
                        $sum: { $cond: [{ $eq: ["$idle", false] }, { $divide: [{ $subtract: ["$interval_end", "$interval_start"] }, 1000] }, 0] }
                    },
                    idleDuration: {
                        $sum: { $cond: [{ $eq: ["$idle", true] }, { $divide: [{ $subtract: ["$interval_end", "$interval_start"] }, 1000] }, 0] }
                    },
                    hoursActive: { $addToSet: { $hour: { date: "$interval_start", timezone: "+05:30" } } }
                }
            },
            { $sort: { "_id.date": -1 } }
        ]);

        const formatDuration = (seconds: number) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        const populated = await Promise.all(stats.map(async (record) => {
            let timeline: any[] = [];
            if (req.query.detailed === 'true') {
                // Fetch granular activity logs for this user and day
                const dayStart = new Date(record._id.date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(record._id.date);
                dayEnd.setHours(23, 59, 59, 999);

                const logs = await ActivityLog.find({
                    user_id: record._id.user,
                    company_id: companyId,
                    interval_start: { $gte: dayStart, $lte: dayEnd }
                }).sort({ interval_start: 1 });

                if (logs.length > 0) {
                  let lastType: string | null = null;
                    let currentSegment: any = null;

                    logs.forEach((log: any) => {
                        const type = log.idle ? 'Offline' : 'Work';
                        if (type !== lastType) {
                            if (currentSegment) {
                                currentSegment.end = log.interval_start;
                                timeline.push(currentSegment);
                            }
                            currentSegment = { start: log.interval_start, type };
                        }
                        lastType = type;
                    });

                    if (currentSegment) {
                        currentSegment.end = logs[logs.length - 1].interval_end;
                        timeline.push(currentSegment);
                    }

                    // Fill gaps between segments if they are > 60s
                    const finalSegments: any[] = [];
                    for (let i = 0; i < timeline.length; i++) {
                        if (i > 0) {
                            const prevEnd = new Date(timeline[i - 1].end).getTime();
                            const nextStart = new Date(timeline[i].start).getTime();
                            if (nextStart - prevEnd > 60000) {
                                finalSegments.push({
                                    start: new Date(prevEnd).toISOString(),
                                    end: new Date(nextStart).toISOString(),
                                    type: 'Offline',
                                    duration: formatDuration(Math.floor((nextStart - prevEnd) / 1000))
                                });
                            }
                        }
                        const seg = timeline[i];
                        finalSegments.push({
                            ...seg,
                            duration: formatDuration(Math.floor((new Date(seg.end).getTime() - new Date(seg.start).getTime()) / 1000))
                        });
                    }
                    timeline = finalSegments;
                }
            }

            const hourlyData: Record<string, string> = {};
            const hoursToCheck = ["7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];

            hoursToCheck.forEach(h => {
                let hour = parseInt(h.split(' ')[0]);
                if (h.includes('PM') && hour !== 12) hour += 12;
                if (h.includes('AM') && hour === 12) hour = 0;

                const hasSession = record.hoursActive?.includes(hour);

                if (hasSession) hourlyData[h] = "Active";
            });

            return {
                date: record._id.date,
                inTime: record.inTime,
                finishTime: record.finishTime,
                workHours: formatDuration(record.activeDuration),
                idleHours: formatDuration(record.idleDuration),
                hourlyData,
                user_id: record._id.user,
                timeline
            };
        }));

        res.json({ success: true, data: populated });

    } catch (err) {
        next(err);
    }
});

// POST /attendance/send-email - Send report via email
router.post('/attendance/send-email', authenticate, requireRole('company_admin', 'sub_admin', 'custom'), async (req: any, res, next) => {
    try {
        const { userId, startDate, endDate, periodDisplay, stats } = req.body;
        const companyId = new Types.ObjectId(req.auth.company_id as string);

        if (!userId || !startDate || !endDate) {
            throw new Error('User ID and date range are required');
        }

        const user = await User.findById(userId).select('name email').lean();
        if (!user) {
            throw new Error('User not found');
        }

        const company = await Company.findById(companyId).select('name').lean();
        if (!company) {
            throw new Error('Company not found');
        }

        // Send email
        await sendAttendanceReportEmail(
            user.email,
            user.name,
            company.name,
            periodDisplay,
            stats
        );

        res.json({ success: true, message: 'Report sent successfully' });

    } catch (err) {
        next(err);
    }
});

export const reportRoutes = router;
