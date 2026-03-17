const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Invitation = require('../models/Invitation');

exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalMeetings = await Meeting.countDocuments();
        const activeMeetings = await Meeting.countDocuments({ status: 'active' });
        const totalInvitations = await Invitation.countDocuments();

        res.status(200).json({
            totalUsers,
            totalMeetings,
            activeMeetings,
            totalInvitations
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin stats', error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

exports.getAllMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.find().populate('createdBy', 'name email').sort({ startTime: -1 });
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching meetings', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, email, mobileNo, role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, mobileNo, role },
            { new: true }
        ).select('-password');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

exports.deleteMeeting = async (req, res) => {
    try {
        await Meeting.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting meeting', error: error.message });
    }
};

exports.getInvitationStats = async (req, res) => {
    try {
        const stats = await Invitation.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const userStats = await Invitation.aggregate([
            {
                $group: {
                    _id: "$sender",
                    sentCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    name: "$user.name",
                    email: "$user.email",
                    sentCount: 1
                }
            }
        ]);

        res.status(200).json({ statusStats: stats, userInvitationStats: userStats });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invitation stats', error: error.message });
    }
};

