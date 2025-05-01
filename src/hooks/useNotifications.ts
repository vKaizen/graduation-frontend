"use client";

import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";

export type Notification = {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  read: boolean;
};

export function useNotifications() {
  const { authState } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!authState.accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create socket connection
    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
    const socketInstance = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
    });

    // Set up event handlers
    socketInstance.on("connect", () => {
      console.log("Socket connected, authenticating...");
      socketInstance.emit("authenticate", { token: authState.accessToken });
    });

    socketInstance.on("authenticated", (response) => {
      console.log("Authentication response:", response);
      if (response.success) {
        setConnected(true);
        setError(null);
      } else {
        setConnected(false);
        setError(response.error || "Authentication failed");
        socketInstance.disconnect();
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    socketInstance.on("notification", (notification) => {
      console.log("Received notification:", notification);
      setNotifications((prevNotifications) => [
        {
          id: Date.now().toString(), // Use timestamp as ID if none exists
          ...notification,
          timestamp: new Date(notification.timestamp),
          read: false,
        },
        ...prevNotifications,
      ]);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError(`Connection error: ${err.message}`);
      setConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [authState.accessToken]);

  // Mark a notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }, []);

  // Clear a notification
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter(
        (notification) => notification.id !== notificationId
      )
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get only unread notifications
  const unreadNotifications = notifications.filter(
    (notification) => !notification.read
  );

  return {
    socket,
    connected,
    error,
    notifications,
    unreadNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };
}
