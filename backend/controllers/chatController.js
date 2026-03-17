const Message = require('../models/Message');
const PrivateMessage = require('../models/PrivateMessage');
const User = require('../models/User');

// Meeting Chat
exports.getMessages = async (req, res) => {
    try {
        const { meetingId } = req.params;
        const messages = await Message.find({ meetingId }).populate('sender', 'name');
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};

exports.saveMessage = async (meetingId, sender, message) => {
    try {
        const newMessage = new Message({ meetingId, sender, message });
        await newMessage.save();
        return await newMessage.populate('sender', 'name');
    } catch (error) {
        console.error('Error saving message:', error);
    }
};

// Private Chat
exports.getPrivateMessages = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const messages = await PrivateMessage.find({
            $or: [
                { sender: req.user.id, receiver: otherUserId },
                { sender: otherUserId, receiver: req.user.id }
            ]
        }).sort({ timestamp: 1 });

        // Mark received messages as seen
        await PrivateMessage.updateMany(
            { sender: otherUserId, receiver: req.user.id, status: { $ne: 'seen' } },
            { $set: { status: 'seen' } }
        );

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching private messages', error: error.message });
    }
};

exports.savePrivateMessage = async (sender, receiver, message) => {
    try {
        const newMessage = new PrivateMessage({ sender, receiver, message, status: 'sent' });
        await newMessage.save();
        return newMessage;
    } catch (error) {
        console.error('Error saving private message:', error);
    }
};

exports.getChattedUsers = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all users current user has chatted with
        const sentMessages = await PrivateMessage.find({ sender: userId }).distinct('receiver');
        const receivedMessages = await PrivateMessage.find({ receiver: userId }).distinct('sender');

        // Convert to strings for proper deduplication in Set
        const allTargetIds = [...sentMessages, ...receivedMessages].map(id => id.toString());
        const userIds = [...new Set(allTargetIds)].filter(id => id !== userId);

        const chats = [];
        for (const otherUserId of userIds) {
            const lastMessage = await PrivateMessage.findOne({
                $or: [
                    { sender: userId, receiver: otherUserId },
                    { sender: otherUserId, receiver: userId }
                ]
            }).sort({ timestamp: -1 });

            const unreadCount = await PrivateMessage.countDocuments({
                sender: otherUserId,
                receiver: userId,
                status: { $ne: 'seen' }
            });

            const user = await User.findById(otherUserId).select('name email');

            if (user) {
                chats.push({
                    user,
                    lastMessage: lastMessage ? lastMessage.message : '',
                    lastMessageTime: lastMessage ? lastMessage.timestamp : null,
                    unreadCount
                });
            }
        }

        // Sort by last message time (Descending)
        chats.sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
        });

        res.status(200).json(chats);
    } catch (error) {
        console.error('Error in getChattedUsers:', error);
        res.status(500).json({ message: 'Error fetching chatted users', error: error.message });
    }
};

exports.markMessagesAsSeen = async (req, res) => {
    try {
        const { otherUserId } = req.body;
        await PrivateMessage.updateMany(
            { sender: otherUserId, receiver: req.user.id, status: { $ne: 'seen' } },
            { $set: { status: 'seen' } }
        );
        res.status(200).json({ message: 'Messages marked as seen' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating messages status', error: error.message });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User identity lost. Please logout and login again.' });
        }
        const users = await User.find({
            $and: [
                { _id: { $ne: req.user.id } },
                {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).select('name email');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error searching users', error: error.message });
    }
};
