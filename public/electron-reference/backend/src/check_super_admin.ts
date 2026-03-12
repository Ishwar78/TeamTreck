import mongoose from 'mongoose';
import { User } from './models/User';
import { env } from './config/env';

async function checkSuperAdmin() {
    await mongoose.connect(env.MONGODB_URI);
    const superAdmin = await User.findOne({ role: 'super_admin' });
    if (superAdmin) {
        console.log('Super Admin found:');
        console.log('ID:', superAdmin._id);
        console.log('Email:', superAdmin.email);
        console.log('Role:', superAdmin.role);
        console.log('Status:', superAdmin.status);
    } else {
        console.log('No Super Admin found with role "super_admin"');
    }
    await mongoose.disconnect();
}

checkSuperAdmin().catch(console.error);
