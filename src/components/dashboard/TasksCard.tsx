"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Plus, Circle, AlertCircle } from "lucide-react";
import { BaseCard } from "./BaseCard";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/workspace-context";
import { fetchTasksByWorkspace, updateTask } from "@/api-service";
import { Skeleton } from "@/components/ui/skeleton";

export function TasksCard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();

  // Fetch tasks from the API
  useEffect(() => {
    async function fetchTasks() {
      if (!currentWorkspace?._id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fetchedTasks = await fetchTasksByWorkspace(currentWorkspace._id);
        console.log("Fetched tasks:", fetchedTasks);
        setTasks(fetchedTasks || []);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTasks();
  }, [currentWorkspace]);

  // Filter tasks based on their status
  const upcomingTasks = tasks.filter(
    (task) => !task.completed && !isOverdue(task.dueDate)
  );
  const overdueTasks = tasks.filter(
    (task) => !task.completed && isOverdue(task.dueDate)
  );
  const completedTasks = tasks.filter((task) => task.completed);

  // Helper function to check if a task is overdue
  function isOverdue(dueDate: string | undefined): boolean {
    if (!dueDate) return false;
    const now = new Date();
    const due = new Date(dueDate);
    return due < now;
  }

  // Format date for display
  function formatDate(dateString: string | undefined): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Toggle task completion status
  const toggleTaskCompletion = async (
    taskId: string,
    currentStatus: boolean
  ) => {
    try {
      // Optimistically update the UI
      setTasks(
        tasks.map((task) =>
          task._id === taskId ? { ...task, completed: !currentStatus } : task
        )
      );

      // Update in the backend
      await updateTask(taskId, { completed: !currentStatus });
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

  // Render loading skeleton
  if (isLoading) {
    return (
      <BaseCard title="My tasks">
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

  // Render error state
  if (error) {
    return (
      <BaseCard title="My tasks">
        <div className="flex flex-col items-center justify-center h-full text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <p className="text-gray-400">{error}</p>
          <Button
            variant="outline"
            className="mt-4 text-white"
            onClick={() => {
              setIsLoading(true);
              setError(null);
              fetchTasksByWorkspace(currentWorkspace?._id || "")
                .then((tasks) => {
                  setTasks(tasks || []);
                  setIsLoading(false);
                })
                .catch((err) => {
                  console.error("Error retrying task fetch:", err);
                  setError("Failed to load tasks");
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
    <BaseCard title="My tasks">
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
            Upcoming
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
            Overdue ({overdueTasks.length})
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
            Completed
          </button>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 mb-4 text-white font-medium hover:bg-white/5 p-2"
          onClick={handleCreateTask}
        >
          <div className="h-10 w-10 rounded flex items-center justify-center border-2 border-dashed border-gray-600">
            <Plus className="h-5 w-5" />
          </div>
          Create task
        </Button>

        <div className="space-y-2 flex-1 overflow-y-auto">
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
                  {task.dueDate && (
                    <div className="text-xs text-gray-500">Completed</div>
                  )}
                </div>
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
