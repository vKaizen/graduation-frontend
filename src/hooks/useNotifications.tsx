"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  type Notification,
} from "@/api-service";

export type NotificationType =
  | "invite_received"
  | "invite_accepted"
  | "invite_rejected"
  | "system_message";

// Re-export the Notification interface for convenience
export type { Notification };

export function useNotifications() {
  const { authState } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications from the API
  const loadNotifications = useCallback(async () => {
    if (!authState.accessToken) {
      console.log("No auth token available, skipping notifications fetch");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Attempting to fetch notifications from API...");
      console.log(
        "Using auth token:",
        authState.accessToken.substring(0, 10) + "..."
      );

      const notificationsData = await fetchNotifications();

      console.log("Received notifications from API:", notificationsData);
      console.log(
        "Number of notifications received:",
        notificationsData.length
      );

      if (notificationsData.length === 0) {
        console.log("No notifications were returned from the API");
      } else {
        console.log("First notification type:", notificationsData[0].type);
        console.log("First notification title:", notificationsData[0].title);
      }

      setNotifications(notificationsData);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      // Log more details about the error
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      }
      setError("Failed to load your notifications. Please try again.");
      // Don't set notifications to empty, keep the previous state
    } finally {
      setLoading(false);
    }
  }, [authState.accessToken]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mark a notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        // Optimistically update the UI
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );

        // Then update the server
        await markNotificationAsRead(notificationId);
      } catch (error) {
        console.error(`Failed to mark notification as read:`, error);
        // Rollback on error
        await loadNotifications();
      }
    },
    [loadNotifications]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistically update the UI
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );

      // Then update the server
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error(`Failed to mark all notifications as read:`, error);
      // Rollback on error
      await loadNotifications();
    }
  }, [loadNotifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      // Optimistically update the UI
      setNotifications([]);

      // Then update the server
      await clearAllNotifications();
    } catch (error) {
      console.error(`Failed to clear notifications:`, error);
      // Rollback on error
      await loadNotifications();
    }
  }, [loadNotifications]);

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications: clearAll,
    refreshNotifications: loadNotifications,
  };
}
