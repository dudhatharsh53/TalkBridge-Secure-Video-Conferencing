const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');
const dotenv = require('dotenv');
const crypto = require('crypto');
dotenv.config();

async function testInsert() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- Current Data ---');
        const ms = await Meeting.find({});
        ms.forEach(m => console.log(m.meetingId));

        console.log('\n--- Attempting Test Insert ---');
        const testId = crypto.randomUUID();
        console.log('Testing with UUID:', testId);

        // Find an existing user to own this
        const User = require('./models/User');
        const user = await User.findOne({});
        if (!user) {
            console.error('No user found to assign meeting to');
            process.exit(1);
        }

        const m = new Meeting({
            meetingId: testId,
            title: 'Test Meeting',
            createdBy: user._id,
            duration: 30
        });

        await m.save();
        console.log('Successfully saved test meeting.');

        // Clean up
        await Meeting.deleteOne({ meetingId: testId });
        console.log('Cleaned up test meeting.');

        process.exit(0);
    } catch (err) {
        console.error('FAILED TO INSERT MEETING:');
        console.error(err);
        process.exit(1);
    }
}

testInsert();
