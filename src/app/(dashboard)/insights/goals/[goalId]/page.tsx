"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  MessageSquare,
  Calendar,
  Users,
  Clipboard,
  ListChecks,
  AlertCircle,
  PlusCircle,
  Send,
  Search,
  X,
  Check,
  Circle,
} from "lucide-react";
import { Goal, User, Project, Task } from "@/types";
import {
  fetchGoalById,
  fetchUsers,
  fetchProjects,
  fetchWorkspaces,
  linkTaskToGoal,
  updateGoal,
  calculateGoalProgress,
  updateProjectStatus,
  fetchProjectsByWorkspace,
  fetchTasksByProject,
  updateTaskCompletionAndProgress,
  updateProjectStatusAndProgress,
} from "@/api-service";
import { useAuth } from "@/contexts/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function GoalDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params.goalId as string;
  const { authState } = useAuth();
  const isLoadingRef = useRef(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<
    { id: string; user: User; content: string; timestamp: Date }[]
  >([]);
  const [progressHistory, setProgressHistory] = useState<
    { date: string; progress: number }[]
  >(() => {
    // Initialize with empty data structure for the last 6 months
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11

    const lastSixMonths = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      lastSixMonths.push(months[monthIndex]);
    }

    return lastSixMonths.map((month) => ({
      date: month,
      progress: 0,
    }));
  });

  // States for modals
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [savingChanges, setSavingChanges] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Helper function to check if a value is a valid MongoDB ID
  const isValidMongoId = (id: any): boolean => {
    return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id.trim());
  };

  // Helper function to extract the ID from a user object or string
  const getUserId = (user: any): string | null => {
    if (!user) return null;
    if (typeof user === "string") return user;
    if (typeof user === "object") return user._id || user.id || null;
    return null;
  };

  // Function to update the progress history chart
  const updateProgressHistory = useCallback((currentGoal: Goal | null) => {
    if (!currentGoal) return;

    // Get current month and generate last 6 months
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11

    // Create an array of the last 6 months
    const lastSixMonths = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12; // Ensure we wrap around correctly
      lastSixMonths.push(months[monthIndex]);
    }

    // Create a simple progression based on current progress
    // This is a simple interpolation - in a real app you'd fetch actual historical data
    const currentProgress = currentGoal.progress || 0;
    const progressPoints = lastSixMonths.map((month, index) => {
      // Simple progression: earlier months have lower progress
      const factor = index / 5; // 0 to 1
      const monthProgress = Math.round(currentProgress * factor);

      return {
        date: month,
        progress: monthProgress,
      };
    });

    // Add current month with current progress
    progressPoints[5] = {
      date: lastSixMonths[5],
      progress: currentProgress,
    };

    setProgressHistory(progressPoints);
  }, []);

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    try {
      // First fetch the goal to get its workspace ID
      const goalData = await fetchGoalById(goalId);
      setGoal(goalData);

      // Add debug logs to understand the structure of the goal data
      console.log("Full goal data from API:", goalData);
      console.log("Owner details:", goalData.owner || goalData.ownerId);
      console.log("Members array:", goalData.members);

      // Get the workspace ID from the goal
      let workspaceId = goalData.workspaceId;

      // Full debug of the goal object to see what fields are available
      console.log("Goal object structure:", Object.keys(goalData));
      console.log(`Goal data retrieved - Goal ID: ${goalId}`);
      console.log(
        `Goal workspace ID value:`,
        workspaceId,
        `type: ${typeof workspaceId}`
      );

      // Check if we need to extract workspace ID from other fields
      if (!workspaceId && goalData.workspace) {
        // Try to get ID from workspace object if available
        if (typeof goalData.workspace === "string") {
          workspaceId = goalData.workspace;
        } else if (typeof goalData.workspace === "object") {
          workspaceId = goalData.workspace._id || goalData.workspace.id;
        }
        console.log(
          `Found alternative workspace ID: ${workspaceId} from workspace field`
        );
      }

      // Ensure workspaceId is a valid MongoDB ID string
      if (workspaceId) {
        // If it's an object, extract the ID string
        if (typeof workspaceId === "object") {
          workspaceId = workspaceId._id || workspaceId.id;
        }

        // Validate that it's a proper MongoDB ID format
        if (!isValidMongoId(workspaceId)) {
          console.warn(`Invalid workspace ID format: ${workspaceId}`);
          workspaceId = null; // Reset to null if invalid
        } else {
          console.log(`Using validated workspace ID: ${workspaceId}`);
        }
      }

      // If no workspace ID could be extracted or it's invalid, get all workspaces and use the first one
      if (!workspaceId) {
        try {
          console.log(
            "No valid workspace ID found, attempting to fetch all workspaces"
          );
          const workspaces = await fetchWorkspaces();
          if (workspaces && workspaces.length > 0) {
            const firstWorkspaceId = workspaces[0]._id;

            // Validate the fallback workspace ID as well
            if (isValidMongoId(firstWorkspaceId)) {
              workspaceId = firstWorkspaceId;
              console.log(
                `Using first workspace ID as fallback: ${workspaceId}`
              );
            } else {
              console.error("Fallback workspace ID is also invalid");
            }
          } else {
            console.error(
              "No workspaces found and goal has no valid workspace ID"
            );
          }
        } catch (workspaceError) {
          console.error(
            "Error fetching workspaces for fallback:",
            workspaceError
          );
        }
      }

      let fetchedTasks: Task[] = [];
      let usersData, projectsData;

      try {
        // Fetch users and projects in parallel
        [usersData, projectsData] = await Promise.all([
          fetchUsers(),
          fetchProjects(),
        ]);

        // Fetch tasks separately to handle errors
        if (workspaceId) {
          console.log(
            `Attempting to fetch tasks with workspace ID:`,
            workspaceId
          );
          try {
            // Instead of using fetchTasksByWorkspace, get projects first then tasks
            if (!isValidMongoId(workspaceId)) {
              console.error(
                `Cannot fetch projects: Invalid workspace ID format: ${workspaceId}`
              );
              throw new Error("Invalid workspace ID format");
            }

            console.log(
              `Fetching projects with validated workspace ID: ${workspaceId}`
            );
            const projects = await fetchProjectsByWorkspace(workspaceId);

            if (projects && projects.length > 0) {
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

              console.log(
                `Successfully fetched ${allTasks.length} tasks from all projects`
              );
              fetchedTasks = allTasks;
            } else {
              console.log("No projects found in the workspace");
            }
          } catch (taskError) {
            console.error(`Error fetching tasks for workspace:`, taskError);

            // Try fallback with first workspace
            try {
              const workspaces = await fetchWorkspaces();
              if (workspaces && workspaces.length > 0) {
                const firstWorkspace = workspaces[0];
                console.log(`Using first available workspace as fallback`);

                // Use the same approach for the fallback - get projects first, then tasks
                const firstWorkspaceId = firstWorkspace._id;

                if (!isValidMongoId(firstWorkspaceId)) {
                  console.error(
                    `Cannot fetch projects: Invalid fallback workspace ID format: ${firstWorkspaceId}`
                  );
                  throw new Error("Invalid fallback workspace ID format");
                }

                console.log(
                  `Fetching projects with validated fallback workspace ID: ${firstWorkspaceId}`
                );
                const projects = await fetchProjectsByWorkspace(
                  firstWorkspaceId
                );

                if (projects && projects.length > 0) {
                  // Fetch tasks for each project and combine them
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

                  console.log(
                    `Successfully fetched ${allTasks.length} tasks from fallback workspace`
                  );
                  fetchedTasks = allTasks;
                } else {
                  console.log("No projects found in the fallback workspace");
                }
              }
            } catch (fallbackError) {
              console.error(
                "Failed to fetch tasks with fallback workspace:",
                fallbackError
              );
            }
          }
        } else {
          console.warn("No workspace ID found on the goal");
        }
      } catch (fetchError) {
        console.error("Error fetching supplementary data:", fetchError);
        // Continue with what we have - we already have the goal data
      }

      setUsers(usersData || []);
      setProjects(projectsData || []);
      setTasks(fetchedTasks);

      // For demo purposes - in a real app, comments would be fetched from the API
      if (usersData && usersData.length > 0) {
        setComments([
          {
            id: "1",
            user:
              usersData.find(
                (u) => u._id === getUserId(goalData.ownerId || goalData.owner)
              ) || usersData[0],
            content: "Let's make sure we stay on track with this goal.",
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
          },
          {
            id: "2",
            user: usersData[Math.floor(Math.random() * usersData.length)],
            content: "I've started working on the first milestone.",
            timestamp: new Date(Date.now() - 43200000), // 12 hours ago
          },
        ]);
      }

      // Immediately recalculate progress to ensure it's up to date
      try {
        await calculateGoalProgress(goalId);
        // Fetch the goal again to get the updated progress
        const updatedGoal = await fetchGoalById(goalId);
        setGoal(updatedGoal);
        updateProgressHistory(updatedGoal);
      } catch (progressError) {
        console.error("Error calculating goal progress:", progressError);
      }
    } catch (err) {
      console.error("Error loading goal data:", err);
      setError("Failed to load goal details. Please try again.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [goalId, updateProgressHistory]);

  // Function to manually recalculate goal progress
  const handleRecalculateProgress = useCallback(async () => {
    if (!goal || updatingProgress) return;

    setUpdatingProgress(true);
    try {
      // Call the API to recalculate progress
      const updatedProgress = await calculateGoalProgress(goalId);

      // Immediately get the updated goal data
      const updatedGoal = await fetchGoalById(goalId);

      // Update the local goal state with the fresh data
      setGoal(updatedGoal);
      updateProgressHistory(updatedGoal);

      toast.success("Goal progress updated successfully");
    } catch (error) {
      console.error("Error updating goal progress:", error);
      toast.error("Failed to update goal progress");
    } finally {
      setUpdatingProgress(false);
    }
  }, [goalId, goal, updateProgressHistory]);

  useEffect(() => {
    if (!goalId) return;
    loadData();

    // Cleanup function
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [loadData, goalId]);

  // Set up a separate interval effect that only runs when we have a goal loaded
  useEffect(() => {
    if (!goal || loading || refreshIntervalRef.current) return; // Skip if still loading, no goal, or interval already exists

    console.log("Setting up goal progress refresh interval");
    // Refresh progress every 30 seconds instead of 10 for better performance
    refreshIntervalRef.current = setInterval(() => {
      console.log("Auto-refreshing goal progress");
      handleRecalculateProgress();
    }, 30000);

    // Clean up interval on component unmount or when dependencies change
    return () => {
      if (refreshIntervalRef.current) {
        console.log("Clearing goal progress refresh interval");
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [goal, loading, handleRecalculateProgress]);

  // Function to check for project/task completion to update progress
  useEffect(() => {
    if (goal && goal.progressResource) {
      // For projects-based progress, check if any projects are completed but progress isn't updated
      if (
        goal.progressResource === "projects" &&
        goal.projects &&
        goal.projects.length > 0
      ) {
        const projectEntities = Array.isArray(goal.projects)
          ? goal.projects
          : [];
        const completedCount = projectEntities.filter((p) => {
          const project =
            typeof p === "string"
              ? projects.find((proj) => proj._id === p)
              : projects.find((proj) => proj._id === p._id);
          return project && project.completed;
        }).length;

        const expectedProgress =
          projectEntities.length > 0
            ? Math.round((completedCount / projectEntities.length) * 100)
            : 0;

        // If progress is outdated, suggest recalculation
        if (Math.abs(expectedProgress - goal.progress) > 5) {
          console.log("Progress mismatch detected:", {
            currentProgress: goal.progress,
            expectedProgress,
            completedCount,
            totalProjects: projectEntities.length,
          });
          toast.info(
            "Project status changed. Click 'Update Progress' to recalculate.",
            { duration: 5000 }
          );
        }
      }

      // For tasks-based progress, similar check
      if (
        goal.progressResource === "tasks" &&
        goal.linkedTasks &&
        goal.linkedTasks.length > 0
      ) {
        const taskIds = goal.linkedTasks.map((t) =>
          typeof t === "string" ? t : t._id
        );
        const linkedTasks = tasks.filter((t) => taskIds.includes(t._id));

        if (linkedTasks.length > 0) {
          const completedCount = linkedTasks.filter((t) => t.completed).length;
          const expectedProgress = Math.round(
            (completedCount / linkedTasks.length) * 100
          );

          // If progress is outdated, suggest recalculation
          if (Math.abs(expectedProgress - goal.progress) > 5) {
            console.log("Task progress mismatch detected:", {
              currentProgress: goal.progress,
              expectedProgress,
              completedCount,
              totalTasks: linkedTasks.length,
            });
            toast.info(
              "Task status changed. Click 'Update Progress' to recalculate.",
              { duration: 5000 }
            );
          }
        }
      }
    }
  }, [goal, projects, tasks]);

  // Update progress history when goal changes
  useEffect(() => {
    if (goal) {
      updateProgressHistory(goal);
    }
  }, [goal, updateProgressHistory]);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleAddComment = () => {
    if (!comment.trim() || !authState.userId) return;

    const currentUser = users.find((u) => u._id === authState.userId);
    if (!currentUser) return;

    const newComment = {
      id: Date.now().toString(),
      user: currentUser,
      content: comment,
      timestamp: new Date(),
    };

    setComments([...comments, newComment]);
    setComment("");

    // In a real app, you would send the comment to the API
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  const handleConnectTask = () => {
    setSelectedItems([]);
    setSearchQuery("");
    setShowTasksModal(true);
  };

  const handleConnectProject = () => {
    setSelectedItems([]);
    setSearchQuery("");
    setShowProjectsModal(true);
  };

  const handleSaveSelectedTasks = async () => {
    if (selectedItems.length === 0 || !goal) return;

    setSavingChanges(true);
    try {
      // Link each selected task to the goal
      for (const taskId of selectedItems) {
        await linkTaskToGoal(goalId, taskId);
      }

      // Set progress resource to tasks if not already set
      if (goal.progressResource !== "tasks") {
        await updateGoal(goalId, { progressResource: "tasks" });
      }

      // Reload goal data
      await loadData();
      toast.success(`${selectedItems.length} tasks linked to goal`);
      setShowTasksModal(false);
    } catch (error) {
      console.error("Error linking tasks to goal:", error);
      toast.error("Failed to link tasks to goal");
    } finally {
      setSavingChanges(false);
    }
  };

  const handleSaveSelectedProjects = async () => {
    if (selectedItems.length === 0 || !goal) return;

    setSavingChanges(true);
    try {
      // Update goal with the selected projects
      await updateGoal(goalId, {
        projects: selectedItems,
        progressResource: "projects",
      });

      // Reload goal data
      await loadData();
      toast.success(`${selectedItems.length} projects linked to goal`);
      setShowProjectsModal(false);
    } catch (error) {
      console.error("Error linking projects to goal:", error);
      toast.error("Failed to link projects to goal");
    } finally {
      setSavingChanges(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filteredTasks = tasks.filter(
    (task) =>
      (task.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      )
  );

  const filteredProjects = projects.filter(
    (project) =>
      (project.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      )
  );

  // Function to calculate progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-[#4573D2]";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-[#4573D2]";
  };

  // Add a timeout to prevent infinite loading state
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.error("Goal loading timed out after 10 seconds");
          setLoading(false);
          setError("Loading timed out. Please try refreshing the page.");
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  // Handle task completion toggle
  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    try {
      // Optimistically update the UI
      const updatedTasks = tasks.map((task) =>
        task._id === taskId
          ? {
              ...task,
              completed: !currentStatus,
              status: !currentStatus ? "completed" : "not started",
              completedAt: !currentStatus ? new Date() : undefined,
            }
          : task
      );
      setTasks(updatedTasks);

      // Update in the backend and recalculate goal progress for this specific goal
      await updateTaskCompletionAndProgress(taskId, !currentStatus, goalId);
      
      // No need to manually recalculate goal progress as updateTaskCompletionAndProgress does it
    } catch (error) {
      console.error("Error updating task:", error);
      // Revert the UI change if the API call fails
      setTasks((prev) => 
        prev.map((task) => 
          task._id === taskId ? { ...task, completed: currentStatus } : task
        )
      );
      toast.error("Failed to update task. Please try again.");
    }
  };

  // Handle project completion toggle
  const toggleProjectCompletion = async (projectId: string, currentStatus: boolean) => {
    try {
      // Optimistically update the UI
      const updatedProjects = projects.map((project) =>
        project._id === projectId
          ? {
              ...project,
              completed: !currentStatus,
              status: !currentStatus ? "completed" : "in progress",
            }
          : project
      );
      setProjects(updatedProjects);

      // Update in the backend and recalculate goal progress for this specific goal
      await updateProjectStatusAndProgress(projectId, !currentStatus, goalId);
      
      // No need to manually recalculate goal progress as updateProjectStatusAndProgress does it
    } catch (error) {
      console.error("Error updating project:", error);
      // Revert the UI change if the API call fails
      setProjects((prev) => 
        prev.map((project) => 
          project._id === projectId ? { ...project, completed: currentStatus } : project
        )
      );
      toast.error("Failed to update project. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212]">
        <div className="text-white mb-4">Loading goal details...</div>
        <Button
          variant="outline"
          onClick={() => router.push("/insights/goals/my-goals")}
          className="mt-4 bg-transparent border-[#353535] text-white hover:bg-[#252525]"
        >
          Back to Goals
        </Button>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212]">
        <div className="text-red-500 mb-4">{error || "Goal not found"}</div>
        <div className="flex space-x-4">
          <Button
            onClick={() => router.push("/insights/goals/my-goals")}
            variant="outline"
            className="bg-transparent border-[#353535] text-white hover:bg-[#252525]"
          >
            Back to Goals
          </Button>
          {error && (
            <Button
              onClick={() => {
                setError(null);
                setLoading(true);
                loadData();
              }}
              className="bg-[#4573D2] hover:bg-[#3A62B3]"
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Extract owner information
  let owner = null;

  // First, check if the goal already has the owner populated
  if (
    goal.owner &&
    typeof goal.owner === "object" &&
    (goal.owner._id || goal.owner.id)
  ) {
    // Owner is directly available in the goal object
    owner = goal.owner;
    console.log("Using populated owner from goal:", owner);
  } else {
    // Find owner in the users array using ownerId
    const ownerId = getUserId(goal.ownerId || goal.owner);
    if (ownerId) {
      owner = users.find((u) => u._id === ownerId);
      console.log(
        `Looking for owner with ID ${ownerId} in users array:`,
        owner
      );
    }
  }

  // Extract members information
  let goalMembers = [];

  // Process the members array, handling both ID strings and objects
  if (goal.members && Array.isArray(goal.members)) {
    if (goal.members.length > 0) {
      console.log("Processing members array:", goal.members);

      // Get the owner ID to exclude from members list
      const ownerId = getUserId(goal.ownerId || goal.owner);
      console.log("Owner ID to exclude from members:", ownerId);

      // Convert all member entries to IDs
      const memberIds = goal.members
        .map((member) => getUserId(member))
        .filter(Boolean)
        // Filter out the owner ID from the members list
        .filter((id) => id !== ownerId);

      console.log("Extracted member IDs (excluding owner):", memberIds);

      // Find matching users
      goalMembers = users.filter((user) => memberIds.includes(user._id));
      console.log(
        "Found member users (excluding owner):",
        goalMembers.map((m) => m._id)
      );
    }
  }

  const linkedProjects = projects.filter((p) =>
    goal.projects?.some((proj) => getUserId(proj) === p._id)
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#353535] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white mr-2 hover:bg-[#353535]"
              onClick={() => router.push("/insights/goals/my-goals")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{goal.title}</h1>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mx-4 h-4 border-r border-[#353535]"></div>
              <div className="text-sm text-gray-400">
                {goal.timeframe} {goal.timeframeYear}
              </div>
            </div>
            <div className="flex items-center">
              <Button
                className="bg-[#4573D2] hover:bg-[#3A62B3]"
                onClick={handleRecalculateProgress}
                disabled={updatingProgress}
              >
                {updatingProgress ? "Updating..." : "Refresh Progress"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left column - Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress card */}
          <div className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Progress</h2>
              <div className="text-3xl font-bold">{goal.progress}%</div>
            </div>
            <Progress
              value={goal.progress}
              className={`h-2 mb-6 ${
                goal.progress >= 75
                  ? "bg-green-900 [&>div]:bg-green-500"
                  : goal.progress >= 50
                  ? "bg-blue-900 [&>div]:bg-[#4573D2]"
                  : goal.progress >= 25
                  ? "bg-yellow-900 [&>div]:bg-yellow-500"
                  : "bg-gray-900 [&>div]:bg-[#4573D2]"
              }`}
            />

            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#353535" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis
                    stroke="#6b7280"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #353535",
                      borderRadius: "4px",
                      color: "white",
                    }}
                    formatter={(value) => [`${value}%`, "Progress"]}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="progress"
                    stroke="#4573D2"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#4573D2" }}
                    isAnimationActive={true}
                    animationDuration={1000}
                    name="Progress"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Progress source section */}
            <div className="border-t border-[#353535] pt-4">
              <div className="flex items-center mb-4">
                {goal && goal.progressResource === "projects" && (
                  <>
                    <Clipboard className="h-5 w-5 mr-2 text-blue-400" />
                    <h3 className="text-lg font-medium">
                      Progress from Projects
                    </h3>
                  </>
                )}
                {goal && goal.progressResource === "tasks" && (
                  <>
                    <ListChecks className="h-5 w-5 mr-2 text-green-400" />
                    <h3 className="text-lg font-medium">Progress from Tasks</h3>
                  </>
                )}
                {goal &&
                  (!goal.progressResource ||
                    goal.progressResource === "none") && (
                    <>
                      <AlertCircle className="h-5 w-5 mr-2 text-gray-400" />
                      <h3 className="text-lg font-medium">
                        Manual Progress Updates
                      </h3>
                    </>
                  )}
              </div>

              {/* Connected projects/tasks based on progress source */}
              {goal && goal.progressResource === "projects" && (
                <div className="space-y-3">
                  {linkedProjects.length > 0 ? (
                    linkedProjects.map((project) => (
                      <div
                        key={project._id}
                        className="flex items-center justify-between p-3 bg-[#121212] rounded-md"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: project.color }}
                          ></div>
                          <span>{project.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <Progress
                              value={
                                project.completed ? 100 : project.progress || 0
                              }
                              className={`w-24 h-1.5 ${
                                project.completed ||
                                project.status === "completed"
                                  ? "bg-green-900 [&>div]:bg-green-500"
                                  : ""
                              }`}
                            />
                            <span className="text-xs text-gray-400 mt-1">
                              {project.completed ||
                              project.status === "completed"
                                ? "Completed"
                                : project.status || "In progress"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm mb-3">
                      No projects connected yet
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-[#353535] text-white hover:bg-[#252525] w-full flex items-center justify-center"
                    onClick={handleConnectProject}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Connect Project
                  </Button>
                </div>
              )}

              {goal && goal.progressResource === "tasks" && (
                <div className="space-y-3">
                  {tasks && tasks.length > 0 ? (
                    // Filter tasks to only show ones linked to this goal
                    tasks
                      .filter(
                        (task) =>
                          goal.linkedTasks &&
                          Array.isArray(goal.linkedTasks) &&
                          goal.linkedTasks.some((lt) =>
                            typeof lt === "string"
                              ? lt === task._id
                              : lt._id === task._id
                          )
                      )
                      .map((project) => (
                        <div
                          key={project._id}
                          className="flex items-center justify-between p-3 bg-[#121212] rounded-md"
                        >
                          <div className="flex items-center">
                            <span>{task.title}</span>
                          </div>
                          <Progress
                            value={task.completed ? 100 : 0}
                            className="w-24 h-1.5"
                          />
                        </div>
                      ))
                  ) : (
                    <div className="text-gray-400 text-sm mb-3">
                      {Array.isArray(tasks)
                        ? "No tasks connected yet"
                        : "Unable to load tasks. Please try refreshing."}
                    </div>
                  )}
                  <Button
                              variant="ghost"
                    size="sm"
                    className="bg-transparent border-[#353535] text-white hover:bg-[#252525] w-full flex items-center justify-center"
                    onClick={handleConnectTask}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Connect Tasks
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Description card */}
          <div className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-gray-300">
              {goal.description || "No description provided."}
            </p>
          </div>

          {/* Comments card */}
          <div className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Comments
            </h2>

            <div className="space-y-6 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-blue-600">
                      {getInitials(comment.user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="font-medium">
                        {comment.user.fullName || comment.user.email}
                      </span>
                      <span className="text-gray-400 text-xs ml-2">
                        {formatDate(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-300">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarFallback className="bg-blue-600">
                  {getInitials(
                    users.find((u) => u._id === authState.userId)?.fullName
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px] bg-[#121212] border-[#353535] text-white resize-none pr-10"
                />
                <Button
                  size="icon"
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-[#4573D2] hover:bg-[#3A62B3]"
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Owner and members card */}
          <div className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">People</h2>

            {/* Owner */}
            <div className="mb-6">
              <h3 className="text-sm text-gray-400 mb-2">Owner</h3>
              {owner ? (
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-red-600">
                      {getInitials(owner?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{owner?.fullName || owner?.email || "Unknown"}</span>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">Owner not found</div>
              )}
            </div>

            {/* Members */}
            <div>
              <h3 className="text-sm text-gray-400 mb-2">Members</h3>
              {goalMembers.length > 0 ? (
                <div className="space-y-2">
                  {goalMembers.map((member) => (
                    <div key={member._id} className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarFallback className="bg-indigo-600">
                          {getInitials(member.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.fullName || member.email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  No additional team members
                </div>
              )}
            </div>
          </div>

          {/* Time period card */}
          <div className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Time Period
            </h2>
            <div className="text-lg">
              {goal.timeframe} {goal.timeframeYear}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {goal.timeframe === "Q1" && "January 1 - March 31"}
              {goal.timeframe === "Q2" && "April 1 - June 30"}
              {goal.timeframe === "Q3" && "July 1 - September 30"}
              {goal.timeframe === "Q4" && "October 1 - December 31"}
              {goal.timeframe === "H1" && "January 1 - June 30"}
              {goal.timeframe === "H2" && "July 1 - December 31"}
              {goal.timeframe === "FY" && "January 1 - December 31"}
              {goal.timeframe === "custom" &&
                (goal.startDate && goal.dueDate
                  ? `${new Date(
                      goal.startDate
                    ).toLocaleDateString()} - ${new Date(
                      goal.dueDate
                    ).toLocaleDateString()}`
                  : "Custom date range")}
            </div>
          </div>

          {/* Privacy card */}
          <div className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Privacy
            </h2>
            <div className="text-lg">
              {goal.isPrivate ? "Private to members" : "Visible to workspace"}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {goal.isPrivate
                ? "Only you and selected members can see this goal"
                : "All workspace members can see this goal"}
            </div>
          </div>
        </div>
      </div>

      {/* Task Selection Modal */}
      <Dialog open={showTasksModal} onOpenChange={setShowTasksModal}>
        <DialogContent className="bg-[#1a1a1a] border-[#353535] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Tasks to Goal</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                className="pl-8 bg-[#121212] border-[#353535] text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {selectedItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedItems.map((id) => {
                  const task = tasks.find((t) => t._id === id);
                  return task ? (
                    <Badge
                      key={id}
                      className="bg-[#4573D2] hover:bg-[#3A62B3] flex items-center gap-1 pl-2 pr-1 py-1"
                            >
                      {task.title}
                      {task.project && (
                        <span className="text-xs opacity-80 mx-1">
                          (
                          {typeof task.project === "object" && task.project.name
                            ? task.project.name
                            : typeof task.project === "string"
                            ? projects.find((p) => p._id === task.project)
                                ?.name || "Unknown"
                            : "Unknown"}
                          )
                        </span>
                      )}
                      <button
                        onClick={() => toggleItemSelection(id)}
                        className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-[#5a82d8] ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto pr-1">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    className="mb-2 p-3 rounded-md bg-[#121212] border border-[#353535] flex items-center gap-3"
                  >
                    <Checkbox
                      id={`task-${task._id}`}
                      checked={selectedItems.includes(task._id)}
                      onCheckedChange={() => toggleItemSelection(task._id)}
                    />
                    <label
                      htmlFor={`task-${task._id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{task.title}</div>
                      <div className="flex items-center mt-1">
                        {/* Project badge - handle different possible structures */}
                        {task.project && (
                          <div
                            className="text-xs px-2 py-0.5 rounded-full mr-2"
                            style={{
                              backgroundColor:
                                typeof task.project === "object" &&
                                task.project.color
                                  ? `${task.project.color}30`
                                  : "#4573D230",
                              color:
                                typeof task.project === "object" &&
                                task.project.color
                                  ? task.project.color
                                  : "#4573D2",
                            }}
                          >
                            {typeof task.project === "object" &&
                            task.project.name
                              ? task.project.name
                              : typeof task.project === "string"
                              ? projects.find((p) => p._id === task.project)
                                  ?.name || "Unknown Project"
                              : "Unknown Project"}
                          </div>
                        )}
                        {!task.project && (
                          <div className="text-xs px-2 py-0.5 rounded-full mr-2 bg-gray-800 text-gray-400">
                            No Project
                          </div>
                        )}
                        {task.description && (
                          <div className="text-xs text-gray-400 truncate">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">
                  {searchQuery
                    ? "No matching tasks found"
                    : "No tasks available"}
                </div>
                              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              className="bg-transparent border-[#353535] text-white hover:bg-[#252525]"
              onClick={() => setShowTasksModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#4573D2] hover:bg-[#3A62B3]"
              disabled={selectedItems.length === 0 || savingChanges}
              onClick={handleSaveSelectedTasks}
            >
              {savingChanges
                ? "Saving..."
                : `Connect ${selectedItems.length} Tasks`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Selection Modal */}
      <Dialog open={showProjectsModal} onOpenChange={setShowProjectsModal}>
        <DialogContent className="bg-[#1a1a1a] border-[#353535] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Projects to Goal</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                className="pl-8 bg-[#1a1a1a] border-[#353535] text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {selectedItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedItems.map((id) => {
                  const project = projects.find((p) => p._id === id);
                  return project ? (
                    <Badge
                      key={id}
                      className="bg-[#4573D2] hover:bg-[#3A62B3] flex items-center gap-1 pl-2 pr-1 py-1"
                    >
                      {project.name}
                      <button
                        onClick={() => toggleItemSelection(id)}
                        className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-[#5a82d8] ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto pr-1">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <div
                    key={project._id}
                    className="mb-2 p-3 rounded-md bg-[#121212] border border-[#353535] flex items-center gap-3"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color || "#4573D2" }}
                    />
                    <Checkbox
                      id={`project-${project._id}`}
                      checked={selectedItems.includes(project._id)}
                      onCheckedChange={() => toggleItemSelection(project._id)}
                    />
                    <label
                      htmlFor={`project-${project._id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{project.name}</div>
                      
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">
                  {searchQuery
                    ? "No matching projects found"
                    : "No projects available"}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              className="bg-transparent border-[#353535] text-white hover:bg-[#252525]"
              onClick={() => setShowProjectsModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#4573D2] hover:bg-[#3A62B3]"
              disabled={selectedItems.length === 0 || savingChanges}
              onClick={handleSaveSelectedProjects}
            >
              {savingChanges
                ? "Saving..."
                : `Connect ${selectedItems.length} Projects`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
