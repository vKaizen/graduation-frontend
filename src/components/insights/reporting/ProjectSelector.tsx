"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Project } from "@/types";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function ProjectSelector({
  projects,
  selectedProjectIds,
  onSelectionChange,
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleProject = (projectId: string) => {
    if (selectedProjectIds.includes(projectId)) {
      // Remove if already selected
      onSelectionChange(selectedProjectIds.filter((id) => id !== projectId));
    } else {
      // Add if not selected
      onSelectionChange([...selectedProjectIds, projectId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(projects.map((project) => project._id));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-3 flex justify-between items-center w-64 cursor-pointer"
      >
        <span>
          {selectedProjectIds.length === 0
            ? "No projects selected"
            : selectedProjectIds.length === projects.length
            ? "All projects"
            : `${selectedProjectIds.length} project${
                selectedProjectIds.length !== 1 ? "s" : ""
              }`}
        </span>
        <ChevronDown
          className={`h-5 w-5 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1a1a] border border-[#353535] rounded-lg p-2 z-10">
          <div className="flex justify-between mb-2 border-b border-[#353535] pb-2">
            <button
              onClick={selectAll}
              className="text-sm text-[#4573D2] hover:underline"
            >
              Select all
            </button>
            <button
              onClick={deselectAll}
              className="text-sm text-[#4573D2] hover:underline"
            >
              Deselect all
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => toggleProject(project._id)}
                className="flex items-center space-x-2 p-2 hover:bg-[#252525] rounded cursor-pointer"
              >
                <div
                  className={`h-4 w-4 flex items-center justify-center border ${
                    selectedProjectIds.includes(project._id)
                      ? "bg-[#4573D2] border-[#4573D2]"
                      : "border-[#353535]"
                  } rounded`}
                >
                  {selectedProjectIds.includes(project._id) && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex items-center">
                  <div
                    className="h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: project.color }}
                  ></div>
                  <span className="truncate max-w-[180px]">{project.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
