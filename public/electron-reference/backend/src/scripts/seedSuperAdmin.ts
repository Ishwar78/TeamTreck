import 'dotenv/config';

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { env } from '../config/env';


async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Mongo Connected');

  const existing = await User.findOne({ role: 'super_admin' });

  if (existing) {
    console.log('Super Admin already exists');
    process.exit(0);
  }

  const password = 'SuperAdmin@123';
  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    email: 'superadmin@teamtreck.com',
    password_hash: hashed,
    name: 'Super Admin',
    role: 'super_admin',
    status: 'active',
  });

  console.log('✅ Super Admin Created');
  console.log('Email: superadmin@teamtreck.com');
  console.log('Password: SuperAdmin@123');

  process.exit(0);
}

seed();
