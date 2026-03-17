const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('meetings');

    console.log('--- Attempting to drop roomId_1 index ---');
    try {
        await collection.dropIndex('roomId_1');
        console.log('Successfully dropped "roomId_1" index.');
    } catch (e) {
        console.error('Error dropping index (it may not exist or cannot be dropped):', e.message);
    }

    // Also drop any other unique ones that shouldn't be there 
    // unless they are in the current model.
    // Current model has: _id (implicit), meetingId

    process.exit(0);
}

fix();
