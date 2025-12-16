// backend/controllers/notificationController.js
import Notification from '../models/notification.model.js';

// @desc    Get all notifications for admin
// @route   GET /api/admin/notifications
export const getNotifications = async (req, res) => {
    try {
        // Fetch top 50 notifications, newest first
        const notifications = await Notification.find({ recipientRole: 'admin' })
            .sort({ createdAt: -1 })
            .limit(50);
            
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/admin/notifications/mark-read
export const markNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipientRole: 'admin', isRead: false },
            { $set: { isRead: true } }
        );
        
        res.status(200).json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};