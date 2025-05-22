"use client";

import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { useEffect, useState } from "react";
import { fetchProject } from "@/api-service";
import type { Project } from "@/types";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";

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
      <div className="min-h-screen bg-[#1E201E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1E201E] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-red-500/10 border border-red-500/20 text-red-500 rounded-md p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium">Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E201E] flex flex-col">
      {/* Fixed header */}
      <div className="sticky top-0 z-10">
        <ProjectHeader project={project} />
        <ProjectTabs projectId={projectId} />
      </div>

      {/* Scrollable main content area */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
