"use client";

import { useEffect, useState } from "react";
import { Settings, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseCard } from "./BaseCard";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/workspace-context";
import { fetchProjectsByWorkspace, fetchProjectMembers } from "@/api-service";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getUserIdCookie } from "@/lib/cookies";

// Add Project type for better type safety
interface Project {
  _id: string;
  name: string;
  color: string;
  description?: string;
  visibility?: "public" | "invite-only";
  createdBy?: string;
}

interface ProjectsCardProps {
  onRemove?: () => void;
  cardId?: string;
  isFullWidth?: boolean;
  onSizeChange?: (isFullWidth: boolean) => void;
}

export function ProjectsCard({
  onRemove,
  cardId = "projects-card",
  isFullWidth = false,
  onSizeChange,
}: ProjectsCardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();

  // Fetch projects from the API
  useEffect(() => {
    async function fetchProjects() {
      if (!currentWorkspace?._id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get current user ID
        const userId = getUserIdCookie();
        if (!userId) {
          setError("User not authenticated");
          setIsLoading(false);
          return;
        }

        // Fetch all workspace projects
        const fetchedProjects = await fetchProjectsByWorkspace(
          currentWorkspace._id
        );

        // Filter projects where user is a member
        const userProjects = await Promise.all(
          fetchedProjects.map(async (project: Project) => {
            try {
              // Check if user is the creator (always a member)
              if (project.createdBy === userId) {
                return project;
              }

              // Fetch project members to check membership
              const members = await fetchProjectMembers(project._id);
              const isMember = members.some(
                (member: any) => member._id === userId
              );

              // Return the project if user is a member, otherwise null
              return isMember ? project : null;
            } catch (error) {
              console.error(
                `Error checking membership for project ${project.name}:`,
                error
              );
              return null; // Skip projects with errors
            }
          })
        );

        // Filter out null values (projects where user is not a member)
        const filteredProjects = userProjects.filter(Boolean) as Project[];

        console.log("User's projects:", filteredProjects);
        setProjects(filteredProjects || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, [currentWorkspace]);

  // Navigate to project detail page
  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}/board`);
  };

  // Navigate to create project page
  const handleCreateProject = () => {
    router.push("/projects/new");
  };

  // Get project initials for avatar fallback
  const getProjectInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Convert hex color to background class
  const getColorClass = (hexColor: string) => {
    // Default fallback colors if no color is specified
    const colorMap: Record<string, string> = {
      "#A855F7": "bg-purple-500",
      "#3B82F6": "bg-blue-500",
      "#22C55E": "bg-green-500",
      "#EF4444": "bg-red-500",
      "#EAB308": "bg-yellow-500",
      "#EC4899": "bg-pink-500",
    };

    // Return mapped color class or default to purple
    return colorMap[hexColor] || "bg-purple-500";
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <BaseCard
        title="Projects"
        onRemove={onRemove}
        cardId={cardId}
        isFullWidth={isFullWidth}
        onSizeChange={onSizeChange}
      >
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </BaseCard>
    );
  }

  // Render error state
  if (error) {
    return (
      <BaseCard
        title="Projects"
        onRemove={onRemove}
        cardId={cardId}
        isFullWidth={isFullWidth}
        onSizeChange={onSizeChange}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <p className="text-gray-400">{error}</p>
          <Button
            variant="outline"
            className="mt-4 text-white"
            onClick={() => {
              setIsLoading(true);
              setError(null);
              fetchProjectsByWorkspace(currentWorkspace?._id || "")
                .then((projects) => {
                  // We'll need to filter for membership again
                  const userId = getUserIdCookie();
                  // Just show projects created by the user for a quick retry
                  const userProjects = projects.filter(
                    (p: Project) => p.createdBy === userId
                  );
                  setProjects(userProjects || []);
                  setIsLoading(false);
                })
                .catch((err) => {
                  console.error("Error retrying project fetch:", err);
                  setError("Failed to load projects");
                  setIsLoading(false);
                });
            }}
          >
            Retry
          </Button>
        </div>
      </BaseCard>
    );
  }

  return (
    <BaseCard
      title="Projects"
      onRemove={onRemove}
      cardId={cardId}
      isFullWidth={isFullWidth}
      onSizeChange={onSizeChange}
    >
      <div className="h-full flex flex-col">
        <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide">
          {projects.length > 0 ? (
            projects.map((project) => (
              <div
                key={project._id}
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleProjectClick(project._id)}
              >
                <div
                  className={`h-10 w-10 rounded ${getColorClass(
                    project.color
                  )} flex items-center justify-center`}
                >
                  {getProjectInitials(project.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-white block truncate">
                    {project.name}
                  </span>
                  {project.visibility && (
                    <span
                      className={`text-xs ${
                        project.visibility === "invite-only"
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {project.visibility === "invite-only"
                        ? "Private"
                        : "Public"}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <p className="text-gray-400 mb-2">No projects yet</p>
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
}
