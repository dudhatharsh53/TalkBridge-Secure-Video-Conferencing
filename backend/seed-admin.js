const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@talkbridge.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin already exists!');
            process.exit(0);
        }

        const adminUser = new User({
            name: 'System Admin',
            email: adminEmail,
            mobileNo: '0000000000',
            password: 'AdminPassword@123',
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user created successfully!');
        console.log('Email: ' + adminEmail);
        console.log('Password: AdminPassword@123');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
