"use client";

import { useParams } from "next/navigation";
import { BookOpen } from "lucide-react";

export default function WorkspaceKnowledgePage() {
  // Get workspaceId from params
  const { workspaceId } = useParams();

  return (
    <div className="p-8 bg-[#1a1a1a] min-h-full flex flex-col">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-white mb-6">Knowledge</h1>
        <p className="text-[#a1a1a1] mb-8">
          This view will display knowledge base items for this workspace.
        </p>

        {/* Knowledge placeholder */}
        <div className="mt-4 p-8 bg-[#252525] rounded-lg border border-[#353535] text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#353535] flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-[#a1a1a1]" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Knowledge base empty
          </h3>
          <p className="text-[#a1a1a1] max-w-md mx-auto mb-6">
            Add documents, guides, and resources to create a knowledge base for
            this workspace
          </p>
          <button className="px-4 py-2 bg-[#4573D2] hover:bg-[#353535] text-white rounded-md text-sm font-medium transition-colors">
            Add knowledge item
          </button>
        </div>
      </div>
    </div>
  );
}
