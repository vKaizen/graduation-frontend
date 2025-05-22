import React, { useState, useEffect } from "react";
import { Check, Search, XCircle } from "lucide-react";
import { Project } from "@/types";
import { fetchProjectsByWorkspace } from "@/api-service";

interface ProjectSelectorProps {
  workspaceId: string;
  selectedProjectIds: string[];
  onSelectionChange: (projectIds: string[]) => void;
}

export const ProjectSelector = ({
  workspaceId,
  selectedProjectIds,
  onSelectionChange,
}: ProjectSelectorProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects when workspaceId changes
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedProjects = await fetchProjectsByWorkspace(workspaceId);
        setProjects(fetchedProjects);
        setFilteredProjects(fetchedProjects);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again.");
        setLoading(false);
      }
    };

    if (workspaceId) {
      loadProjects();
    }
  }, [workspaceId]);

  // Filter projects when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProjects(projects);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        (project.description &&
          project.description.toLowerCase().includes(query))
    );

    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  // Toggle project selection
  const toggleProject = (projectId: string) => {
    const isSelected = selectedProjectIds.includes(projectId);

    if (isSelected) {
      // Remove from selection
      const updatedSelection = selectedProjectIds.filter(
        (id) => id !== projectId
      );
      onSelectionChange(updatedSelection);
    } else {
      // Add to selection
      const updatedSelection = [...selectedProjectIds, projectId];
      onSelectionChange(updatedSelection);
    }
  };

  // Select or deselect all visible projects
  const toggleSelectAll = () => {
    if (filteredProjects.length === 0) return;

    // Check if all filtered projects are already selected
    const allSelected = filteredProjects.every((project) =>
      selectedProjectIds.includes(project._id)
    );

    if (allSelected) {
      // Deselect all filtered projects
      const projectIdsToKeep = selectedProjectIds.filter(
        (id) => !filteredProjects.some((project) => project._id === id)
      );
      onSelectionChange(projectIdsToKeep);
    } else {
      // Select all filtered projects
      const newIds = filteredProjects
        .map((project) => project._id)
        .filter((id) => !selectedProjectIds.includes(id));

      onSelectionChange([...selectedProjectIds, ...newIds]);
    }
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Get selected project names for display
  const getSelectedProjectNames = () => {
    return projects
      .filter((project) => selectedProjectIds.includes(project._id))
      .map((project) => project.name);
  };

  // Calculate select all button state
  const allSelected =
    filteredProjects.length > 0 &&
    filteredProjects.every((project) =>
      selectedProjectIds.includes(project._id)
    );

  return (
    <div className="w-full">
      {/* Selected count */}
      <div className="mb-2 text-sm text-gray-400">
        {selectedProjectIds.length} project
        {selectedProjectIds.length !== 1 ? "s" : ""} selected
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects..."
          className="w-full bg-[#252525] border border-[#353535] rounded-md py-2 pl-10 pr-10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#4573D2] focus:border-[#4573D2]"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <XCircle className="h-4 w-4 text-gray-500 hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Project list */}
      <div className="border border-[#353535] rounded-md bg-[#1a1a1a] max-h-[320px] overflow-y-auto">
        {/* Select all option */}
        {filteredProjects.length > 0 && (
          <div
            className="flex items-center px-4 py-3 cursor-pointer hover:bg-[#252525] border-b border-[#353535]"
            onClick={toggleSelectAll}
          >
            <div
              className={`
              flex-shrink-0 w-5 h-5 mr-3 rounded border
              ${
                allSelected
                  ? "bg-[#4573D2] border-[#4573D2]"
                  : "border-gray-500"
              }
              flex items-center justify-center
            `}
            >
              {allSelected && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className="font-medium text-gray-300">
              {allSelected ? "Deselect All" : "Select All"} (
              {filteredProjects.length})
            </span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#4573D2]"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="py-6 px-4 text-center text-red-400">{error}</div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredProjects.length === 0 && (
          <div className="py-6 px-4 text-center text-gray-500">
            {searchQuery
              ? "No matching projects found"
              : "No projects available"}
          </div>
        )}

        {/* Projects list */}
        {filteredProjects.map((project) => {
          const isSelected = selectedProjectIds.includes(project._id);

          return (
            <div
              key={project._id}
              onClick={() => toggleProject(project._id)}
              className="flex items-center px-4 py-3 cursor-pointer hover:bg-[#252525] border-b border-[#353535] last:border-b-0"
            >
              <div
                className={`
                flex-shrink-0 w-5 h-5 mr-3 rounded border
                ${
                  isSelected
                    ? "bg-[#4573D2] border-[#4573D2]"
                    : "border-gray-500"
                }
                flex items-center justify-center
              `}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>

              <div className="flex-grow min-w-0">
                <div className="font-medium text-white truncate">
                  {project.name}
                </div>
                {project.description && (
                  <div className="text-sm text-gray-500 truncate">
                    {project.description}
                  </div>
                )}
              </div>

              {/* Status indicator */}
              {project.status && (
                <div
                  className={`
                  ml-3 text-xs px-2 py-0.5 rounded-full
                  ${
                    project.status === "completed"
                      ? "bg-[#4573D2]/20 text-[#4573D2]"
                      : ""
                  }
                  ${
                    project.status === "on-track"
                      ? "bg-green-500/20 text-green-500"
                      : ""
                  }
                  ${
                    project.status === "at-risk"
                      ? "bg-yellow-500/20 text-yellow-500"
                      : ""
                  }
                  ${
                    project.status === "off-track"
                      ? "bg-red-500/20 text-red-500"
                      : ""
                  }
                `}
                >
                  {project.status.replace("-", " ")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected projects display */}
      {selectedProjectIds.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-300 mb-2">
            Selected Projects:
          </div>
          <div className="flex flex-wrap gap-2">
            {getSelectedProjectNames().map((name) => (
              <div
                key={name}
                className="bg-[#252525] text-white text-xs px-3 py-1 rounded-full"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
