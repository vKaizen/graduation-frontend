"use client";

import { useParams } from "next/navigation";

export default function WorkspaceWorkPage() {
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
        <h1 className="text-2xl font-semibold text-white mb-6">All work</h1>
        <p className="text-[#a1a1a1]">
          This view will display all work items in this workspace.
        </p>

        {/* Empty state */}
        <div className="mt-8 p-6 bg-[#252525] rounded-lg border border-[#353535] text-center">
          <p className="text-[#a1a1a1] mb-4">
            No work items have been added to this workspace yet
          </p>
          <button className="px-4 py-2 bg-[#4573D2] hover:bg-[#353535] text-white transition-colors">
            Create new item
          </button>
        </div>
      </div>
    </div>
  );
}
