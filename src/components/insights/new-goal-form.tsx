"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Sparkles } from "lucide-react";
import {
  createGoal,
  fetchUsers,
  fetchProjects,
  fetchWorkspaces,
  fetchWorkspaceMembers,
  fetchUserById,
} from "@/api-service";
import type {
  User,
  Project,
  Workspace,
  CreateGoalDto,
  GoalTimeframe,
} from "@/types";
import { useWorkspace } from "@/contexts/workspace-context";
import { useAuth } from "@/contexts/AuthContext";
import { GoalCreationLayout } from "./GoalCreationLayout";
import { GoalMembersForm } from "./goal-members-form";

export function NewGoalForm() {
  const router = useRouter();
  const { currentWorkspace, currentRole, hasPermission } = useWorkspace();
  const { authState } = useAuth(); // Get authenticated user from AuthContext
  const searchParams = useSearchParams();
  const goalType = searchParams.get("type"); // Get goal type from URL

  // Set default private/workspace based on URL parameter
  const defaultIsPrivate = goalType !== "workspace";

  // Debug log for authentication state
  console.log("NewGoalForm - Auth state:", {
    isAuthenticated: !!authState.accessToken,
    userId: authState.userId,
    username: authState.username,
    role: currentRole,
    goalType,
    defaultIsPrivate,
  });

  const [currentStep, setCurrentStep] = useState<"details" | "members">(
    "details"
  );
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<GoalTimeframe>("Q2");
  const [selectedTimeframeYear, setSelectedTimeframeYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [progressResource, setProgressResource] = useState<
    "projects" | "tasks" | "none"
  >("none");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(defaultIsPrivate);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasWorkspacePermission, setHasWorkspacePermission] = useState(false);

  // RBAC check - verify if user has permission to create workspace goals
  useEffect(() => {
    // Only need to check permissions for workspace goals
    if (goalType === "workspace") {
      // Check if user has owner or admin role
      const canCreateWorkspaceGoals = hasPermission(["owner", "admin"]);
      setHasWorkspacePermission(canCreateWorkspaceGoals);

      if (!canCreateWorkspaceGoals) {
        setError(
          "You don't have permission to create workspace goals. Only workspace owners and admins can create them."
        );
      } else {
        // If the goal type is workspace, force isPrivate to false
        setIsPrivate(false);
        console.log("Setting goal as workspace goal (non-private)");
      }
    } else {
      // For private goals, everyone has permission
      setHasWorkspacePermission(true);
    }
  }, [goalType, hasPermission, currentRole]);

  // Handle URL parameters on initial load
  useEffect(() => {
    // Check if URL has workspace goal parameter
    if (goalType === "workspace") {
      setIsPrivate(false);
      // Set the title prefix for debugging
      if (!goalTitle) {
        setGoalTitle("Workspace Goal: ");
      }
    }
  }, [goalType]);

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

        // Find the authenticated user in the users array
        if (authState.userId) {
          console.log(
            "Looking for authenticated user with ID:",
            authState.userId
          );
          const authenticatedUser = userData.find(
            (user) => user._id === authState.userId
          );

          if (authenticatedUser) {
            console.log("Found authenticated user:", authenticatedUser);
            setCurrentUser(authenticatedUser);
          } else {
            console.warn(
              "Authenticated user not found in users array. Will try to fetch directly."
            );
            try {
              // If not found in the users array, try to fetch the user directly
              const user = await fetchUserById(authState.userId);
              if (user) {
                console.log("Fetched authenticated user:", user);
                setCurrentUser(user);
              } else {
                console.error("Could not fetch authenticated user");
              }
            } catch (err) {
              console.error("Error fetching authenticated user:", err);
            }
          }
        } else {
          console.warn("No authenticated user ID available");
        }

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
  }, [currentWorkspace, authState.userId]);

  // Fetch workspace members when selected workspace changes
  useEffect(() => {
    const loadWorkspaceMembers = async () => {
      if (!selectedWorkspace) return;

      try {
        console.log("Fetching members for workspace:", selectedWorkspace);
        const workspaceMembers = await fetchWorkspaceMembers(selectedWorkspace);
        console.log("Fetched workspace members:", workspaceMembers);

        if (workspaceMembers.length > 0) {
          // Replace the users array with workspace members
          setUsers(workspaceMembers);
        }
      } catch (error) {
        console.error("Error fetching workspace members:", error);
      }
    };

    loadWorkspaceMembers();
  }, [selectedWorkspace]);

  // Debug the users array whenever it changes
  useEffect(() => {
    console.log("Users array updated:", users);
    console.log("Current user:", currentUser);
  }, [users, currentUser]);

  // Debug selectedMembers changes
  useEffect(() => {
    console.log("Parent component - selectedMembers updated:", selectedMembers);
  }, [selectedMembers]);

  const validateFirstStep = () => {
    if (!goalTitle.trim()) {
      setError("Please enter a goal title");
      return false;
    }

    if (!selectedWorkspace) {
      setError("Please select a workspace");
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (validateFirstStep()) {
      setError("");
      setCurrentStep("members");
    }
  };

  const handleBack = () => {
    setCurrentStep("details");
  };

  const handleSubmit = async () => {
    if (!validateFirstStep()) {
      return;
    }

    // Additional RBAC check before submission
    if (goalType === "workspace" && !hasWorkspacePermission) {
      setError(
        "You don't have permission to create workspace goals. Only workspace owners and admins can create them."
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("=== STARTING GOAL CREATION ===");
      console.log("Selected members before creation:", selectedMembers);
      console.log("Goal type:", goalType);
      console.log("Is private flag:", isPrivate);

      // Ensure isPrivate is set correctly based on goalType
      const finalIsPrivate = goalType === "workspace" ? false : isPrivate;
      if (finalIsPrivate !== isPrivate) {
        console.log(
          "Correcting isPrivate flag from",
          isPrivate,
          "to",
          finalIsPrivate
        );
      }

      // Get current user ID - prioritize the authenticated user ID from authState
      const currentUserId = authState.userId || currentUser?._id;

      if (!currentUserId) {
        throw new Error("No user found to set as owner");
      }

      console.log("Creating goal with owner ID:", currentUserId);

      // Merge owner + any selected members into one unique array
      const membersList = Array.from(
        new Set([currentUserId, ...selectedMembers])
      );
      console.log("Final members list for goal creation:", membersList);

      const goalData: CreateGoalDto = {
        title: goalTitle,
        description: goalDescription,
        ownerId: currentUserId,
        progress: 0, // Start at 0% progress
        status: "no-status",
        isPrivate: finalIsPrivate,
        timeframe: selectedTimeframe,
        timeframeYear: selectedTimeframeYear,
        workspaceId: selectedWorkspace,
        projects:
          progressResource === "projects" &&
          selectedProjects.length > 0 &&
          selectedProjects[0] !== "placeholder"
            ? selectedProjects
            : undefined,
        progressResource: progressResource,
        members: membersList, // <— always include owner + selections
      };

      console.log("Creating goal with data:", goalData);
      console.log("Progress resource:", progressResource);
      console.log("Selected members:", selectedMembers);
      console.log("Members field in goal data:", goalData.members);
      console.log("Final isPrivate value:", goalData.isPrivate);

      const newGoal = await createGoal(goalData);
      console.log("Created goal response:", newGoal);

      if (newGoal && newGoal._id) {
        // Redirect to the goals page
        router.push(
          `/insights/goals/${finalIsPrivate ? "my-goals" : "workspace-goals"}`
        );
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

  if (currentStep === "members") {
    // Use the GoalMembersForm component instead of inline implementation
    console.log("Rendering GoalMembersForm");
    console.log("All users available:", users);

    return (
      <GoalMembersForm
        onBack={handleBack}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        currentUser={currentUser}
        workspaceUsers={users}
        selectedMembers={selectedMembers}
        setSelectedMembers={setSelectedMembers}
        isPrivate={isPrivate}
        setIsPrivate={setIsPrivate}
        goalTitle={goalTitle}
        selectedTimeframe={selectedTimeframe}
        selectedTimeframeYear={selectedTimeframeYear}
        progressResource={progressResource}
        isWorkspaceGoal={goalType === "workspace"}
      />
    );
  }

  return (
    <GoalCreationLayout
      title="New goal"
      backUrl="/insights/goals/my-goals"
      goalTitle={goalTitle}
      goalDescription={goalDescription}
      selectedTimeframe={selectedTimeframe}
      selectedTimeframeYear={selectedTimeframeYear}
      selectedProjects={progressResource === "projects" ? selectedProjects : []}
      projects={projects}
      currentUser={currentUser}
      progressResource={progressResource}
    >
      {/* Title input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label htmlFor="title" className="text-sm font-medium text-white">
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
        <label htmlFor="description" className="text-sm font-medium text-white">
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
        <label htmlFor="timeframe" className="text-sm font-medium text-white">
          Time period
        </label>
        <div className="flex flex-wrap gap-3">
          <Select
            value={selectedTimeframe}
            onValueChange={(value) =>
              setSelectedTimeframe(value as GoalTimeframe)
            }
          >
            <SelectTrigger className="w-32 bg-[#252525] border-[#353535] text-white">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="bg-[#252525] border-[#353535] text-white">
              {TIME_PERIODS.map((period) => (
                <SelectItem
                  key={period.value}
                  value={period.value}
                  className="hover:bg-[#353535]"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{period.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedTimeframeYear.toString()}
            onValueChange={(value) => setSelectedTimeframeYear(parseInt(value))}
          >
            <SelectTrigger className="w-24 bg-[#252525] border-[#353535] text-white">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-[#252525] border-[#353535] text-white">
              {[2023, 2024, 2025, 2026, 2027].map((year) => (
                <SelectItem
                  key={year}
                  value={year.toString()}
                  className="hover:bg-[#353535]"
                >
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-gray-400">
          {
            TIME_PERIODS.find((period) => period.value === selectedTimeframe)
              ?.dates
          }
        </div>
      </div>

      {/* Workspace selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label htmlFor="workspace" className="text-sm font-medium text-white">
            Workspace
          </label>
          <span className="text-red-500">*</span>
        </div>
        <Select
          value={selectedWorkspace}
          onValueChange={setSelectedWorkspace}
          disabled={isLoadingWorkspaces || workspaces.length === 0}
        >
          <SelectTrigger className="w-full bg-[#252525] border-[#353535] text-white">
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>
          <SelectContent className="bg-[#252525] border-[#353535] text-white">
            {workspaces.map((workspace) => (
              <SelectItem
                key={workspace._id}
                value={workspace._id}
                className="hover:bg-[#353535]"
              >
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress source */}
      <div className="space-y-2">
        <label
          htmlFor="progress-source"
          className="text-sm font-medium text-white"
        >
          Progress source
        </label>
        <div className="space-y-2 mt-2">
          <div className="flex flex-col space-y-2">
            {/* Projects option */}
            <div
              className={`flex items-center p-3 rounded-md cursor-pointer ${
                progressResource === "projects"
                  ? "bg-[#353535]"
                  : "bg-[#252525] hover:bg-[#303030]"
              }`}
              onClick={() => {
                setProgressResource("projects");
                // If no projects are selected yet, add a placeholder to indicate projects are selected
                if (selectedProjects.length === 0) {
                  setSelectedProjects(["placeholder"]);
                }
              }}
            >
              <div className="flex items-center flex-1">
                <div
                  className={`w-4 h-4 rounded-full mr-3 border ${
                    progressResource === "projects"
                      ? "border-[#4573D2] bg-[#4573D2]"
                      : "border-gray-400"
                  }`}
                ></div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">Projects</span>
                  <span className="text-gray-400 text-xs">
                    Goal progress will be calculated from linked projects
                  </span>
                </div>
              </div>
              {progressResource === "projects" &&
                selectedProjects.length > 0 &&
                selectedProjects[0] !== "placeholder" && (
                  <div className="text-sm text-gray-400">
                    {selectedProjects.length} project
                    {selectedProjects.length !== 1 ? "s" : ""} selected
                  </div>
                )}
            </div>

            {/* Tasks option */}
            <div
              className={`flex items-center p-3 rounded-md cursor-pointer ${
                progressResource === "tasks"
                  ? "bg-[#353535]"
                  : "bg-[#252525] hover:bg-[#303030]"
              }`}
              onClick={() => {
                setProgressResource("tasks");
                // Clear project selection when selecting tasks
                setSelectedProjects([]);
              }}
            >
              <div className="flex items-center flex-1">
                <div
                  className={`w-4 h-4 rounded-full mr-3 border ${
                    progressResource === "tasks"
                      ? "border-[#4573D2] bg-[#4573D2]"
                      : "border-gray-400"
                  }`}
                ></div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">Tasks</span>
                  <span className="text-gray-400 text-xs">
                    Goal progress will be calculated from linked tasks
                  </span>
                </div>
              </div>
            </div>

            {/* None option */}
            <div
              className={`flex items-center p-3 rounded-md cursor-pointer ${
                progressResource === "none"
                  ? "bg-[#353535]"
                  : "bg-[#252525] hover:bg-[#303030]"
              }`}
              onClick={() => {
                setProgressResource("none");
                // Clear project selection when selecting none
                setSelectedProjects([]);
              }}
            >
              <div className="flex items-center flex-1">
                <div
                  className={`w-4 h-4 rounded-full mr-3 border ${
                    progressResource === "none"
                      ? "border-[#4573D2] bg-[#4573D2]"
                      : "border-gray-400"
                  }`}
                ></div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">None</span>
                  <span className="text-gray-400 text-xs">
                    Goal progress requires manual updates
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && <div className="text-red-500 text-sm">{error}</div>}

      {/* Continue button */}
      <Button
        onClick={handleContinue}
        className="w-full bg-[#4573D2] hover:bg-[#3A62B3]"
        disabled={isLoading}
      >
        Continue
      </Button>
    </GoalCreationLayout>
  );
}
