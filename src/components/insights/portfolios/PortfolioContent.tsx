import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, X, GripVertical } from "lucide-react";
import { Portfolio, Project } from "@/types";
import { fetchUserById, updatePortfolioProjectsOrder } from "@/api-service";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useToast } from "@/components/ui/use-toast";

interface PortfolioContentProps {
  activeTab: string;
  portfolio: Portfolio;
  projectsData: Project[];
  onRemoveProject: (projectId: string) => void;
}

export const PortfolioContent: React.FC<PortfolioContentProps> = ({
  activeTab,
  portfolio,
  projectsData,
  onRemoveProject,
}) => {
  // State to store user data
  const [userMap, setUserMap] = useState<
    Record<string, { fullName: string; email: string }>
  >({});

  // State to store projects for DnD
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setProjects(projectsData);
  }, [projectsData]);

  // Fetch user data for project owners
  useEffect(() => {
    async function loadUsers() {
      try {
        const newUserMap: Record<string, { fullName: string; email: string }> =
          {};

        // First collect all unique user IDs from project roles
        const uniqueUserIds: string[] = [];

        projectsData.forEach((project) => {
          if (project.roles) {
            project.roles.forEach((role) => {
              const userId = String(role.userId);
              if (userId && !uniqueUserIds.includes(userId)) {
                uniqueUserIds.push(userId);
              }
            });
          }
        });

        // Fetch each user's data
        for (const userId of uniqueUserIds) {
          try {
            const user = await fetchUserById(userId);
            if (user) {
              newUserMap[userId] = {
                email: user.email || "Unknown",
                fullName:
                  user.fullName ||
                  user.name ||
                  (user.email
                    ? formatUsername(user.email)
                    : `User ${userId.substring(0, 6)}`),
              };
            }
          } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error);
          }
        }

        setUserMap(newUserMap);
      } catch (error) {
        console.error("Error loading users:", error);
      }
    }

    if (projectsData.length > 0) {
      loadUsers();
    }
  }, [projectsData]);

  // Format username from email
  const formatUsername = (email: string): string => {
    if (!email || !email.includes("@")) return email;

    return email
      .split("@")[0]
      .replace(/\./g, " ")
      .replace(/(\w)(\w*)/g, (_, first, rest) => first.toUpperCase() + rest);
  };

  // Get initials from a name (for avatar)
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => (part ? part[0] : ""))
      .join("")
      .toUpperCase();
  };

  // Render progress bar
  const renderProgressBar = (progress: number = 0) => {
    return (
      <div className="w-full bg-[#353535] rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  // Get a user's display name - simplified to avoid email display
  const getDisplayName = (userId: string): string => {
    // If we have user data, use the full name
    if (userMap[userId]?.fullName) {
      return userMap[userId].fullName;
    }

    // For email addresses, format the username part
    if (userId.includes("@")) {
      return formatUsername(userId);
    }

    // Fallback for IDs
    return `User ${userId.substring(0, 6)}`;
  };

  // Handle drag end
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result;

    // If dropped outside the list or no movement
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    // Reorder projects
    const reorderedProjects = Array.from(projects);
    const [movedProject] = reorderedProjects.splice(source.index, 1);
    reorderedProjects.splice(destination.index, 0, movedProject);

    // Update local state immediately for better UX
    setProjects(reorderedProjects);

    // Save the new order to the backend
    try {
      setIsSaving(true);
      await updatePortfolioProjectsOrder(
        portfolio._id,
        reorderedProjects.map((p) => p._id)
      );

      toast({
        title: "Project order updated",
        description: "The new project order has been saved",
      });
    } catch (error) {
      console.error("Failed to save project order:", error);
      toast({
        title: "Error saving order",
        description: "There was a problem saving the new project order",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-3 py-3 bg-[#121212] h-full">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add work
          </button>
          {isSaving && (
            <span className="ml-3 flex items-center text-gray-400 text-xs">
              <div className="animate-spin h-3 w-3 border border-gray-400 rounded-full border-t-transparent mr-1"></div>
              Saving changes...
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button className="text-gray-400 hover:text-white px-3 py-2 rounded text-xs">
            Filter
          </button>
          <button className="text-gray-400 hover:text-white px-3 py-2 rounded text-xs">
            Sort
          </button>
          <button className="text-gray-400 hover:text-white px-3 py-2 rounded text-xs">
            Group
          </button>
          <button className="text-gray-400 hover:text-white px-3 py-2 rounded text-xs">
            Options
          </button>
        </div>
      </div>

      {/* Portfolio progress info */}
      {portfolio.progress > 0 && (
        <div className="mb-4 p-3 bg-[#353535] rounded">
          <h3 className="text-sm font-medium text-white mb-2">
            Portfolio Progress: {portfolio.progress}%
          </h3>
          {renderProgressBar(portfolio.progress)}
        </div>
      )}

      {/* Content based on active tab */}
      <div className="space-y-4 pb-12">
        {" "}
        {/* Add bottom padding for fixed buttons */}
        {/* Table/List View */}
        {activeTab === "list" && (
          <div className="bg-[#1a1a1a] border border-[#353535] rounded overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[32px_1.5fr_1fr_1fr_1fr_1fr] divide-x divide-[#353535] border-b border-[#353535] bg-[#1a1a1a]">
              <div className="p-1 text-gray-400 text-xs font-medium"></div>
              <div className="p-2 text-gray-400 text-xs font-medium">Name</div>
              <div className="p-2 text-gray-400 text-xs font-medium">
                Status
              </div>
              <div className="p-2 text-gray-400 text-xs font-medium">
                Task progress
              </div>
              <div className="p-2 text-gray-400 text-xs font-medium">Owner</div>
              <div className="p-2 text-gray-400 text-xs font-medium">
                Priority
              </div>
            </div>

            {/* Table body */}
            {projects.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-xs">
                No projects in this portfolio
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="project-list">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {projects.map((project, index) => (
                        <Draggable
                          key={project._id}
                          draggableId={project._id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="grid grid-cols-[32px_1.5fr_1fr_1fr_1fr_1fr] divide-x divide-[#353535] border-b border-[#353535] hover:bg-[#252525] bg-[#1a1a1a]"
                            >
                              <div
                                className="flex items-center justify-center"
                                {...provided.dragHandleProps}
                              >
                                <GripVertical className="h-3 w-3 text-gray-500" />
                              </div>
                              <div className="p-2 flex items-center">
                                <div
                                  className="h-4 w-4 rounded mr-2"
                                  style={{
                                    backgroundColor: project.color || "#4573D2",
                                  }}
                                ></div>
                                <Link
                                  href={`/projects/${project._id}`}
                                  className="text-white hover:text-blue-500 text-xs"
                                >
                                  {project.name}
                                </Link>
                              </div>
                              <div className="p-2">
                                <div
                                  className="px-1.5 py-0.5 text-xs bg-opacity-80 rounded inline-block"
                                  style={{
                                    backgroundColor:
                                      project.status === "on-track"
                                        ? "rgba(16, 185, 129, 0.2)"
                                        : project.status === "at-risk"
                                        ? "rgba(245, 158, 11, 0.2)"
                                        : project.status === "off-track"
                                        ? "rgba(239, 68, 68, 0.2)"
                                        : project.status === "completed"
                                        ? "rgba(59, 130, 246, 0.2)"
                                        : "rgba(107, 114, 128, 0.2)",
                                    color:
                                      project.status === "on-track"
                                        ? "#10b981"
                                        : project.status === "at-risk"
                                        ? "#f59e0b"
                                        : project.status === "off-track"
                                        ? "#ef4444"
                                        : project.status === "completed"
                                        ? "#3b82f6"
                                        : "#6b7280",
                                  }}
                                >
                                  {project.status
                                    ? project.status.replace(/-/g, " ")
                                    : "No Status"}
                                </div>
                              </div>
                              <div className="p-2">
                                {renderProgressBar(
                                  project.status === "completed" ? 100 : 0
                                )}
                                <span className="text-xs text-gray-400 ml-1">
                                  {project.status === "completed"
                                    ? "100%"
                                    : "0%"}
                                </span>
                              </div>
                              <div className="p-2 flex items-center">
                                {project.roles && project.roles.length > 0 ? (
                                  <div className="text-xs text-gray-300">
                                    {project.roles.find(
                                      (r) => r.role === "Owner"
                                    ) ? (
                                      <span className="flex items-center space-x-1">
                                        <span className="w-4 h-4 bg-violet-700 rounded-full flex items-center justify-center text-white text-[10px]">
                                          {(() => {
                                            const ownerUserId = String(
                                              project.roles.find(
                                                (r) => r.role === "Owner"
                                              )?.userId || ""
                                            );
                                            const name =
                                              userMap[ownerUserId]?.fullName ||
                                              formatUsername(ownerUserId);
                                            return getInitials(name);
                                          })()}
                                        </span>
                                        <span className="truncate">
                                          {(() => {
                                            const ownerUserId = String(
                                              project.roles.find(
                                                (r) => r.role === "Owner"
                                              )?.userId || ""
                                            );
                                            return getDisplayName(ownerUserId);
                                          })()}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">
                                        No owner
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">
                                    No owner
                                  </span>
                                )}
                              </div>
                              <div className="p-2 flex justify-between items-center">
                                <div className="px-1.5 py-0.5 text-xs bg-red-600 bg-opacity-20 text-red-500 rounded">
                                  High
                                </div>
                                <button
                                  onClick={() => onRemoveProject(project._id)}
                                  className="text-gray-400 hover:text-red-500 p-0.5"
                                  title="Remove from portfolio"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        )}
        {/* Timeline View (placeholder) */}
        {activeTab === "timeline" && (
          <div className="bg-[#121212] border border-[#353535] rounded p-4">
            <div className="text-gray-400 text-center">
              Timeline view coming soon
            </div>
          </div>
        )}
        {/* Progress View (placeholder) */}
        {activeTab === "progress" && (
          <div className="bg-[#121212] border border-[#353535] rounded p-4">
            <div className="text-gray-400 text-center">
              Progress view coming soon
            </div>
          </div>
        )}
        {/* Workload View (placeholder) */}
        {activeTab === "workload" && (
          <div className="bg-[#121212] border border-[#353535] rounded p-4">
            <div className="text-gray-400 text-center">
              Workload view coming soon
            </div>
          </div>
        )}
        {/* Messages View (placeholder) */}
        {activeTab === "messages" && (
          <div className="bg-[#121212] border border-[#353535] rounded p-4">
            <div className="text-gray-400 text-center">
              Messages view coming soon
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
