const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const crypto = require('crypto');

// Store timeouts in memory to allow clearing if meeting is manually ended
const meetingTimeouts = {};

exports.createMeeting = async (req, res) => {
    try {
        const { title, duration } = req.body;
        console.log('--- Meeting Creation Request ---');
        console.log('Payload:', { title, duration });
        console.log('User ID from Token:', req.user?.id);

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const meetingId = crypto.randomUUID();
        console.log('[DEBUG] Generated Meeting ID:', meetingId);

        let rawUserId = req.user.id || req.user._id || req.user.sub;
        console.log('[DEBUG] Raw User ID from Token:', rawUserId);

        if (!rawUserId) {
            console.error('[DEBUG] Authentication error: User ID missing from request payload');
            return res.status(401).json({ message: 'Authentication required' });
        }

        let creatorId;
        try {
            creatorId = new mongoose.Types.ObjectId(rawUserId);
        } catch (idErr) {
            console.error('[DEBUG] ID Format Error:', rawUserId, idErr.message);
            return res.status(400).json({ message: 'Invalid ID format in session token' });
        }

        const meeting = new Meeting({
            meetingId,
            title: String(title || 'Quick Sync').trim(),
            duration: Number(duration) || 60,
            createdBy: creatorId,
            participants: [creatorId]
        });

        console.log('[DEBUG] Attempting to save meeting to MongoDB...');
        await meeting.save();
        console.log('[DEBUG] Success: Meeting saved to DB');

        // Set auto-end timeout
        const dur = Number(duration) || 60;
        const durationInMs = dur * 60 * 1000;

        meetingTimeouts[meetingId] = setTimeout(async () => {
            try {
                const mtg = await Meeting.findOne({ meetingId });
                if (mtg && mtg.status === 'active') {
                    mtg.status = 'ended';
                    mtg.endTime = new Date();
                    await mtg.save();
                    console.log(`Meeting ${meetingId} auto-ended.`);
                }
            } catch (err) {
                console.error('Auto-end failed:', err);
            }
        }, durationInMs);

        res.status(201).json(meeting);
    } catch (error) {
        try {
            const fs = require('fs');
            fs.appendFileSync('meeting_error.log', `[${new Date().toISOString()}] ${error.message}\n${error.stack}\n`);
        } catch (e) { }
        console.error('--- CRITICAL: Meeting Creation Failed ---');
        console.error('Message:', error.message);
        console.error('Stack Trace:', error.stack);

        // Detailed validation error capture
        if (error.name === 'ValidationError') {
            const vErr = Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            }));
            console.error('Validation Details:', vErr);
            return res.status(400).json({
                message: 'MongoDB Validation Failed',
                errors: vErr
            });
        }

        res.status(500).json({
            message: 'Server Error during meeting creation',
            error: error.message,
            stack: error.stack // Temporarily return stack to frontend for debugging
        });
    }
};

exports.joinMeeting = async (req, res) => {
    try {
        const { meetingId } = req.body;
        const meeting = await Meeting.findOne({ meetingId });

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        if (meeting.status === 'ended') {
            return res.status(403).json({ message: 'Meeting has already ended and cannot be rejoined' });
        }

        // Add user to participants if not already there
        const isParticipant = meeting.participants.some(p => p.toString() === req.user.id);
        if (!isParticipant) {
            // Check for participant limit (optional extra feature)
            if (meeting.participants.length >= 10) {
                return res.status(403).json({ message: 'Meeting is full (10 participants limit reached)' });
            }
            meeting.participants.push(req.user.id);
            await meeting.save();
        }

        res.status(200).json(meeting);
    } catch (error) {
        res.status(500).json({ message: 'Error joining meeting', error: error.message });
    }
};

exports.getMeetingHistory = async (req, res) => {
    try {
        const history = await Meeting.find({
            $or: [
                { createdBy: req.user.id },
                { participants: req.user.id }
            ]
        }).populate('createdBy', 'name email').sort({ startTime: -1 });

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history', error: error.message });
    }
};

exports.endMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const meeting = await Meeting.findOne({ meetingId });

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Only creator or admin can end
        if (meeting.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'No permission to end this meeting' });
        }

        meeting.status = 'ended';
        meeting.endTime = new Date();
        await meeting.save();

        if (meetingTimeouts[meetingId]) {
            clearTimeout(meetingTimeouts[meetingId]);
            delete meetingTimeouts[meetingId];
        }

        res.status(200).json({ message: 'Meeting ended successfully', meeting });
    } catch (error) {
        res.status(500).json({ message: 'Error ending meeting', error: error.message });
    }
};

exports.getMeetingDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting.findOne({ meetingId: id })
            .populate('createdBy', 'name email')
            .populate('participants', 'name email');

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        res.status(200).json(meeting);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching meeting details', error: error.message });
    }
};

