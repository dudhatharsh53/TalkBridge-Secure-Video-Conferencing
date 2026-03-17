const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const meetings = await Meeting.find({});
    console.log('--- Meeting Data ---');
    meetings.forEach(m => {
        console.log(`ID: ${m.meetingId} | Title: ${m.title} | Status: ${m.status}`);
    });

    // Check for duplicate meetingIds
    const ids = meetings.map(m => m.meetingId);
    const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
    if (duplicates.length > 0) {
        console.log('\n--- DUPLICATES FOUND ---');
        console.log(duplicates);
    } else {
        console.log('\nNo duplicated meetingId found in DB.');
    }

    process.exit(0);
}

check();
