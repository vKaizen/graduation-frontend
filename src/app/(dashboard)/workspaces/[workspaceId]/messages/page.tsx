"use client";

import { useParams } from "next/navigation";
import { MessageCircle } from "lucide-react";

export default function WorkspaceMessagesPage() {
  const params = useParams();
  const workspaceId =
    typeof params.workspaceId === "string"
      ? params.workspaceId
      : Array.isArray(params.workspaceId)
      ? params.workspaceId[0]
      : "";

  return (
    <div className="p-8 bg-[#1a1a1a] min-h-full flex flex-col">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-white mb-6">Messages</h1>
        <p className="text-[#a1a1a1] mb-8">
          This view will display messages in this workspace.
        </p>
        {/* Empty state */}
        <div className="mt-4 p-8 bg-[#252525] rounded-lg border border-[#353535] text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#353535] flex items-center justify-center mb-4">
            <MessageCircle className="h-6 w-6 text-[#a1a1a1]" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No messages yet
          </h3>
          <p className="text-[#a1a1a1] max-w-md mx-auto mb-6">
            Start a conversation with your team members to collaborate on this
            workspace
          </p>
          <button className="px-4 py-2 bg-[#4573D2] hover:bg-[#353535] text-white rounded-md text-sm font-medium transition-colors">
            Start new conversation
          </button>
        </div>
      </div>
    </div>
  );
}
