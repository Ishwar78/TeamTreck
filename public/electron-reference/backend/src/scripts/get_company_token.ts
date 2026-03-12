import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Company } from '../models/Company';

// Hardcoded from .env
const MONGO_URI = 'mongodb+srv://shar54ma2334_db_user:Sharma1234@cluster0.ygac3cl.mongodb.net/teamtreck?retryWrites=true&w=majority';
const JWT_SECRET = 'backend_jwt_secret_key_123'; // Using default dev fallback if env fails

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Find a Company Admin
        const admin = await User.findOne({ role: { $in: ['admin', 'company_admin'] } });

        if (!admin) {
            console.log('No Company Admin found. Creating one...');
            // logic to create if needed, but for now just fail
            process.exit(1);
        }

        console.log(`Found Company Admin: ${admin.email}`);

        const token = jwt.sign(
            {
                user_id: admin._id,
                company_id: admin.company_id,
                role: admin.role
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('TOKEN_START');
        console.log(token);
        console.log('TOKEN_END');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
