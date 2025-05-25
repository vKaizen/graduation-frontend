"use client";

import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, Info, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

// Helper function to get the notification icon based on type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "invite_received":
      return <Bell className="h-5 w-5 text-[#4573D2]" />;
    case "invite_accepted":
      return <Check className="h-5 w-5 text-green-500" />;
    case "invite_rejected":
      return <X className="h-5 w-5 text-red-500" />;
    case "system_message":
      return <Info className="h-5 w-5 text-yellow-500" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) => {
  const [isMarking, setIsMarking] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const handleMarkAsRead = async () => {
    setIsMarking(true);
    await onMarkAsRead(notification.id);
    setIsMarking(false);
  };

  return (
    <Card
      className={`mb-3 bg-[#252525] border-[#353535] ${
        !notification.read ? "border-l-4 border-l-[#4573D2]" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">{getNotificationIcon(notification.type)}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">
                {notification.title}
              </h4>
              {!notification.read && (
                <Badge
                  variant="outline"
                  className="bg-[#4573D2]/20 text-[#4573D2] border-[#4573D2]/50"
                >
                  New
                </Badge>
              )}
            </div>
            <p className="text-sm text-[#a1a1a1] mt-1">
              {notification.message}
            </p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center text-xs text-[#666666]">
                <Clock className="h-3 w-3 mr-1" />
                {timeAgo}
              </div>
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  disabled={isMarking}
                  className="text-xs text-[#4573D2] hover:text-[#3a62b3] hover:bg-[#4573D2]/10"
                >
                  {isMarking ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    "Mark as read"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function NotificationsList() {
  const {
    notifications,
    loading,
    error,
    markAsRead,
    refreshNotifications,
    unreadCount,
  } = useNotifications();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setIsRefreshing(false);
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4573D2]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-3">{error}</p>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isRefreshing}
          className="bg-[#252525] text-white border-[#353535] hover:bg-[#353535]"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            "Retry"
          )}
        </Button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell className="h-10 w-10 text-[#666666] mx-auto mb-3" />
        <h3 className="text-lg font-medium text-white">No notifications</h3>
        <p className="text-[#a1a1a1] text-sm">You're all caught up!</p>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="mt-4 bg-[#252525] text-white border-[#353535] hover:bg-[#353535]"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="font-medium flex items-center text-white">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-[#4573D2]" variant="default">
              {unreadCount} new
            </Badge>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-[#a1a1a1] hover:text-white hover:bg-[#353535]"
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
      <div className="max-h-[400px] overflow-y-auto notification-container">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
          />
        ))}
      </div>
    </div>
  );
}
