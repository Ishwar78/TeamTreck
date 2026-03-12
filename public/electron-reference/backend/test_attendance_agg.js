const mongoose = require('mongoose');

async function testAgg() {
    await mongoose.connect('mongodb+srv://shar54ma2334_db_user:Sharma1234@cluster0.ygac3cl.mongodb.net/teamtreck?retryWrites=true&w=majority&appName=Cluster0');
    const db = mongoose.connection.db;

    const logsAggregation = await db.collection('activitylogs').aggregate([
        {
            $match: {
                company_id: new mongoose.Types.ObjectId("6993eea88f9af18c718c43fc")
            }
        },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$interval_start", timezone: "+05:30" } }, // taking timezone into account ideally, but UTC is standard for $dateToString here.
                    user: "$user_id"
                },
                inTime: { $min: "$interval_start" },
                finishTime: { $max: "$interval_end" },
                activeDuration: {
                    $sum: {
                        $cond: [{ $eq: ["$idle", false] }, { $divide: [{ $subtract: ["$interval_end", "$interval_start"] }, 1000] }, 0]
                    }
                },
                idleDuration: {
                    $sum: {
                        $cond: [{ $eq: ["$idle", true] }, { $divide: [{ $subtract: ["$interval_end", "$interval_start"] }, 1000] }, 0]
                    }
                },
                hoursActive: { $addToSet: { $hour: "$interval_start" } }
            }
        },
        { $sort: { "_id.date": -1 } }
    ]).toArray();

    console.log(logsAggregation);
    process.exit(0);
}
testAgg().catch(console.error);
