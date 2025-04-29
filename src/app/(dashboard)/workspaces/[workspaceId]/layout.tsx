"use client";

import { useParams } from "next/navigation";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";
import { useEffect, useState } from "react";
import { fetchWorkspaceById } from "@/api-service";
import type { Workspace } from "@/types";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const params = useParams();
  const workspaceId =
    typeof params.workspaceId === "string"
      ? params.workspaceId
      : Array.isArray(params.workspaceId)
      ? params.workspaceId[0]
      : "";

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const loadWorkspace = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchWorkspaceById(workspaceId);
        setWorkspace(data);
      } catch (error) {
        console.error("Error loading workspace:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load workspace"
        );
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[#121212]">
        <div className="h-14 px-6 flex items-center text-[#a1a1a1]">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-[#121212]">
        <div className="h-14 px-6 flex items-center text-red-400">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#121212]">
      {/* Workspace Header */}
      <WorkspaceHeader workspace={workspace} />

      {/* Workspace Tabs */}
      <WorkspaceTabs workspaceId={workspaceId} />

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#121212]">{children}</div>
    </div>
  );
}
