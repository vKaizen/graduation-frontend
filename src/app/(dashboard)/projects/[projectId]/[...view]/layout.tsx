"use client";

import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { useEffect, useState } from "react";
import { fetchProject } from "@/api-service";
import type { Project } from "@/types";
import { useParams } from "next/navigation";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProject(projectId);
        setProject(data);
      } catch (error) {
        console.error("Error loading project:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load project"
        );
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-black">
        <div className="h-14 px-4 flex items-center text-gray-400">
          Loading project...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-black">
        <div className="h-14 px-4 flex items-center text-red-400">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      <ProjectHeader project={project} />
      <ProjectTabs projectId={projectId} />
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}
