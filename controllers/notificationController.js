const Notification = require("../models/Notification");

// @desc   Get all notifications for logged-in user
// @route  GET /api/notifications
const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
        res.json({ notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Mark all notifications as read
// @route  PUT /api/notifications/read
const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc   Mark single notification as read
// @route  PUT /api/notifications/:id/read
const markOneRead = async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true }
        );
        res.json({ message: "Notification marked as read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getMyNotifications, markAllRead, markOneRead };
