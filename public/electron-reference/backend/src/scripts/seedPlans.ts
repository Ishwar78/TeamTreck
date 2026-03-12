import mongoose from 'mongoose';
import { Plan } from '../models/Plan';

const MONGODB_URI =
    process.env.MONGODB_URI ||
    'mongodb+srv://shar54ma2334_db_user:Sharma1234@cluster0.ygac3cl.mongodb.net/teamtreck?retryWrites=true&w=majority';

const seedPlans = [
    {
        name: 'Starter',
        price_monthly: 49,
        max_users: 10,
        screenshots_per_hour: 12,
        data_retention: '3 Months',
        isActive: true,
        features: ['10 team members', 'Basic reporting', '12 screenshots/hr', '3-month data retention', 'Email support'],
    },
    {
        name: 'Professional',
        price_monthly: 99,
        max_users: 25,
        screenshots_per_hour: 12,
        data_retention: '3 Months',
        isActive: true,
        features: ['25 team members', 'Advanced reporting', 'URL & app tracking', 'Priority support', 'Sub-admin roles'],
    },
    {
        name: 'Team',
        price_monthly: 199,
        max_users: 50,
        screenshots_per_hour: 12,
        data_retention: '6 Months',
        isActive: true,
        features: ['50 team members', 'Custom reports & exports', 'API access', 'Dedicated support', '6-month retention'],
    },
    {
        name: 'Enterprise',
        price_monthly: 499,
        max_users: 200,
        screenshots_per_hour: 12,
        data_retention: '1 Year',
        isActive: true,
        features: ['200+ members', 'Custom integrations', 'SLA guarantee', 'On-premise option', '1-year retention'],
    },
];

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // Upsert plans by name (won't duplicate if run multiple times)
        for (const plan of seedPlans) {
            const existing = await Plan.findOne({ name: plan.name });
            if (existing) {
                await Plan.updateOne({ name: plan.name }, { $set: plan });
                console.log(`Updated plan: ${plan.name}`);
            } else {
                await Plan.create(plan);
                console.log(`Created plan: ${plan.name}`);
            }
        }

        console.log('Plan seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

main();
