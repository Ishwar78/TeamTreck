import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Plan } from '../models/Plan';

// Hardcoded from .env
const MONGO_URI = 'mongodb+srv://shar54ma2334_db_user:Sharma1234@cluster0.ygac3cl.mongodb.net/teamtreck?retryWrites=true&w=majority';

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        // 1. Create a Plan if not exists
        let plan = await Plan.findOne({ name: 'Pro Plan' });
        if (!plan) {
            plan = await Plan.create({
                name: 'Pro Plan',
                price_monthly: 29,
                price_yearly: 290,
                currency: 'USD',
                max_users: 10,
                max_storage_gb: 50,
                features: ['Screenshots', 'Time Tracking', 'Reports'],
                isActive: true
            });
            console.log('Created Plan:', plan.name);
        }

        // 2. Create a Company
        const companyName = `Test Company ${Date.now()}`;
        const domain = `test${Date.now()}.com`;
        const company = await Company.create({
            name: companyName,
            domain: domain,
            plan_id: plan._id,
            subscription_status: 'active',
            settings: {
                screenshot_frequency: 10,
                idle_timeout_minutes: 5,
                work_days: [1, 2, 3, 4, 5],
                work_hours: { start: '09:00', end: '18:00' }
            }
        });
        console.log('Created Company:', company.name, company._id);

        // 3. Create Company Admin
        const email = `admin${Date.now()}@test.com`;
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await User.create({
            name: 'Test Admin',
            email,
            password_hash: hashedPassword,
            role: 'company_admin',
            company_id: company._id,
            status: 'active'
        });
        console.log('Created Admin:', admin.email);
        console.log('Password:', password);

        console.log('DONE');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
