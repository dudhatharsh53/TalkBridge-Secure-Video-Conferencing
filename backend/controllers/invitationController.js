const Invitation = require('../models/Invitation');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

exports.sendInvitation = async (req, res) => {
    try {
        const { meetingId, receiverEmail } = req.body;
        const senderId = req.user.id;
        const lowerEmail = receiverEmail.toLowerCase();

        // Check if receiver exists as a registered user
        const receiver = await User.findOne({ email: lowerEmail });

        const invitation = new Invitation({
            meetingId,
            sender: senderId,
            receiverEmail: lowerEmail,
            receiver: receiver ? receiver._id : null
        });

        await invitation.save();

        if (receiver) {
            await createNotification(
                receiver._id,
                'New Meeting Invitation',
                `You have been invited to join a meeting (ID: ${meetingId}) by ${req.user.name}`,
                'invitation',
                `/dashboard`
            );
        }

        res.status(201).json({ message: 'Invitation sent successfully', invitation });
    } catch (error) {
        res.status(500).json({ message: 'Server error sending invitation', error: error.message });
    }
};

exports.getSentInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({ sender: req.user.id })
            .populate('receiver', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(invitations);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching sent invitations', error: error.message });
    }
};

exports.getReceivedInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({
            $or: [
                { receiver: req.user.id },
                { receiverEmail: req.user.email }
            ]
        }).populate('sender', 'name email').sort({ createdAt: -1 });

        res.status(200).json(invitations);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching received invitations', error: error.message });
    }
};

exports.updateInvitationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { invitationId } = req.params;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const invitation = await Invitation.findById(invitationId).populate('sender', 'name email');
        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        invitation.status = status;
        await invitation.save();

        // Notify sender about status change
        await createNotification(
            invitation.sender._id,
            `Invitation ${status}`,
            `${req.user.name} has ${status} your invitation for meeting ${invitation.meetingId}`,
            status,
            '/dashboard'
        );

        res.status(200).json({ message: `Invitation ${status}`, invitation });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating invitation status', error: error.message });
    }
};

