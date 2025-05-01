"use client";

import { TabsContent } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

// Dynamically import components to avoid server/client mismatch
const NotificationsList = dynamic(
  () => import("@/components/notifications/NotificationsList"),
  { ssr: false }
);

const InvitationsList = dynamic(
  () => import("@/components/invites/InvitationsList"),
  { ssr: false }
);

export function InboxContent() {
  return (
    <div className="bg-[#111111] rounded-lg border border-[#353535] overflow-hidden">
      <TabsContent value="notifications" className="p-4 m-0">
        <NotificationsList />
      </TabsContent>

      <TabsContent value="invitations" className="p-4 m-0">
        <InvitationsList />
      </TabsContent>
    </div>
  );
}
