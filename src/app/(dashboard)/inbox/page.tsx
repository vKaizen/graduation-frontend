"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/useNotifications";
import { InboxHeader } from "@/components/inbox/InboxHeader";
import { InboxTabsBar } from "@/components/inbox/InboxTabsBar";
import { InboxContent } from "@/components/inbox/InboxContent";

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<string>("notifications");
  const {
    unreadCount = 0,
    markAllAsRead,
    clearAllNotifications,
  } = useNotifications();

  return (
    <div className="py-8 w-full bg-[#000000] min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header Component */}
        <InboxHeader title="Inbox" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            {/* Tabs Component */}
            <Tabs
              defaultValue="notifications"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              {/* Tabs Bar Component */}
              <InboxTabsBar
                activeTab={activeTab}
                unreadCount={unreadCount}
                onMarkAllAsRead={markAllAsRead}
                onClearAll={clearAllNotifications}
              />

              {/* Content Component */}
              <InboxContent />
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
