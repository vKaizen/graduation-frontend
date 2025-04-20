"use client";

import { useEffect, useState } from "react";
import { Settings, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseCard } from "./BaseCard";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/workspace-context";
import { fetchProjectsByWorkspace } from "@/api-service";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export function ProjectsCard() {
  const [projects, setProjects] = useState<any[]>([]);
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
        const fetchedProjects = await fetchProjectsByWorkspace(
          currentWorkspace._id
        );
        console.log("Fetched projects:", fetchedProjects);
        setProjects(fetchedProjects || []);
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
      <BaseCard title="Projects">
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
      <BaseCard title="Projects">
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
                  setProjects(projects || []);
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
    <BaseCard title="Projects">
      <div className="h-full flex flex-col">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 mb-4 text-white font-medium hover:bg-white/5 p-2"
          onClick={handleCreateProject}
        >
          <div className="h-10 w-10 rounded flex items-center justify-center border-2 border-dashed border-gray-600">
            <Plus className="h-5 w-5" />
          </div>
          Create project
        </Button>

        <div className="space-y-2 flex-1 overflow-y-auto">
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
                <span className="text-white">{project.name}</span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <p className="text-gray-400 mb-2">No projects yet</p>
              <Link href="/projects/new">
                <Button variant="outline" size="sm" className="text-white">
                  Create your first project
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
}
