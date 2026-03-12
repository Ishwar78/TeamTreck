const mongoose = require('mongoose');

async function main() {
    require('dotenv').config({ path: './.env' });
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Company = mongoose.connection.collection('companies');
    const company = await Company.findOne({ _id: new mongoose.Types.ObjectId('6993eea88f9af18c718c43fc') });
    console.log("Company:", company ? company.name : 'Not found');

    const User = mongoose.connection.collection('users');
    const users = await User.find({ company_id: new mongoose.Types.ObjectId('6993eea88f9af18c718c43fc') }).toArray();
    console.log("Users in this company:");
    users.forEach(u => console.log(u.email, u.role));

    await mongoose.disconnect();
}

main().catch(console.error);
