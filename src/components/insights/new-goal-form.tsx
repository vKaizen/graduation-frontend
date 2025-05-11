"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronDown,
  User2,
  Calendar,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  createGoal,
  fetchUsers,
  fetchProjects,
  fetchWorkspaces,
} from "@/api-service";
import type {
  User,
  Project,
  Workspace,
  CreateGoalDto,
  GoalTimeframe,
} from "@/types";
import { useWorkspace } from "@/contexts/workspace-context";
import { Progress } from "@/components/ui/progress";

export function NewGoalForm() {
  const router = useRouter();
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<GoalTimeframe>("Q2");
  const [selectedTimeframeYear, setSelectedTimeframeYear] = useState<number>(
    new Date().getFullYear()
  );
  const [progressSource, setProgressSource] = useState<"manual" | "projects">(
    "projects"
  );
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { currentWorkspace } = useWorkspace();
  const [isGenerating, setIsGenerating] = useState(false);

  // Time periods
  const TIME_PERIODS = [
    { label: "Q1", value: "Q1", dates: "Jan 1 - Mar 31" },
    { label: "Q2", value: "Q2", dates: "Apr 1 - Jun 30" },
    { label: "Q3", value: "Q3", dates: "Jul 1 - Sep 30" },
    { label: "Q4", value: "Q4", dates: "Oct 1 - Dec 31" },
    { label: "H1", value: "H1", dates: "Jan 1 - Jun 30" },
    { label: "H2", value: "H2", dates: "Jul 1 - Dec 31" },
    { label: "FY", value: "FY", dates: "Jan 1 - Dec 31" },
    { label: "Custom", value: "custom", dates: "Custom dates" },
  ];

  // Fetch workspaces when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingWorkspaces(true);
      try {
        const [workspaceData, userData, projectData] = await Promise.all([
          fetchWorkspaces(),
          fetchUsers(),
          fetchProjects(),
        ]);

        setWorkspaces(workspaceData);
        setUsers(userData);
        setProjects(projectData);

        // If the current workspace is available from the context, use it
        if (currentWorkspace) {
          setSelectedWorkspace(currentWorkspace._id);
        }
        // Otherwise, if there are workspaces, select the first one by default
        else if (workspaceData.length > 0) {
          setSelectedWorkspace(workspaceData[0]._id);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load necessary data");
      } finally {
        setIsLoadingWorkspaces(false);
      }
    };

    loadData();
  }, [currentWorkspace]);

  const handleSubmit = async () => {
    if (!goalTitle.trim()) {
      setError("Please enter a goal title");
      return;
    }

    if (!selectedWorkspace) {
      setError("Please select a workspace");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Get current user ID
      // For demo purposes, we'll use the first user in the list
      const currentUserId = users.length > 0 ? users[0]._id : "";

      if (!currentUserId) {
        throw new Error("No user found to set as owner");
      }

      const goalData: CreateGoalDto = {
        title: goalTitle,
        description: goalDescription,
        ownerId: currentUserId,
        progress: 0, // Start at 0% progress
        status: "no-status",
        isPrivate: false,
        timeframe: selectedTimeframe,
        timeframeYear: selectedTimeframeYear,
        workspaceId: selectedWorkspace,
        projects: selectedProjects.length > 0 ? selectedProjects : undefined,
      };

      const newGoal = await createGoal(goalData);

      if (newGoal && newGoal._id) {
        // Redirect to the goals page
        router.push(`/insights/goals/my-goals`);
      } else {
        setError("Failed to create goal");
      }
    } catch (err) {
      console.error("Error creating goal:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create goal. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to generate a description using AI
  const generateDescription = () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setGoalDescription(
        "Achieve significant milestones in the graduation project by completing all requirements and delivering a high-quality final product."
      );
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-[#1E1E1E]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
        <Link href="/insights/goals/my-goals">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-7xl flex px-4">
          {/* Form column - reduced from 50% to 40% */}
          <div className="w-full lg:w-2/5 p-4">
            <div className="py-8 space-y-6">
              <h1 className="text-3xl font-bold text-white">New goal</h1>

              {/* Title input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="title"
                    className="text-sm font-medium text-white"
                  >
                    Title
                  </label>
                  <span className="text-red-500">*</span>
                </div>
                <Input
                  id="title"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Enter goal title"
                  className="bg-[#252525] border-[#353535] text-white"
                />
              </div>

              {/* Description textarea */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-white"
                >
                  Description
                </label>
                <div className="relative">
                  <Textarea
                    id="description"
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    placeholder="What is this goal about?"
                    className="bg-[#252525] border-[#353535] text-white min-h-[120px]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateDescription}
                    disabled={isGenerating}
                    className="absolute bottom-2 left-2 text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate</span>
                  </Button>
                </div>
              </div>

              {/* Time period selector */}
              <div className="space-y-2">
                <label
                  htmlFor="timePeriod"
                  className="text-sm font-medium text-white"
                >
                  Time period
                </label>
                <div className="relative">
                  <Select
                    value={selectedTimeframe}
                    onValueChange={(value) =>
                      setSelectedTimeframe(value as GoalTimeframe)
                    }
                  >
                    <SelectTrigger className="w-full bg-[#252525] border-[#353535] text-white">
                      <div className="flex items-center justify-between w-full">
                        <SelectValue placeholder="Select time period" />
                        <div className="text-gray-400 text-xs">
                          {selectedTimeframe === "Q2" ? "Apr 1 — Jun 30" : ""}
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#252525] border-[#353535] text-white">
                      {TIME_PERIODS.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{period.label}</span>
                            <span className="text-gray-400 text-xs ml-4">
                              {period.dates}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Progress source */}
              <div className="space-y-2">
                <label
                  htmlFor="progressSource"
                  className="text-sm font-medium text-white"
                >
                  Progress source
                </label>
                <Select
                  value={progressSource}
                  onValueChange={(value) =>
                    setProgressSource(value as "manual" | "projects")
                  }
                >
                  <SelectTrigger className="w-full bg-[#252525] border-[#353535] text-white">
                    <SelectValue>
                      <div className="flex items-center">
                        {progressSource === "projects"
                          ? "Projects"
                          : "Manual updates"}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#252525] border-[#353535] text-white">
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="manual">Manual updates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Error message */}
              {error && <div className="text-red-500 text-sm">{error}</div>}

              {/* Action buttons */}
              <div className="pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? "Creating..." : "Continue"}
                </Button>
              </div>
            </div>
          </div>

          {/* Preview column - increased from 50% to 60% */}
          <div className="hidden lg:flex lg:w-3/5 p-6 items-center justify-center">
            <div className="bg-[#1A1A1A] rounded-lg p-8 w-full max-w-xl">
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-400">Preview</h2>

                {/* Preview content */}
                <div className="bg-[#252525] rounded-xl p-6 shadow-md">
                  {/* Goal title */}
                  <div className="flex items-center text-white font-medium text-lg mb-6">
                    {goalTitle || "Title"}
                    <span className="ml-2 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </span>
                    <div className="ml-auto text-sm text-gray-400">Members</div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-10">
                    <Progress value={0} className="h-1.5 bg-[#353535]" />
                  </div>

                  {/* Connected projects section */}
                  <div className="space-y-4">
                    <div className="flex items-center text-white">
                      <ChevronDown className="h-4 w-4 mr-2" />
                      <span>Connected projects</span>
                    </div>

                    {/* Example projects */}
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center pl-6">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            index === 0
                              ? "bg-blue-400"
                              : index === 1
                              ? "bg-yellow-400"
                              : "bg-red-400"
                          }`}
                        ></div>
                        <span className="text-white">Example project</span>

                        <div className="ml-auto flex items-center">
                          <Progress
                            value={index === 0 ? 75 : index === 1 ? 40 : 90}
                            className="w-24 h-1.5 mr-2 bg-[#353535]"
                          />
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-[#404040] text-xs">
                              {index === 0 ? "KA" : index === 1 ? "JD" : "MS"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Description preview */}
                  <div className="mt-10 space-y-2">
                    <div className="text-white mb-2">Description</div>
                    <div className="h-3 bg-[#353535] rounded w-full"></div>
                    <div className="h-3 bg-[#353535] rounded w-3/4"></div>
                    <div className="h-3 bg-[#353535] rounded w-5/6"></div>
                    <div className="h-3 bg-[#353535] rounded w-2/3"></div>
                  </div>
                </div>

                {/* Time period indicator */}
                <div className="flex items-center gap-3 text-gray-400">
                  <Calendar className="h-5 w-5" />
                  <div className="flex flex-col">
                    <span className="text-white">Time period</span>
                    <span className="text-sm">
                      {selectedTimeframe} {selectedTimeframeYear}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
