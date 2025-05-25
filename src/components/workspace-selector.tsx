"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { useRouter, usePathname } from "next/navigation";
import { CreateWorkspaceModal } from "./workspace/create-workspace-modal";

export function WorkspaceSelector() {
  const { workspaces, currentWorkspace, setCurrentWorkspace, isLoading } =
    useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const lastNavigatedPath = useRef<string | null>(null);

  useEffect(() => {
    setIsNavigating(false);
    return () => {
      setIsNavigating(false);
    };
  }, []);

  useEffect(() => {
    if (pathname) {
      lastNavigatedPath.current = pathname;
      setIsNavigating(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isNavigating]);

  if (isLoading) {
    return <div className="px-4 py-2"></div>;
  }

  if (!currentWorkspace) {
    return null;
  }

  const handleWorkspaceSelect = (workspace: Workspace) => {
    const targetPath = `/workspaces/${workspace._id}/overview`;

    if (isNavigating) {
      return;
    }

    // Allow navigation even if it's the current workspace
    if (targetPath === lastNavigatedPath.current) {
      setIsDropdownOpen(false);
      router.push(targetPath);
      return;
    }

    setIsNavigating(true);
    setIsDropdownOpen(false);

    if (workspace._id !== currentWorkspace._id) {
      setCurrentWorkspace(workspace);
    }

    try {
      setTimeout(() => {
        router.push(targetPath);

        setTimeout(() => {
          setIsNavigating(false);
        }, 2000);
      }, 50);
    } catch (error) {
      console.error("Navigation error:", error);
      setIsNavigating(false);
    }
  };

  const handleCreateWorkspaceClick = () => {
    if (isNavigating) return;
    setIsDropdownOpen(false);
    document.body.style.overflow = "";
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    document.body.style.overflow = "";
    setIsCreateModalOpen(false);
  };

  return (
    <>
      <div className="px-2 py-2">
        <DropdownMenu
          open={isDropdownOpen}
          onOpenChange={(open) => {
            if (open && isNavigating) return;
            setIsDropdownOpen(open);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex justify-between items-center w-full text-left text-gray-200 hover:text-white hover:bg-[#353535]"
              disabled={isNavigating}
            >
              <div className="flex items-center gap-2 overflow-hidden ">
                <div className="h-6 w-6 rounded-md flex items-center justify-center text-white">
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
            onEscapeKeyDown={() => setIsDropdownOpen(false)}
          >
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-200 mb-2 px-2">
                WORKSPACES
              </div>
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace._id}
                  onClick={() => handleWorkspaceSelect(workspace)}
                  className={`flex items-center gap-2 rounded cursor-pointer px-2 py-1.5 hover:bg-[#353535] text-gray-200  ${
                    workspace._id === currentWorkspace._id
                      ? "bg-[#353535]"
                      : "hover:bg-[#282828]"
                  }`}
                  disabled={isNavigating}
                >
                  <div className="h-6 w-6 rounded-md flex items-center justify-center  text-white">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="truncate">{workspace.name}</span>
                </DropdownMenuItem>
              ))}
              <div className="border-t border-[#353535]  my-2"></div>
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer px-2 py-1.5 text-gray-300 hover:bg-[#353535] hover:text-white"
                onClick={handleCreateWorkspaceClick}
                disabled={isNavigating}
              >
                <div className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-[#353535] ">
                  <Plus className="h-4 w-4" />
                </div>
                <span>Create new workspace</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isCreateModalOpen && (
        <CreateWorkspaceModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
