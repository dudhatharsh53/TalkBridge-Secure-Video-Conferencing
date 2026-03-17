const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    meetingId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        default: 'Untitled Meeting'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number, // in minutes
        required: true,
        default: 60
    },
    status: {
        type: String,
        enum: ['active', 'ended'],
        default: 'active'
    }
});

module.exports = mongoose.model('Meeting', meetingSchema);

