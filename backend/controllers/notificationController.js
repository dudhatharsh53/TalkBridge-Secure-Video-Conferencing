const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { isRead: true });
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking notification as read', error: error.message });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user.id }, { isRead: true });
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking all notifications as read', error: error.message });
    }
};

exports.createNotification = async (userId, title, message, type, link = '') => {
    try {
        const notification = new Notification({
            user: userId,
            title,
            message,
            type,
            link
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};
