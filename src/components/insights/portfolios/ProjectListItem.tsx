import React from "react";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { Project } from "@/types";
import { ProgressIndicator } from "./ProgressIndicator";

interface ProjectListItemProps {
  project: Project;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export const ProjectListItem = ({
  project,
  onRemove,
  showRemoveButton = true,
}: ProjectListItemProps) => {
  // Log project data to help debug issues
  console.log("Rendering project:", project);

  // Check if project data is valid
  if (!project || !project._id) {
    console.error("Invalid project data:", project);
    return (
      <div className="border border-[#353535] rounded-lg p-4 bg-[#252525] text-red-500">
        Invalid project data
      </div>
    );
  }

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "on-track":
        return "bg-green-500/20 text-green-500";
      case "at-risk":
        return "bg-yellow-500/20 text-yellow-500";
      case "off-track":
        return "bg-red-500/20 text-red-500";
      case "completed":
        return "bg-[#4573D2]/20 text-[#4573D2]";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  // Calculate progress
  const progress = project.status === "completed" ? 100 : 0;

  return (
    <div className="border border-[#353535] rounded-lg p-4 bg-[#252525] hover:border-[#4573D2] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-grow">
          <div className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: project.color || "#4573D2" }}
            />
            <h3 className="font-medium text-white">
              {project.name || "Unnamed project"}
            </h3>
          </div>

          {project.description && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {showRemoveButton && onRemove && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-[#353535] rounded-md transition-colors"
              title="Remove from portfolio"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <Link
            href={`/projects/${project._id}`}
            className="p-1.5 text-gray-400 hover:text-[#4573D2] hover:bg-[#353535] rounded-md transition-colors"
            title="View project"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="w-2/3">
          <ProgressIndicator
            progress={project.status === "completed" ? 100 : 0}
            size="sm"
            showPercentage={false}
          />
        </div>

        {project.status && (
          <div
            className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(
              project.status
            )}`}
          >
            {project.status.replace("-", " ")}
          </div>
        )}
      </div>
    </div>
  );
};
