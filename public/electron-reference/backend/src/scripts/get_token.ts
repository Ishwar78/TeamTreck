
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

// Hardcoded from .env
const MONGO_URI = 'mongodb+srv://shar54ma2334_db_user:Sharma1234@cluster0.ygac3cl.mongodb.net/teamtreck?retryWrites=true&w=majority';
const JWT_PRIVATE_KEY = 'dev_private_key_123';

async function main() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    let admin = await User.findOne({ role: { $in: ['admin', 'company_admin'] } }).sort({ _id: -1 });

    if (!admin) {
        console.log('No Company Admin found. Creating one...');
        // Just fail for now as creating a full company structure is complex
        console.error('Please create a company admin manually first.');
        process.exit(1);
    } else {
        console.log('Found Company Admin:', admin.email);
    }

    const payload = {
        user_id: admin._id.toString(),
        company_id: admin.company_id,
        role: admin.role,
        device_id: 'script'
    };

    const token = jwt.sign(payload, JWT_PRIVATE_KEY, {
        algorithm: "HS256",
        expiresIn: "1h",
    });

    console.log('TOKEN_START');
    console.log(token);
    console.log('TOKEN_END');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
