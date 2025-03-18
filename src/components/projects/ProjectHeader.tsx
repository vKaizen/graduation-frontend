"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Share2, SlidersHorizontal } from "lucide-react";

interface Project {
  id: string;
  name: string;
  color: string;
}

export function ProjectHeader({ project }: { project: Project | null }) {
  if (!project) {
    return (
      <div className="h-14 px-4 flex items-center text-gray-400">
        Loading project...
      </div>
    );
  }

  return (
    <header className="flex items-center justify-between px-4 h-14 border-b border-gray-800">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 ${project.color} rounded flex items-center justify-center`}
          >
            <span className="text-white font-medium">{project.name[0]}</span>
          </div>
          <h1 className="text-white font-semibold text-lg">{project.name}</h1>
        </div>
        <Button variant="outline" className="text-gray-400 border-gray-800">
          <Settings className="h-4 w-4 mr-2" />
          Set status
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          <Avatar className="border-2 border-[#1c1b29]">
            <AvatarFallback>CX</AvatarFallback>
          </Avatar>
          <Avatar className="border-2 border-[#1c1b29]">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
        <Button variant="outline" className="text-gray-400 border-gray-800">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" className="text-gray-400 border-gray-800">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </div>
    </header>
  );
}
