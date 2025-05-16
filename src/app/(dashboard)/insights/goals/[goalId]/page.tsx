"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { Goal, User, Project, Task } from "@/types";
import {
  fetchGoalById,
  fetchUsers,
  fetchProjects,
  fetchTasksByWorkspace,
  fetchWorkspaces,
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

export default function GoalDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params.goalId as string;
  const { authState } = useAuth();

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
  const [progressHistory] = useState([
    { date: "Jan", progress: 0 },
    { date: "Feb", progress: 15 },
    { date: "Mar", progress: 30 },
    { date: "Apr", progress: 45 },
    { date: "May", progress: 60 },
    { date: "Jun", progress: 75 },
  ]);

  // Helper function to check if a value is a valid MongoDB ID
  const isValidMongoId = (id: any): boolean => {
    return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id.trim());
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // First fetch the goal to get its workspace ID
      const goalData = await fetchGoalById(goalId);
      setGoal(goalData);

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

      // If no workspace ID could be extracted, get all workspaces and use the first one
      if (
        !workspaceId ||
        (typeof workspaceId === "object" && !workspaceId._id && !workspaceId.id)
      ) {
        try {
          console.log(
            "No valid workspace ID found, attempting to fetch all workspaces"
          );
          const workspaces = await fetchWorkspaces();
          if (workspaces && workspaces.length > 0) {
            workspaceId = workspaces[0]._id;
            console.log(`Using first workspace ID as fallback: ${workspaceId}`);
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
            // No validation needed here - we'll let the fetchTasksByWorkspace function handle object IDs
            fetchedTasks = await fetchTasksByWorkspace(workspaceId);
            console.log(`Successfully fetched ${fetchedTasks.length} tasks`);
          } catch (taskError) {
            console.error(`Error fetching tasks for workspace:`, taskError);

            // Try fallback with first workspace
            try {
              const workspaces = await fetchWorkspaces();
              if (workspaces && workspaces.length > 0) {
                const firstWorkspace = workspaces[0];
                console.log(`Using first available workspace as fallback`);
                fetchedTasks = await fetchTasksByWorkspace(firstWorkspace._id);
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
              usersData.find((u) => u._id === goalData.ownerId) || usersData[0],
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
    } catch (err) {
      console.error("Error loading goal data:", err);
      setError("Failed to load goal details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1E1E1E]">
        <div className="text-white">Loading goal details...</div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#1E1E1E]">
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

  const owner = users.find((u) => u._id === goal.ownerId);
  const goalMembers = users.filter((u) => goal.members?.includes(u._id));
  const linkedProjects = projects.filter((p) => goal.projects?.includes(p._id));

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      {/* Header */}
      <div className="bg-[#252525] border-b border-[#353535] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white mr-2"
              onClick={() => router.push("/insights/goals/my-goals")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{goal.title}</h1>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`px-3 py-1 rounded-full text-sm ${
                  goal.status === "on-track"
                    ? "bg-green-900/30 text-green-400"
                    : goal.status === "at-risk"
                    ? "bg-yellow-900/30 text-yellow-400"
                    : goal.status === "off-track"
                    ? "bg-red-900/30 text-red-400"
                    : goal.status === "achieved"
                    ? "bg-blue-900/30 text-blue-400"
                    : "bg-gray-900/30 text-gray-400"
                }`}
              >
                {goal.status === "no-status"
                  ? "No Status"
                  : goal.status.replace(/-/g, " ")}
              </div>
              <div className="mx-4 h-4 border-r border-[#353535]"></div>
              <div className="text-sm text-gray-400">
                {goal.timeframe} {goal.timeframeYear}
              </div>
            </div>
            <div className="flex items-center">
              <Button
                variant="outline"
                className="bg-transparent border-[#353535] text-white hover:bg-[#252525] mr-2"
              >
                Edit
              </Button>
              <Button className="bg-[#4573D2] hover:bg-[#3A62B3]">
                Update Progress
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
          <div className="bg-[#252525] border border-[#353535] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Progress</h2>
              <div className="text-3xl font-bold">{goal.progress}%</div>
            </div>
            <Progress value={goal.progress} className="h-2 mb-6" />

            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#353535" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #353535",
                      borderRadius: "4px",
                      color: "white",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="progress"
                    stroke="#4573D2"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#4573D2" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Progress source section */}
            <div className="border-t border-[#353535] pt-4">
              <div className="flex items-center mb-4">
                {goal.progressSource === "projects" && (
                  <>
                    <Clipboard className="h-5 w-5 mr-2 text-blue-400" />
                    <h3 className="text-lg font-medium">
                      Progress from Projects
                    </h3>
                  </>
                )}
                {goal.progressSource === "tasks" && (
                  <>
                    <ListChecks className="h-5 w-5 mr-2 text-green-400" />
                    <h3 className="text-lg font-medium">Progress from Tasks</h3>
                  </>
                )}
                {(!goal.progressSource || goal.progressSource === "none") && (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2 text-gray-400" />
                    <h3 className="text-lg font-medium">
                      Manual Progress Updates
                    </h3>
                  </>
                )}
              </div>

              {/* Connected projects/tasks based on progress source */}
              {goal.progressSource === "projects" && (
                <div className="space-y-3">
                  {linkedProjects.length > 0 ? (
                    linkedProjects.map((project) => (
                      <div
                        key={project._id}
                        className="flex items-center justify-between p-3 bg-[#1E1E1E] rounded-md"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: project.color }}
                          ></div>
                          <span>{project.name}</span>
                        </div>
                        <Progress value={60} className="w-24 h-1.5" />
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
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Connect Project
                  </Button>
                </div>
              )}

              {goal.progressSource === "tasks" && (
                <div className="space-y-3">
                  {tasks && tasks.length > 0 ? (
                    tasks.map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center justify-between p-3 bg-[#1E1E1E] rounded-md"
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
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-[#353535] text-white hover:bg-[#252525] w-full flex items-center justify-center"
                    onClick={loadData}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {Array.isArray(tasks)
                      ? "Connect Tasks"
                      : "Retry Loading Tasks"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Description card */}
          <div className="bg-[#252525] border border-[#353535] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-gray-300">
              {goal.description || "No description provided."}
            </p>
          </div>

          {/* Comments card */}
          <div className="bg-[#252525] border border-[#353535] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Comments
            </h2>

            <div className="space-y-6 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback>
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
                <AvatarFallback>
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
                  className="min-h-[80px] bg-[#1E1E1E] border-[#353535] text-white resize-none pr-10"
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
          <div className="bg-[#252525] border border-[#353535] rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">People</h2>

            {/* Owner */}
            <div className="mb-6">
              <h3 className="text-sm text-gray-400 mb-2">Owner</h3>
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-3 bg-[#f87171]">
                  <AvatarFallback>
                    {getInitials(owner?.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span>{owner?.fullName || owner?.email || "Unknown"}</span>
              </div>
            </div>

            {/* Members */}
            <div>
              <h3 className="text-sm text-gray-400 mb-2">Members</h3>
              {goalMembers.length > 0 ? (
                <div className="space-y-2">
                  {goalMembers.map((member) => (
                    <div key={member._id} className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3 bg-[#4573D2]">
                        <AvatarFallback>
                          {getInitials(member.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.fullName || member.email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  No additional members
                </div>
              )}
            </div>
          </div>

          {/* Time period card */}
          <div className="bg-[#252525] border border-[#353535] rounded-lg p-6">
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
          <div className="bg-[#252525] border border-[#353535] rounded-lg p-6">
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
    </div>
  );
}
