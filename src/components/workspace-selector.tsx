"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ChevronsUpDown, Users } from "lucide-react";
import { useWorkspace } from "@/contexts/workspace-context";
import { Workspace } from "@/types";
import { useRouter } from "next/navigation";

export function WorkspaceSelector() {
  const { workspaces, currentWorkspace, setCurrentWorkspace, isLoading } =
    useWorkspace();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="px-4 py-2">
        <div className="h-6 w-40 bg-gray-800 animate-pulse rounded"></div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return null;
  }

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    router.push(`/workspaces/${workspace._id}/overview`);
  };

  return (
    <div className="px-2 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex justify-between items-center w-full text-left text-gray-200 hover:text-white hover:bg-[#282828]"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-6 w-6 rounded-md bg-[#303030] flex items-center justify-center text-white">
                <Users className="h-4 w-4" />
              </div>
              <span className="truncate font-medium">
                {currentWorkspace.name}
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56 bg-[#202020] border-[#353535]"
        >
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 mb-2 px-2">
              WORKSPACES
            </div>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace._id}
                onClick={() => handleWorkspaceSelect(workspace)}
                className={`flex items-center gap-2 rounded cursor-pointer px-2 py-1.5 text-gray-200 ${
                  workspace._id === currentWorkspace._id
                    ? "bg-[#353535]"
                    : "hover:bg-[#282828]"
                }`}
              >
                <div className="h-6 w-6 rounded-md bg-[#303030] flex items-center justify-center text-white">
                  <Users className="h-4 w-4" />
                </div>
                <span className="truncate">{workspace.name}</span>
              </DropdownMenuItem>
            ))}
            <div className="border-t border-[#353535] my-2"></div>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer px-2 py-1.5 text-gray-300 hover:bg-[#282828] hover:text-white">
              <div className="h-6 w-6 rounded-md bg-[#252525] flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <span>Create new workspace</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
