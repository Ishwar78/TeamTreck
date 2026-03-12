const mongoose = require('mongoose');

async function checkAttendanceQuery() {
    await mongoose.connect('mongodb+srv://shar54ma2334_db_user:Sharma1234@cluster0.ygac3cl.mongodb.net/teamtreck?retryWrites=true&w=majority&appName=Cluster0');

    const db = mongoose.connection.db;

    const companyId = new mongoose.Types.ObjectId("6993eea88f9af18c718c43fc"); // using string for simple query
    // Hardcode dates like backend does
    const start = new Date("2026-03-02T00:00:00.000Z");
    start.setHours(0, 0, 0, 0);

    const end = new Date("2026-03-02T23:59:59.999Z");
    end.setHours(23, 59, 59, 999);

    console.log("Querying Sessions between:", start, "and", end);

    const query = {
        company_id: companyId,
        start_time: {
            $gte: start,
            $lte: end
        }
    };

    const sessions = await db.collection('sessions').find(query).toArray();
    console.log("Sessions found:", sessions.length);
    sessions.forEach(s => console.log(` - ${s._id}, start: ${s.start_time}, total_dur: ${s.summary?.total_duration}`));

    process.exit(0);
}

checkAttendanceQuery().catch(console.error);
