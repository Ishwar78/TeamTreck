import mongoose from 'mongoose';
import { env } from './src/config/env';
import { TimeClaim } from './src/models/TimeClaim';
import { ActivityLog } from './src/models/ActivityLog';

async function run() {
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to DB");

    const claims = await TimeClaim.find().sort({ _id: -1 }).limit(1);
    console.log("Latest Claim:", claims[0]);

    if (claims.length > 0) {
        const claim = claims[0];
        const logs = await ActivityLog.find({
            user_id: claim.user_id,
            company_id: claim.company_id,
        }).sort({ interval_start: -1 }).limit(5);

        console.log("Recent Activity Logs for User:", logs);
        
        const claimStart = new Date(`${claim.date}T${claim.startTime.length === 5 ? claim.startTime + ':00' : claim.startTime}`);
        const claimEnd = new Date(`${claim.date}T${claim.endTime.length === 5 ? claim.endTime + ':00' : claim.endTime}`);
        console.log("Server Parsed Claim Start:", claimStart.toISOString());
        console.log("Server Parsed Claim End:", claimEnd.toISOString());
    }

    mongoose.disconnect();
}

run();
