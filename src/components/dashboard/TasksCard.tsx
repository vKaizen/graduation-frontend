"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Plus, Circle, AlertCircle } from "lucide-react";
import { BaseCard } from "./BaseCard";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  fetchTasksByProject,
  fetchProjectsByWorkspace,
  updateTask,
} from "@/api-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/contexts/DashboardContext";
import { Task, Project } from "@/types";
import { getUserIdCookie } from "@/lib/cookies";

interface TasksCardProps {
  onRemove?: () => void;
  cardId?: string;
  isFullWidth?: boolean;
  onSizeChange?: (isFullWidth: boolean) => void;
}

export function TasksCard({
  onRemove,
  cardId = "tasks-card",
  isFullWidth = false,
  onSizeChange,
}: TasksCardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { toggleCardSize } = useDashboard();

  // Fetch tasks from the API
  useEffect(() => {
    async function fetchUserTasks() {
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

        // First, fetch all projects in the workspace
        const projects = await fetchProjectsByWorkspace(currentWorkspace._id);

        if (!projects || projects.length === 0) {
          console.log("No projects found in workspace");
          setTasks([]);
          setIsLoading(false);
          return;
        }

        // Fetch tasks for each project and combine them
        let allTasks: Task[] = [];

        await Promise.all(
          projects.map(async (project: Project) => {
            try {
              const projectTasks = await fetchTasksByProject(project._id);
              if (projectTasks && projectTasks.length > 0) {
                allTasks = [...allTasks, ...projectTasks];
              }
            } catch (err) {
              console.error(
                `Error fetching tasks for project ${project._id}:`,
                err
              );
            }
          })
        );

        // Filter tasks assigned to the current user
        const userTasks = allTasks.filter((task) => task.assignee === userId);

        console.log("All tasks:", allTasks.length);
        console.log("User's tasks:", userTasks.length);

        setTasks(userTasks || []);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserTasks();
  }, [currentWorkspace]);

  // Get current date for accurate overdue calculation
  const currentDate = new Date();

  // Filter tasks based on their status with improved logic
  const upcomingTasks = tasks.filter((task) => {
    // Not completed and has a due date in the future
    return (
      !task.completed && task.dueDate && new Date(task.dueDate) >= currentDate
    );
  });

  const overdueTasks = tasks.filter((task) => {
    // Not completed and has a due date in the past
    return (
      !task.completed && task.dueDate && new Date(task.dueDate) < currentDate
    );
  });

  const completedTasks = tasks.filter(
    (task) =>
      // Explicitly marked as completed
      task.completed === true
  );

  // Helper function to check if a task is overdue
  function isOverdue(dueDate: string | undefined): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < currentDate;
  }

  // Format date for display with improved formatting
  function formatDate(dateString: string | undefined): string {
    if (!dateString) return "";

    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }

    // Check if date is tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    // Otherwise return formatted date
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }

  // Toggle task completion status
  const toggleTaskCompletion = async (
    taskId: string,
    currentStatus: boolean
  ) => {
    try {
      // Get current timestamp for completedAt
      const now = new Date();

      // Optimistically update the UI
      setTasks(
        tasks.map((task) =>
          task._id === taskId
            ? {
                ...task,
                completed: !currentStatus,
                status: !currentStatus ? "completed" : "not started",
                completedAt: !currentStatus ? now : undefined,
              }
            : task
        )
      );

      // Update in the backend
      await updateTask(taskId, {
        completed: !currentStatus,
        status: !currentStatus ? "completed" : "not started",
        completedAt: !currentStatus ? now.toISOString() : null,
      });
    } catch (error) {
      console.error("Error updating task:", error);

      // Revert the change if the API call fails
      setTasks(
        tasks.map((task) =>
          task._id === taskId ? { ...task, completed: currentStatus } : task
        )
      );
    }
  };

  // Navigate to create task page
  const handleCreateTask = () => {
    router.push("/my-tasks/new");
  };

  // Navigate to task detail page
  const handleTaskClick = (taskId: string) => {
    router.push(`/my-tasks/${taskId}`);
  };

  // For loading state
  if (isLoading) {
    return (
      <BaseCard
        title="My tasks"
        onRemove={onRemove}
        cardId={cardId}
        isFullWidth={isFullWidth}
        onSizeChange={onSizeChange}
      >
        <div className="space-y-4">
          <div className="flex space-x-2 mb-4 border-b border-gray-800">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </BaseCard>
    );
  }

  // For error state
  if (error) {
    return (
      <BaseCard
        title="My tasks"
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
              // Try again with improved error handling
              const userId = getUserIdCookie();
              if (!userId) {
                setError("User not authenticated");
                setIsLoading(false);
                return;
              }

              // Use the same approach as above for retry
              fetchProjectsByWorkspace(currentWorkspace?._id || "").then(
                async (projects) => {
                  if (!projects || projects.length === 0) {
                    setTasks([]);
                    setIsLoading(false);
                    return;
                  }

                  let allTasks: Task[] = [];

                  await Promise.all(
                    projects.map(async (project: Project) => {
                      try {
                        const projectTasks = await fetchTasksByProject(
                          project._id
                        );
                        if (projectTasks && projectTasks.length > 0) {
                          allTasks = [...allTasks, ...projectTasks];
                        }
                      } catch (err) {
                        console.error(
                          `Error fetching tasks for project ${project._id}:`,
                          err
                        );
                      }
                    })
                  );

                  const userTasks = allTasks.filter(
                    (task) => task.assignee === userId
                  );
                  setTasks(userTasks || []);
                  setIsLoading(false);
                }
              );
            }}
          >
            Retry
          </Button>
        </div>
      </BaseCard>
    );
  }

  // For normal state
  return (
    <BaseCard
      title="My tasks"
      onRemove={onRemove}
      cardId={cardId}
      isFullWidth={isFullWidth}
      onSizeChange={onSizeChange}
    >
      <div className="h-full flex flex-col">
        {/* Simple tab buttons */}
        <div className="flex space-x-2 mb-4 border-b border-gray-800">
          <button
            className={cn(
              "px-3 py-2 text-sm font-medium",
              activeTab === "upcoming"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-white"
            )}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming ({upcomingTasks.length})
          </button>
          <button
            className={cn(
              "px-3 py-2 text-sm font-medium",
              activeTab === "overdue"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-white"
            )}
            onClick={() => setActiveTab("overdue")}
          >
            <span className={overdueTasks.length > 0 ? "text-red-400" : ""}>
              Overdue ({overdueTasks.length})
            </span>
          </button>
          <button
            className={cn(
              "px-3 py-2 text-sm font-medium",
              activeTab === "completed"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-white"
            )}
            onClick={() => setActiveTab("completed")}
          >
            Completed ({completedTasks.length})
          </button>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide">
          {activeTab === "upcoming" &&
            upcomingTasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleTaskClick(task._id)}
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center border-2 border-gray-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskCompletion(task._id, task.completed);
                  }}
                >
                  <Circle className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="text-white">{task.title}</div>
                  {task.dueDate && (
                    <div className="text-xs text-gray-400">
                      Due: {formatDate(task.dueDate)}
                    </div>
                  )}
                </div>
                {task.project && (
                  <div
                    className="px-2 py-1 text-xs rounded bg-opacity-20"
                    style={{
                      backgroundColor: `${task.project.color}40` || "#4573D240",
                      color: task.project.color || "#4573D2",
                    }}
                  >
                    {task.project.name}
                  </div>
                )}
              </div>
            ))}

          {activeTab === "overdue" &&
            overdueTasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleTaskClick(task._id)}
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center border-2 border-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskCompletion(task._id, task.completed);
                  }}
                >
                  <Circle className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <div className="text-white">{task.title}</div>
                  {task.dueDate && (
                    <div className="text-xs text-red-400">
                      Overdue: {formatDate(task.dueDate)}
                    </div>
                  )}
                </div>
                {task.project && (
                  <div
                    className="px-2 py-1 text-xs rounded bg-opacity-20"
                    style={{
                      backgroundColor: `${task.project.color}40` || "#4573D240",
                      color: task.project.color || "#4573D2",
                    }}
                  >
                    {task.project.name}
                  </div>
                )}
              </div>
            ))}

          {activeTab === "completed" &&
            completedTasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleTaskClick(task._id)}
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center bg-green-500/20 border-2 border-green-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskCompletion(task._id, task.completed);
                  }}
                >
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="text-gray-400 line-through">{task.title}</div>
                  {task.completedAt && (
                    <div className="text-xs text-gray-500">
                      Completed: {formatDate(task.completedAt)}
                    </div>
                  )}
                </div>
                {task.project && (
                  <div
                    className="px-2 py-1 text-xs rounded bg-opacity-10"
                    style={{
                      backgroundColor: `${task.project.color}20` || "#4573D220",
                      color: `${task.project.color}99` || "#4573D299",
                    }}
                  >
                    {task.project.name}
                  </div>
                )}
              </div>
            ))}

          {activeTab === "upcoming" && upcomingTasks.length === 0 && (
            <div className="p-4 text-gray-400 text-center">
              No upcoming tasks.
            </div>
          )}

          {activeTab === "overdue" && overdueTasks.length === 0 && (
            <div className="p-4 text-gray-400 text-center">
              No overdue tasks.
            </div>
          )}

          {activeTab === "completed" && completedTasks.length === 0 && (
            <div className="p-4 text-gray-400 text-center">
              No completed tasks yet.
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
}
