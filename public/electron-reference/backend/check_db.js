const mongoose = require('mongoose');

async function main() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://ishwarwebmok:6jT984S7K4lBik9t@cluster0.z5u1o.mongodb.net/webmok?retryWrites=true&w=majority&appName=Cluster0';
    // Let's get URI from .env if needed
    // I will just read .env
    require('dotenv').config({ path: './.env' });
    const connectionUri = process.env.MONGODB_URI || uri;
    console.log("Connecting to:", connectionUri.split('@')[1] || connectionUri);

    await mongoose.connect(connectionUri);
    console.log("Connected to MongoDB");

    const Invitation = mongoose.connection.collection('invitations');
    const invites = await Invitation.find({ email: 'i8033421@gmail.com' }).toArray();
    console.log("Invites for i8033421@gmail.com:", JSON.stringify(invites, null, 2));

    const User = mongoose.connection.collection('users');
    const users = await User.find({ email: 'i8033421@gmail.com' }).toArray();
    console.log("Users for i8033421@gmail.com:", JSON.stringify(users, null, 2));

    await mongoose.disconnect();
}

main().catch(console.error);
