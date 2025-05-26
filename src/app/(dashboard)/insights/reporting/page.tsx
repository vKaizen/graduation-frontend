"use client";

import { useState, useEffect, useMemo } from "react";
import { ReportingDashboard } from "@/components/insights/reporting/ReportingDashboard";
import { ReportingHeader } from "@/components/insights/reporting/ReportingHeader";
import { ProjectSelector } from "@/components/insights/reporting/ProjectSelector";
import { DateRangeSelector } from "@/components/insights/reporting/DateRangeSelector";
import { fetchProject, fetchProjectsByWorkspace } from "@/api-service";
import { Project } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/contexts/workspace-context";

export default function ReportingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const { currentWorkspace } = useWorkspace();

  // Initialize dates with explicit debugging
  const currentDate = new Date();
  // Force the correct year (2025)
  currentDate.setFullYear(2025);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(currentDate.getDate() - 30);
  // Also force the correct year for this date
  thirtyDaysAgo.setFullYear(2025);

  console.log("🗓️ Initializing date range:");
  console.log("🗓️ Current date:", currentDate);
  console.log("🗓️ Current date ISO:", currentDate.toISOString());
  console.log("🗓️ Current date year:", currentDate.getFullYear());
  console.log("🗓️ 30 days ago:", thirtyDaysAgo);
  console.log("🗓️ 30 days ago ISO:", thirtyDaysAgo.toISOString());
  console.log("🗓️ 30 days ago year:", thirtyDaysAgo.getFullYear());

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: thirtyDaysAgo,
    to: currentDate,
  });

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch projects when component mounts or workspace changes
  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      try {
        if (!currentWorkspace?._id) {
          setProjects([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setFetchError(null);

        console.log(
          `Fetching projects for workspace ${currentWorkspace.name}...`
        );
        const projectsData = await fetchProjectsByWorkspace(
          currentWorkspace._id
        );

        if (isMounted) {
          console.log(
            `Fetched ${projectsData.length} projects from workspace ${currentWorkspace.name}`
          );

          // Check if projects have sections and tasks loaded
          const projectsWithMissingData = projectsData.filter(
            (p) =>
              !p.sections ||
              p.sections.length === 0 ||
              p.sections.some((s) => !s.tasks || s.tasks.length === 0)
          );

          if (projectsWithMissingData.length > 0) {
            console.log(
              `Found ${projectsWithMissingData.length} projects with missing sections or tasks`
            );

            // Load complete project data for each project
            const fullProjectsPromises = projectsWithMissingData.map((p) =>
              fetchProject(p._id)
            );

            const fullProjects = await Promise.all(fullProjectsPromises);

            // Replace incomplete projects with full data
            const updatedProjects = projectsData.map((p) => {
              const fullProject = fullProjects.find((fp) => fp._id === p._id);
              return fullProject || p;
            });

            console.log(`Updated projects with complete data`);
            setProjects(updatedProjects);
          } else {
            setProjects(projectsData);
          }

          // Default to selecting all projects
          if (projectsData.length > 0) {
            setSelectedProjectIds(projectsData.map((project) => project._id));
          }
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
        if (isMounted) {
          setFetchError("Failed to load projects. Please try again later.");
          toast({
            title: "Error",
            description: "Failed to load projects. Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [currentWorkspace]); // Run when currentWorkspace changes

  const handleProjectSelection = (projectIds: string[]) => {
    setSelectedProjectIds(projectIds);
  };

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range);
  };

  // Memoize filtered projects to prevent unnecessary re-renders
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => selectedProjectIds.includes(p._id));
  }, [projects, selectedProjectIds]);

  return (
    <div className="p-6 text-white bg-[#121212] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <ReportingHeader title="Reporting Dashboard" />

        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mt-6">
          <ProjectSelector
            projects={projects}
            selectedProjectIds={selectedProjectIds}
            onSelectionChange={handleProjectSelection}
          />
          <DateRangeSelector
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>

        {fetchError && (
          <div className="mt-8 p-4 bg-red-900/20 border border-red-500 rounded-md text-red-100">
            <p>{fetchError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-1 bg-red-700 rounded-md hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4573D2]"></div>
          </div>
        ) : (
          <ReportingDashboard
            projects={filteredProjects}
            dateRange={dateRange}
          />
        )}
      </div>
    </div>
  );
}
