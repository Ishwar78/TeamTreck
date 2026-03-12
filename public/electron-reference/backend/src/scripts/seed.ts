import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Company } from '../models/Company';
import { User } from '../models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamtreck';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Company.deleteMany({});
  await User.deleteMany({});

  // Create demo company
  const company = await Company.create({
    name: 'Demo Corp',
    domain: 'demo.com',
    plan: 'business',
    max_users: 50,
    settings: {
      screenshot_interval: 300,
      idle_threshold: 300,
      max_devices_per_user: 3,
      blur_screenshots: false,
      track_urls: true,
      track_apps: true,
      working_hours: { start: '09:00', end: '18:00', timezone: 'UTC' },
      blocked_apps: [],
      blocked_urls: [],
    },
    subscription: { status: 'active' },
  });

  // Create admin user
  const passwordHash = await bcrypt.hash('Admin@12345', 12);
  await User.create({
    company_id: company._id,
    email: 'admin@demo.com',
    password_hash: passwordHash,
    name: 'Admin User',
    role: 'company_admin',
    status: 'active',
    devices: [],
  });

  // Create test employee
  const empHash = await bcrypt.hash('User@12345', 12);
  await User.create({
    company_id: company._id,
    email: 'employee@demo.com',
    password_hash: empHash,
    name: 'John Employee',
    role: 'user',
    status: 'active',
    devices: [],
  });

  console.log('Seed complete:');
  console.log('  Admin: admin@demo.com / Admin@12345');
  console.log('  Employee: employee@demo.com / User@12345');

  await mongoose.disconnect();
}

seed().catch(console.error);
