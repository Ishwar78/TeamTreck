const mongoose = require('mongoose');

async function checkDb() {
    await mongoose.connect('mongodb+srv://shar54ma2334_db_user:Sharma1234@cluster0.ygac3cl.mongodb.net/teamtreck?retryWrites=true&w=majority&appName=Cluster0');

    const db = mongoose.connection.db;

    const sessionIdRaw = '699fc836732a44beb095a010';
    let sessionId;
    try {
        sessionId = new mongoose.Types.ObjectId(sessionIdRaw);
    } catch (e) {
        console.log("Could not parse as object ID, will query as string too");
    }

    const query = sessionId ? { $or: [{ _id: sessionId }, { _id: sessionIdRaw }] } : { _id: sessionIdRaw };
    const session = await db.collection('sessions').findOne(query);

    if (session) {
        console.log("Found Session:");
        console.log(`- ID: ${session._id}`);
        console.log(`  User: ${session.user_id}`);
        console.log(`  Start Time: ${session.start_time}`);
        console.log(`  End Time: ${session.end_time}`);
        console.log(`  Status: ${session.status}`);
        console.log(`  Summary:`, Object.entries(session.summary || {}).map(([k, v]) => `${k}=${v}`).join(', '));
    } else {
        console.log(`Session ${sessionIdRaw} NOT FOUND in sessions collection.`);

        // check if it's maybe under string ID in another collection?
        const actCount = await db.collection('activitylogs').countDocuments({ session_id: sessionIdRaw });
        const actCountObj = sessionId ? await db.collection('activitylogs').countDocuments({ session_id: sessionId }) : 0;
        console.log(`Activity Logs count for string ID: ${actCount}, for ObjectId: ${actCountObj}`);
    }

    process.exit(0);
}

checkDb().catch(console.error);
