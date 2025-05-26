"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import type { Workspace } from "@/types";

interface WorkspaceHeaderProps {
  workspace: Workspace | null;
}

export function WorkspaceHeader({ workspace }: WorkspaceHeaderProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you would call an API to update the favorite status
  };

  if (!workspace) {
    return (
      <div className="bg-[#1a1a1a] py-6 px-6 border-b border-[#252525]">
        <div className="flex items-center space-x-3">
          <div className="h-16 w-16 rounded-full bg-[#252525] animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-6 w-64 bg-[#252525] animate-pulse rounded"></div>
            <div className="h-4 w-48 bg-[#252525] animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#252525] to-[#000000] h-32 z-0"></div>

      {/* Header Content */}
      <div className="relative z-10 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Workspace Avatar */}
            <div className="h-20 w-20 bg-[#353535] rounded-full flex items-center justify-center text-4xl font-light text-white">
              {workspace?.name?.charAt(0) || "W"}
            </div>

            {/* Workspace Info */}
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-semibold text-white">
                  {workspace?.name || "Workspace"}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-[#a1a1a1] hover:text-yellow-400"
                  onClick={toggleFavorite}
                >
                  <Star
                    className={`h-5 w-5 ${
                      isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                    }`}
                  />
                </Button>
              </div>
              <p className="text-[#a1a1a1] text-sm mt-1">
                {workspace?.description || "Click to add team description..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
