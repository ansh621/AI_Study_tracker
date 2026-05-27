const Notification = require("../DB/Model/notification.model");
const { ensureDailyStudyAlerts } = require("../utils/notification.service");

async function listNotifications(req, res) {
  try {
    await ensureDailyStudyAlerts(req.user.id);

    const notifications = await Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("List notifications error:", error);
    res.status(500).json({ message: "Unable to load notifications" });
  }
}

async function markNotificationRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipientId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ data: notification });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ message: "Unable to update notification" });
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    await Notification.updateMany(
      { recipientId: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ message: "Notifications marked read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ message: "Unable to update notifications" });
  }
}

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
