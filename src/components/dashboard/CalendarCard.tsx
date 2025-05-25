"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BaseCard } from "./BaseCard";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTasksByProject, fetchProjectsByWorkspace } from "@/api-service";
import { useWorkspace } from "@/contexts/workspace-context";
import { useRouter } from "next/navigation";
import { getUserIdCookie } from "@/lib/cookies";
import { Task, Project } from "@/types";

interface CalendarCardProps {
  onRemove?: () => void;
  cardId?: string;
  isFullWidth?: boolean;
  onSizeChange?: (isFullWidth: boolean) => void;
}

export function CalendarCard({
  onRemove,
  cardId = "calendar-card",
  isFullWidth = false,
  onSizeChange,
}: CalendarCardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();

  // Fetch tasks with due dates
  useEffect(() => {
    async function fetchCalendarTasks() {
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
          console.log("No projects found in workspace for calendar");
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

        // Filter tasks assigned to the current user and with due dates
        const userTasksWithDueDate = allTasks.filter(
          (task) => task.assignee === userId && task.dueDate
        );

        console.log("All tasks:", allTasks.length);
        console.log(
          "User's tasks with due dates:",
          userTasksWithDueDate.length
        );

        // Check project structure in tasks
        if (userTasksWithDueDate.length > 0) {
          const sampleTask = userTasksWithDueDate[0];
          console.log("Sample task:", sampleTask);
          console.log("Sample task project:", sampleTask.project);
          console.log("Project type:", typeof sampleTask.project);

          if (
            typeof sampleTask.project === "object" &&
            sampleTask.project !== null
          ) {
            console.log("Project as object with _id:", sampleTask.project._id);
          } else if (typeof sampleTask.project === "string") {
            console.log("Project as string ID:", sampleTask.project);
          }
        }

        setTasks(userTasksWithDueDate || []);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCalendarTasks();
  }, [currentWorkspace]);

  // Handle month navigation
  const prevMonth = () => {
    setCurrentDate((prev) => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() - 1);
      return date;
    });
  };

  const nextMonth = () => {
    setCurrentDate((prev) => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() + 1);
      return date;
    });
  };

  // Get month data
  const getMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and total days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDayOfMonth.getDay();

    // Previous month's days to display
    const prevMonthDays = firstDayOfWeek;

    // Calculate days from previous month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

    // Create the calendar days array
    const days = [];

    // Add previous month's days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevMonthYear, prevMonth, daysInPrevMonth - i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Add current month's days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
      });
    }

    // Add next month's days to fill remaining cells (to make sure we have a clean grid)
    const totalDaysToShow = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
    const nextMonthDays = totalDaysToShow - (prevMonthDays + daysInMonth);

    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;

      const dueDate = new Date(task.dueDate);
      return (
        dueDate.getDate() === date.getDate() &&
        dueDate.getMonth() === date.getMonth() &&
        dueDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Navigate to project
  const handleTaskClick = (
    taskId: string,
    projectId: string | object | unknown
  ) => {
    console.log("Navigating to project:", projectId, "from task:", taskId);

    // Handle project ID whether it's a string or an object
    let projectIdToUse = projectId;

    // If it's an object with _id property, use that
    if (projectId && typeof projectId === "object" && "_id" in projectId) {
      projectIdToUse = (projectId as { _id: string })._id;
    }

    if (projectIdToUse && typeof projectIdToUse === "string") {
      // Navigate to project view
      router.push(`/projects/${projectIdToUse}`);
    } else {
      // If no project ID found, log the issue but don't navigate
      console.error(
        "No valid project ID found for task:",
        taskId,
        "Project data:",
        projectId
      );
    }
  };

  // Get month name and year for header
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const yearNumber = currentDate.getFullYear();

  // Days of week
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // For loading state
  if (isLoading) {
    return (
      <BaseCard
        title="Calendar"
        onRemove={onRemove}
        cardId={cardId}
        isFullWidth={isFullWidth}
        onSizeChange={onSizeChange}
      >
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded" />
            ))}
          </div>
        </div>
      </BaseCard>
    );
  }

  // For error state
  if (error) {
    return (
      <BaseCard
        title="Calendar"
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
              // Retry logic
              const userId = getUserIdCookie();
              if (!userId || !currentWorkspace?._id) {
                setError("Missing user or workspace information");
                setIsLoading(false);
                return;
              }

              // Use the same approach for retry
              fetchProjectsByWorkspace(currentWorkspace._id)
                .then(async (projects) => {
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

                  const userTasksWithDueDate = allTasks.filter(
                    (task) => task.assignee === userId && task.dueDate
                  );

                  setTasks(userTasksWithDueDate || []);
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

  // For normal state
  const calendarDays = getMonthData();

  return (
    <BaseCard
      title="Calendar"
      onRemove={onRemove}
      cardId={cardId}
      isFullWidth={isFullWidth}
      onSizeChange={onSizeChange}
    >
      <div className="h-full flex flex-col">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gray-800 h-7 w-7"
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-white text-sm font-medium flex items-center">
            <CalendarIcon className="h-3 w-3 mr-1" />
            {monthName} {yearNumber}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gray-800 h-7 w-7"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {daysOfWeek.map((day, i) => (
            <div
              key={i}
              className="text-[10px] text-center py-0.5 text-gray-400 font-medium"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 flex-1 overflow-y-auto scrollbar-hide">
          {calendarDays.map((day, i) => {
            const dayTasks = getTasksForDate(day.date);
            const hasOverdueTasks = dayTasks.some(
              (task) => !task.completed && new Date(task.dueDate!) < new Date()
            );

            return (
              <div
                key={i}
                className={cn(
                  "rounded-md p-1 flex flex-col min-h-[30px] max-h-[45px]",
                  day.isCurrentMonth
                    ? "bg-[#1a1a1a] border border-[#353535]"
                    : "bg-[#121212]",
                  day.isToday && "border-blue-500 border-2",
                  hasOverdueTasks && "border-red-500 border-opacity-50",
                  day.isCurrentMonth ? "text-white" : "text-gray-500"
                )}
              >
                <div className="text-[10px] flex justify-between items-center">
                  <span
                    className={cn(
                      day.isToday
                        ? "bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center"
                        : ""
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <span
                      className={cn(
                        "rounded-full h-1.5 w-1.5",
                        hasOverdueTasks ? "bg-red-500" : "bg-blue-500"
                      )}
                    />
                  )}
                </div>

                {/* Task indicators - limit to 1 visible item */}
                <div className="mt-0.5 overflow-hidden text-[9px]">
                  {dayTasks.slice(0, 1).map((task) => (
                    <div
                      key={task._id}
                      className={cn(
                        "truncate px-1 rounded cursor-pointer",
                        new Date(task.dueDate!) < new Date() && !task.completed
                          ? "bg-red-900/20 text-red-300"
                          : task.completed
                          ? "bg-green-900/20 text-green-300 line-through opacity-60"
                          : "bg-blue-900/20 text-blue-300"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();

                        // Handle both cases - project as string ID or as object
                        console.log("Task object:", task);
                        console.log("Project data:", task.project);

                        // Pass the project data as is - our handler will extract the ID properly
                        handleTaskClick(task._id, task.project);
                      }}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 1 && (
                    <div className="text-[8px] text-gray-400 pl-1">
                      +{dayTasks.length - 1} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BaseCard>
  );
}
