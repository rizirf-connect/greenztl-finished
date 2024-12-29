// notification.controller.js
import { notificationService } from "../services/Notificatin.service.js";

// Create a new notification
export const createNotification = async (req, res) => {
  try {
    const notification = await notificationService.create(req.body);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read all notifications
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.read();
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read a notification by ID
export const getNotificationById = async (req, res) => {
  try {
    const notification = await notificationService.readById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a notification
export const updateNotification = async (req, res) => {
  try {
    const notification = await notificationService.update(
      req.params.id,
      req.body
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await notificationService.delete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(204).send(); // No content to send back
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
