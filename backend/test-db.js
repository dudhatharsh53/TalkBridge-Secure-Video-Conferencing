const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

console.log('Connecting to:', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB');
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
