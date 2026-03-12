require('dotenv').config();
const mongoose = require('mongoose');
const { ActivityLog } = require('./src/models/ActivityLog');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Test dashboard stats aggregation
    try {
        const hours = await ActivityLog.aggregate([
            {
                $match: {
                    company_id: new mongoose.Types.ObjectId("6993eea88f9af18c718c43fc"),
                    interval_start: { $gte: today, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $divide: [{ $subtract: ["$interval_end", "$interval_start"] }, 1000]
                        }
                    }
                }
            }
        ]);
        console.log("Dashboard Stats:", hours);
    } catch (e) { console.error("Dashboard error:", e); }

    // Test attendance aggregation
    try {
        const stats = await ActivityLog.aggregate([
            { $match: { company_id: new mongoose.Types.ObjectId("6993eea88f9af18c718c43fc"), interval_start: { $gte: today, $lte: endOfDay } } },
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
            }
        ]);
        console.log("Attendance Stats:", stats);
    } catch (e) { console.error("Attendance error:", e); }

    process.exit(0);
}
run();
