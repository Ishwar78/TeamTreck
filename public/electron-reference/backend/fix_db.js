const mongoose = require('mongoose');

async function main() {
    require('dotenv').config({ path: './.env' });
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Invitation = mongoose.connection.collection('invitations');
    await Invitation.deleteOne({ email: 'i8033421@gmail.com' });
    await Invitation.deleteOne({ email: 'shreeradhekrishnacollection2@gmail.com' });

    console.log("Deleted stuck invites!");

    await mongoose.disconnect();
}

main().catch(console.error);
