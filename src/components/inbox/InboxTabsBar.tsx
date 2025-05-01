"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2 } from "lucide-react";

interface InboxTabsBarProps {
  activeTab: string;
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export function InboxTabsBar({
  activeTab,
  unreadCount,
  onMarkAllAsRead,
  onClearAll,
}: InboxTabsBarProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#353535] mb-6">
      <div className="flex items-center justify-between p-4">
        <TabsList className="bg-[#252525]">
          <TabsTrigger
            value="notifications"
            className="relative data-[state=active]:bg-[#353535] data-[state=active]:text-white text-[#a1a1a1] hover:text-white px-4"
          >
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4573D2] text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="data-[state=active]:bg-[#353535] data-[state=active]:text-white text-[#a1a1a1] hover:text-white px-4"
          >
            Invitations
          </TabsTrigger>
        </TabsList>

        {activeTab === "notifications" && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkAllAsRead}
              className="bg-[#252525] border-[#353535] text-white hover:bg-[#353535] flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Mark all as read</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="bg-[#252525] border-[#353535] text-white hover:bg-[#353535] flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear all</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
