"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Share2, Star } from "lucide-react";
import type { Project } from "@/types";

export function ProjectHeader({ project }: { project: Project | null }) {
  if (!project) {
    return (
      <div className="border-b border-[#353535] bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <span className="text-gray-400">Loading project...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[#353535] bg-[#1a1a1a]">
      <div className="container mx-auto px-5 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-white text-sm"
            style={{ backgroundColor: project.color || "#4573D2" }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-lg font-medium text-white">{project.name}</h1>
          <button className="text-gray-400 hover:text-white">
            <Star className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2 mr-1">
            <Avatar className="border-2 border-[#1a1a1a] h-6 w-6">
              <AvatarFallback className="text-xs">CX</AvatarFallback>
            </Avatar>
            <Avatar className="border-2 border-[#1a1a1a] h-6 w-6">
              <AvatarFallback className="text-xs">JD</AvatarFallback>
            </Avatar>
          </div>

          <button className="text-white bg-[#252525] hover:bg-[#303030] px-2 py-1 rounded">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
