import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env explicitly
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { TimeClaim } from './src/models/TimeClaim';
import { ActivityLog } from './src/models/ActivityLog';

async function run() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI not found in .env");
        
        await mongoose.connect(uri);
        console.log("Connected to DB");

        const claimCount = await TimeClaim.countDocuments();
        console.log("Total Claims:", claimCount);

        const latestClaim = await TimeClaim.findOne().sort({ createdAt: -1 }).populate('user_id', 'name');
        console.log("Latest Claim:", JSON.stringify(latestClaim, null, 2));

        if (latestClaim) {
            console.log("Finding logs for user:", latestClaim.user_id);
            const logs = await ActivityLog.find({
                user_id: latestClaim.user_id,
                company_id: latestClaim.company_id,
                // Look for logs on the same date as the claim
                timestamp: {
                    $gte: new Date(latestClaim.date),
                    $lte: new Date(new Date(latestClaim.date).getTime() + 24*60*60*1000)
                }
            }).limit(10);
            
            console.log(`Found ${logs.length} logs for the claim date ${latestClaim.date}`);
            if (logs.length > 0) {
                console.log("Example log interval_start:", logs[0].interval_start.toISOString());
            }
        }

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
