const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkIndexes() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('meetings');
    const indexes = await collection.indexes();
    console.log('--- Current Indexes on "meetings" collection ---');
    console.log(JSON.stringify(indexes, null, 2));

    // Check if duplicate entries are there
    const m = await collection.findOne({ roomId: null });
    if (m) console.log('Found entry with roomId: null');

    process.exit(0);
}

checkIndexes();
