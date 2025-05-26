"use client";

import { useState, useEffect, useMemo } from "react";
import { Project } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import {
  fetchTaskCompletionTimeline,
  fetchProjectStatistics,
  fetchTasksByProject,
} from "@/api-service";

// Register ChartJS components once
if (typeof window !== "undefined") {
  // Only register in browser environment
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
  );
}

interface ReportingDashboardProps {
  projects: Project[];
  dateRange: { from: Date; to: Date };
}

type ChartDataType = {
  labels: string[];
  datasets: {
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    tension?: number;
  }[];
};

interface ProjectStatistics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  tasksByProject: Record<
    string,
    {
      totalTasks: number;
      completedTasks: number;
    }
  >;
}

export function ReportingDashboard({
  projects,
  dateRange,
}: ReportingDashboardProps) {
  console.log(
    `ReportingDashboard rendering with ${projects?.length || 0} projects`
  );

  const [taskCompletionData, setTaskCompletionData] =
    useState<ChartDataType | null>(null);
  const [projectStatusData, setProjectStatusData] =
    useState<ChartDataType | null>(null);
  const [timelineData, setTimelineData] = useState<ChartDataType | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStatistics | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Stable reference to projects
  const projectsRef = useMemo(() => projects || [], [projects]);

  // Memoize project IDs to prevent unnecessary re-renders
  const projectIds = useMemo(() => {
    return projectsRef
      .map((p) => p._id || "unknown")
      .sort()
      .join(",");
  }, [projectsRef]);

  // Debug projects data structure
  useEffect(() => {
    console.log("DEBUG PROJECTS DATA:");
    console.log(`Number of projects: ${projectsRef.length}`);
    projectsRef.forEach((project, index) => {
      console.log(`Project ${index + 1}: ${project.name}`);
      console.log(`- ID: ${project._id}`);
      console.log(`- Number of sections: ${project.sections?.length || 0}`);
      if (project.sections?.length > 0) {
        let totalTasks = 0;
        let completedTasks = 0;
        project.sections.forEach((section) => {
          const sectionTasks = section.tasks?.length || 0;
          totalTasks += sectionTasks;
          completedTasks +=
            section.tasks?.filter((task) => task.status === "completed")
              .length || 0;
        });
        console.log(`- Total tasks: ${totalTasks}`);
        console.log(`- Completed tasks: ${completedTasks}`);
      } else {
        console.log(`- No sections or tasks found for this project`);
      }
    });
  }, [projectsRef]);

  // Add a debug function to directly check for completed tasks
  const debugFetchTasks = async () => {
    if (!projectsRef.length) return;

    console.log(
      "DEBUG: Directly fetching tasks for projects:",
      projectsRef.map((p) => p.name)
    );

    try {
      // Fetch tasks directly for each project
      const tasksPromises = projectsRef.map((project) =>
        fetchTasksByProject(project._id)
      );

      const projectTasks = await Promise.all(tasksPromises);

      // Flatten tasks array
      const allTasks = projectTasks.flat();
      console.log(`DEBUG: Found ${allTasks.length} total tasks`);

      // Check for tasks with status="completed"
      const statusCompletedTasks = allTasks.filter(
        (task) => task.status === "completed"
      );
      console.log(
        `DEBUG: Found ${statusCompletedTasks.length} tasks with status="completed"`
      );

      // Check for tasks with completed=true
      const boolCompletedTasks = allTasks.filter(
        (task) => task.status === "completed"
      );
      console.log(
        `DEBUG: Found ${boolCompletedTasks.length} tasks with completed=true`
      );

      // Check for tasks that have both
      const bothCompletedTasks = allTasks.filter(
        (task) => task.status === "completed"
      );
      console.log(
        `DEBUG: Found ${bothCompletedTasks.length} tasks with status="completed"`
      );

      // Try our new debug endpoint
      try {
        const debugResponse = await fetch("/api/debug/task-completion-check");
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log("DEBUG: Debug API response:", debugData);
        } else {
          console.error(
            "DEBUG: Debug API failed:",
            debugResponse.status,
            debugResponse.statusText
          );
        }
      } catch (debugError) {
        console.error("DEBUG: Error calling debug API:", debugError);
      }

      if (statusCompletedTasks.length > 0) {
        console.log("DEBUG: Sample of tasks with status='completed':");
        statusCompletedTasks.slice(0, 3).forEach((task, i) => {
          console.log(`DEBUG: Task ${i + 1}:`, {
            id: task._id,
            title: task.title,
            status: task.status,
            completed: task.completed,
            completedAt: task.completedAt,
            project: task.project,
            dueDate: task.dueDate,
          });
        });
      }
    } catch (error) {
      console.error("DEBUG: Error fetching tasks directly:", error);
    }
  };

  // Fetch project statistics and task completion data
  useEffect(() => {
    // Skip processing if no projects
    if (!projectsRef.length) {
      console.log("No projects to process, skipping data fetching");
      return;
    }

    console.log(`Processing ${projectsRef.length} projects for charts`);
    let mounted = true;

    const fetchData = async () => {
      try {
        setError(null);

        // Run debug function to directly check for completed tasks
        await debugFetchTasks();

        // Get project IDs array for API calls
        const projectIdsArray = projectsRef.map((p) => p._id);
        console.log("Project IDs for API calls:", projectIdsArray);

        // Fetch task completion timeline data
        console.log(
          `Fetching task completion timeline from ${dateRange.from.toISOString()} to ${dateRange.to.toISOString()}`
        );

        // Debug: Log the actual date objects
        console.log(`Date range from:`, dateRange.from);
        console.log(`Date range to:`, dateRange.to);
        console.log(`Date range from year:`, dateRange.from.getFullYear());
        console.log(`Date range to year:`, dateRange.to.getFullYear());
        console.log(`Date range from month:`, dateRange.from.getMonth() + 1);
        console.log(`Date range to month:`, dateRange.to.getMonth() + 1);

        const timelineResponse = await fetchTaskCompletionTimeline(
          dateRange.from,
          dateRange.to,
          projectIdsArray
        );

        if (!mounted) return;

        console.log("Timeline response received:", timelineResponse);
        // Check if we have valid timeline data
        const hasTimelineData =
          timelineResponse &&
          Array.isArray(timelineResponse.dates) &&
          Array.isArray(timelineResponse.counts) &&
          timelineResponse.dates.length > 0;

        if (hasTimelineData) {
          console.log(
            "Received valid timeline data with dates:",
            timelineResponse.dates
          );

          // Debug: Log the first few dates from the response
          console.log(`First date from response: ${timelineResponse.dates[0]}`);
          console.log(
            `Last date from response: ${
              timelineResponse.dates[timelineResponse.dates.length - 1]
            }`
          );

          const sampleDate = new Date(timelineResponse.dates[0]);
          console.log(`Sample date parsed: ${sampleDate}`);
          console.log(`Sample date year: ${sampleDate.getFullYear()}`);
          console.log(`Sample date month: ${sampleDate.getMonth() + 1}`);

          // Format dates for display
          const formattedDates = timelineResponse.dates.map((dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          });

          // Create timeline chart data
          const timelineDataset: ChartDataType = {
            labels: formattedDates,
            datasets: [
              {
                label: "Completed Tasks",
                data: timelineResponse.counts,
                borderColor: "#4573D2",
                backgroundColor: "rgba(69, 115, 210, 0.2)",
                tension: 0.4,
              },
            ],
          };

          setTimelineData(timelineDataset);
        } else {
          console.warn(
            "Received empty or invalid timeline data:",
            timelineResponse
          );

          // Create empty chart with date range
          const startDate = new Date(dateRange.from);
          const endDate = new Date(dateRange.to);
          const labels = [];
          const counts = [];

          // Generate day-by-day labels for the date range
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            labels.push(
              currentDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            );
            counts.push(0);
            currentDate.setDate(currentDate.getDate() + 1);
          }

          // Set empty timeline data with the date range
          if (labels.length > 0) {
            const emptyTimelineDataset: ChartDataType = {
              labels,
              datasets: [
                {
                  label: "Completed Tasks",
                  data: counts,
                  borderColor: "#4573D2",
                  backgroundColor: "rgba(69, 115, 210, 0.2)",
                  tension: 0.4,
                },
              ],
            };

            setTimelineData(emptyTimelineDataset);
          }
        }

        // Fetch project statistics
        console.log("Fetching project statistics");
        const statsResponse = await fetchProjectStatistics(projectIdsArray);

        if (!mounted) return;

        if (statsResponse) {
          console.log("Received project statistics:", statsResponse);

          // Check if the stats are empty (all zeros)
          const hasRealStats =
            statsResponse.totalTasks > 0 || statsResponse.completedTasks > 0;

          if (hasRealStats) {
            setProjectStats(statsResponse);
          } else {
            console.log(
              "API returned empty statistics, calculating from project data"
            );

            // Calculate statistics from project data
            const totalTasks = projectsRef.reduce((total, project) => {
              if (!project.sections) return total;
              return (
                total +
                project.sections.reduce((sectionTotal, section) => {
                  if (!section.tasks) return sectionTotal;
                  return sectionTotal + section.tasks.length;
                }, 0)
              );
            }, 0);

            const completedTasks = projectsRef.reduce((total, project) => {
              if (!project.sections) return total;
              return (
                total +
                project.sections.reduce((sectionTotal, section) => {
                  if (!section.tasks) return sectionTotal;
                  return (
                    sectionTotal +
                    section.tasks.filter((task) => task.status === "completed")
                      .length
                  );
                }, 0)
              );
            }, 0);

            const completionRate =
              totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

            // Create tasksByProject object
            const tasksByProject: Record<
              string,
              { totalTasks: number; completedTasks: number }
            > = {};

            projectsRef.forEach((project) => {
              if (!project.sections) return;

              let projectTotalTasks = 0;
              let projectCompletedTasks = 0;

              project.sections.forEach((section) => {
                if (!section.tasks) return;
                projectTotalTasks += section.tasks.length;
                projectCompletedTasks += section.tasks.filter(
                  (task) => task.status === "completed"
                ).length;
              });

              tasksByProject[project._id] = {
                totalTasks: projectTotalTasks,
                completedTasks: projectCompletedTasks,
              };
            });

            const calculatedStats = {
              totalTasks,
              completedTasks,
              completionRate,
              tasksByProject,
            };

            console.log(
              "Calculated statistics from project data:",
              calculatedStats
            );
            setProjectStats(calculatedStats);
          }
        } else {
          console.warn("Received null or undefined project statistics");
        }

        // Generate task completion data per project
        const taskData: ChartDataType = {
          labels: projectsRef.map(
            (project) => project.name || "Unnamed Project"
          ),
          datasets: [
            {
              label: "Completed Tasks",
              data: projectsRef.map((project) => {
                if (!project.sections) return 0;
                return project.sections.reduce((total, section) => {
                  if (!section.tasks) return total;
                  return (
                    total +
                    (section.tasks.filter((task) => task.status === "completed")
                      .length || 0)
                  );
                }, 0);
              }),
              backgroundColor: projectsRef.map(
                (project) => project.color || "#4573D2"
              ),
            },
            {
              label: "Total Tasks",
              data: projectsRef.map((project) => {
                if (!project.sections) return 0;
                return project.sections.reduce((total, section) => {
                  if (!section.tasks) return total;
                  return total + (section.tasks.length || 0);
                }, 0);
              }),
              backgroundColor: projectsRef.map(
                (project) => `${project.color || "#4573D2"}80`
              ),
            },
          ],
        };

        // Generate project status data
        const statusCounts = {
          "on-track": 0,
          "at-risk": 0,
          "off-track": 0,
        };

        projectsRef.forEach((project) => {
          if (project.status) {
            statusCounts[project.status as keyof typeof statusCounts]++;
          } else {
            // Default to on-track if no status is provided
            statusCounts["on-track"]++;
          }
        });

        const statusData: ChartDataType = {
          labels: ["On Track", "At Risk", "Off Track"],
          datasets: [
            {
              data: [
                statusCounts["on-track"],
                statusCounts["at-risk"],
                statusCounts["off-track"],
              ],
              backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
              borderWidth: 0,
            },
          ],
        };

        if (mounted) {
          console.log("Setting chart data");
          setTaskCompletionData(taskData);
          setProjectStatusData(statusData);
        }
      } catch (error) {
        console.error("Error processing data for charts:", error);
        if (mounted) {
          setError("Failed to generate charts. Please try again later.");
        }
      }
    };

    // Use setTimeout to ensure this doesn't block rendering
    const timer = setTimeout(fetchData, 50);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [projectIds, dateRange]); // Include dateRange for timeline chart

  // Chart options - memoize to prevent unnecessary re-renders
  const barOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "#353535",
          },
          ticks: {
            color: "#cccccc",
            stepSize: 1,
            precision: 0,
            callback: (value) => Math.floor(Number(value)),
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#cccccc",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#ffffff",
          },
        },
      },
    }),
    []
  );

  const pieOptions = useMemo<ChartOptions<"pie">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: "#ffffff",
          },
        },
      },
    }),
    []
  );

  const lineOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "#353535",
          },
          ticks: {
            color: "#cccccc",
            stepSize: 1,
            precision: 0,
            callback: (value) => Math.floor(Number(value)),
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#cccccc",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#ffffff",
          },
        },
      },
    }),
    []
  );

  // Memoize the task stats calculation
  const { totalTasks, completedTasks, completionRate } = useMemo(() => {
    // If we have project stats from the API, use those
    if (projectStats) {
      return {
        totalTasks: projectStats.totalTasks || 0,
        completedTasks: projectStats.completedTasks || 0,
        completionRate: projectStats.completionRate
          ? `${projectStats.completionRate}%`
          : "0%",
      };
    }

    // Otherwise calculate from the projects data
    try {
      const totalTasks = projectsRef.reduce((total, project) => {
        if (!project.sections) return total;
        return (
          total +
          project.sections.reduce((sectionTotal, section) => {
            if (!section.tasks) return sectionTotal;
            return sectionTotal + (section.tasks.length || 0);
          }, 0)
        );
      }, 0);

      const completedTasks = projectsRef.reduce((total, project) => {
        if (!project.sections) return total;
        return (
          total +
          project.sections.reduce((sectionTotal, section) => {
            if (!section.tasks) return sectionTotal;
            return (
              sectionTotal +
              (section.tasks.filter((task) => task.status === "completed")
                .length || 0)
            );
          }, 0)
        );
      }, 0);

      return {
        totalTasks,
        completedTasks,
        completionRate:
          totalTasks === 0
            ? "0%"
            : `${Math.round((completedTasks / totalTasks) * 100)}%`,
      };
    } catch (error) {
      console.error("Error calculating task stats:", error);
      return { totalTasks: 0, completedTasks: 0, completionRate: "0%" };
    }
  }, [projectsRef, projectStats]);

  if (!projectsRef.length) {
    return (
      <div className="mt-8 text-center text-gray-400">
        <p>Select at least one project to view reports</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-4 bg-red-900/20 border border-red-500 rounded-md text-red-100">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-1 bg-red-700 rounded-md hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-[#1a1a1a] border-[#353535] text-white">
        <CardHeader>
          <CardTitle>Task Completion by Project</CardTitle>
          <CardDescription className="text-gray-400">
            Summary of completed vs. total tasks per project
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {taskCompletionData ? (
            <Bar data={taskCompletionData} options={barOptions} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4573D2]"></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#353535] text-white">
        <CardHeader>
          <CardTitle>Project Status Distribution</CardTitle>
          <CardDescription className="text-gray-400">
            Overview of project health status
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {projectStatusData ? (
            <div className="h-full flex items-center justify-center">
              <Pie data={projectStatusData} options={pieOptions} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4573D2]"></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#353535] text-white md:col-span-2">
        <CardHeader>
          <CardTitle>Task Completion Timeline</CardTitle>
          <CardDescription className="text-gray-400">
            Tasks completed over time for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {timelineData ? (
            <Line data={timelineData} options={lineOptions} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4573D2]"></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#353535] text-white md:col-span-2">
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
          <CardDescription className="text-gray-400">
            Overview of project performance for selected date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#252525] p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Total Projects</p>
              <p className="text-2xl font-bold">{projectsRef.length}</p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Total Tasks</p>
              <p className="text-2xl font-bold">{totalTasks}</p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Completed Tasks</p>
              <p className="text-2xl font-bold">{completedTasks}</p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Completion Rate</p>
              <p className="text-2xl font-bold">{completionRate}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
