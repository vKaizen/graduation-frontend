"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
} from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { cva } from "class-variance-authority";
import { acceptInvite } from "@/api-service";
import { useAuth } from "@/contexts/AuthContext";

const badgeStyles = cva(
  "absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full text-[10px] font-medium",
  {
    variants: {
      variant: {
        default: "bg-[#4573D2] text-white",
        subtle: "bg-[#4573D2]/20 text-[#4573D2]",
      },
      size: {
        default: "h-5 w-5 -mt-1 -mr-1",
        small: "h-4 w-4 -mt-0.5 -mr-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type BadgeProps = {
  count: number;
  variant?: "default" | "subtle";
  size?: "default" | "small";
};

const NotificationBadge = ({ count, variant, size }: BadgeProps) => {
  if (count <= 0) return null;
  return (
    <span className={badgeStyles({ variant, size })}>
      {count > 9 ? "9+" : count}
    </span>
  );
};

type WorkspaceInviteNotificationProps = {
  notification: Notification;
  onAccept: () => void;
  onDismiss: () => void;
};

const WorkspaceInviteNotification = ({
  notification,
  onAccept,
  onDismiss,
}: WorkspaceInviteNotificationProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      await onAccept();
    } catch (err) {
      setError((err as Error).message || "Failed to accept invitation");
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = notification.timestamp
    ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })
    : "";

  return (
    <div className="p-4 border-b border-[#353535] last:border-0 bg-[#252525] hover:bg-[#353535] transition-colors">
      <div className="flex items-start gap-2">
        <div className="p-2 rounded-full bg-[#4573D2]/20 text-[#4573D2]">
          <Users size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">
              Workspace Invitation
            </h4>
            <span className="text-xs text-[#a1a1a1] flex items-center gap-1">
              <Clock size={12} />
              {timeAgo}
            </span>
          </div>
          <p className="text-sm text-[#a1a1a1] mt-1">
            <strong className="text-white">
              {notification.data.inviterName}
            </strong>{" "}
            invited you to join{" "}
            <strong className="text-white">
              {notification.data.workspaceName}
            </strong>
          </p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button
              className="px-3 py-1 text-xs bg-[#4573D2] text-white rounded-md hover:bg-[#3a62b3] transition-colors disabled:opacity-50"
              onClick={handleAccept}
              disabled={loading}
            >
              {loading ? "Accepting..." : "Accept"}
            </button>
            <button
              className="px-3 py-1 text-xs bg-[#353535] text-white rounded-md hover:bg-[#454545] transition-colors"
              onClick={onDismiss}
              disabled={loading}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

type InviteStatusNotificationProps = {
  notification: Notification;
  onDismiss: () => void;
};

const InviteStatusNotification = ({
  notification,
  onDismiss,
}: InviteStatusNotificationProps) => {
  const timeAgo = notification.timestamp
    ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })
    : "";

  // Get the correct status message
  const getStatusMessage = () => {
    switch (notification.data.status) {
      case "accepted":
        return "Your workspace invitation was accepted.";
      case "expired":
        return "Your workspace invitation has expired.";
      case "revoked":
        return "Your workspace invitation was revoked.";
      default:
        return "Your workspace invitation status has changed.";
    }
  };

  // Get the correct icon color based on status
  const getStatusColor = () => {
    switch (notification.data.status) {
      case "accepted":
        return "bg-green-500/20 text-green-400";
      case "expired":
      case "revoked":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-[#353535] text-[#a1a1a1]";
    }
  };

  return (
    <div className="p-4 border-b border-[#353535] last:border-0 bg-[#252525] hover:bg-[#353535] transition-colors">
      <div className="flex items-start gap-2">
        <div className={`p-2 rounded-full ${getStatusColor()}`}>
          <Users size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">
              Invitation Update
            </h4>
            <span className="text-xs text-[#a1a1a1] flex items-center gap-1">
              <Clock size={12} />
              {timeAgo}
            </span>
          </div>
          <p className="text-sm text-[#a1a1a1] mt-1">
            {getStatusMessage()} Workspace:{" "}
            <strong className="text-white">
              {notification.data.workspaceName}
            </strong>
          </p>
          <div className="mt-2">
            <button
              className="px-3 py-1 text-xs bg-[#353535] text-white rounded-md hover:bg-[#454545] transition-colors"
              onClick={onDismiss}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { authState } = useAuth();

  const {
    notifications,
    unreadNotifications,
    markAsRead,
    clearNotification,
    markAllAsRead,
    clearAllNotifications,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadNotifications.length > 0) {
      markAllAsRead();
    }
  };

  const handleAcceptInvite = async (notification: Notification) => {
    try {
      await acceptInvite(
        authState.accessToken || "",
        notification.data.inviteToken
      );
      clearNotification(notification.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to accept invite:", error);
      throw error;
    }
  };

  // Render notification based on type
  const renderNotification = (notification: Notification) => {
    switch (notification.type) {
      case "workspace-invite":
        return (
          <WorkspaceInviteNotification
            key={notification.id}
            notification={notification}
            onAccept={() => handleAcceptInvite(notification)}
            onDismiss={() => clearNotification(notification.id)}
          />
        );
      case "invite-status-changed":
        return (
          <InviteStatusNotification
            key={notification.id}
            notification={notification}
            onDismiss={() => clearNotification(notification.id)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-[#353535] relative focus:outline-none"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <Bell size={20} className="text-white" />
        <NotificationBadge count={unreadNotifications.length} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#1a1a1a] rounded-md shadow-lg z-50 overflow-hidden border border-[#353535]">
          <div className="p-3 border-b border-[#353535] flex items-center justify-between">
            <h3 className="font-medium text-sm text-white">Notifications</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#4573D2] hover:text-[#3a62b3] flex items-center"
                title="Mark all as read"
              >
                <Check size={14} className="mr-1" /> Mark all read
              </button>
              <button
                onClick={clearAllNotifications}
                className="text-xs text-[#a1a1a1] hover:text-white flex items-center"
                title="Clear all notifications"
              >
                <X size={14} className="mr-1" /> Clear all
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-[#a1a1a1] text-sm">
                No notifications
              </div>
            ) : (
              notifications.map(renderNotification)
            )}
          </div>

          <div className="p-2 border-t border-[#353535] flex justify-center">
            <button
              className="text-xs text-[#a1a1a1] hover:text-white flex items-center"
              onClick={toggleDropdown}
            >
              {isOpen ? (
                <>
                  <ChevronUp size={14} className="mr-1" /> Close
                </>
              ) : (
                <>
                  <ChevronDown size={14} className="mr-1" /> View more
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
