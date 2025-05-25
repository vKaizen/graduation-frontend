"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GoalsLayout } from "@/components/insights/GoalsLayout";
import { StrategyMapView } from "@/components/insights/StrategyMapView";
import { GoalFormModal } from "@/components/insights/GoalFormModal";
import { fetchGoalHierarchy } from "@/api-service";
import { Goal, Workspace } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, LayoutDashboard, RefreshCw, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getAuthCookie } from "@/lib/cookies";
import { useWorkspace } from "@/contexts/workspace-context";

export default function StrategyMapPage() {
  const [rootGoal, setRootGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("My workspace");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>(undefined);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { currentWorkspace } = useWorkspace();
  const searchParams = useSearchParams();
  const highlightGoalId = searchParams.get("highlight");
  const { toast } = useToast();

  console.log("Strategy map component initialized");

  useEffect(() => {
    const authToken = getAuthCookie();
    console.log("Auth token exists:", !!authToken);
    setIsAuthenticated(!!authToken);
  }, []);

  useEffect(() => {
    console.log(
      "Initial useEffect running, fetchAttempted:",
      fetchAttempted,
      "isAuthenticated:",
      isAuthenticated
    );
    if (!fetchAttempted && isAuthenticated) {
      console.log("First render and authenticated, triggering fetch");
      setFetchAttempted(true);
      fetchGoals();
    }
  }, [fetchAttempted, isAuthenticated]);

  const fetchGoals = async () => {
    console.log("fetchGoals function called");
    try {
      setLoading(true);
      setError(null);
      console.log("About to call fetchGoalHierarchy API");

      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 15000)
      );

      // Create options object for the API call
      const options: { isPrivate: boolean; workspaceId?: string } = {
        isPrivate: false, // Only show workspace goals in the strategy map
      };

      // Add workspaceId filter if we have a currentWorkspace
      if (currentWorkspace?._id) {
        options.workspaceId = currentWorkspace._id;
      }

      // Only show non-private (workspace) goals in the strategy map
      const dataPromise = fetchGoalHierarchy(options);

      // Race between the actual fetch and the timeout
      const data = (await Promise.race([
        dataPromise,
        timeoutPromise,
      ])) as Goal[];

      console.log("Received goal hierarchy:", data);
      console.log(
        "Received goal data structure:",
        Array.isArray(data) ? `Array with ${data.length} items` : typeof data
      );

      if (data.length > 0) {
        console.log("First goal details:", {
          id: data[0]._id,
          title: data[0].title,
          hasWorkspace: !!data[0].workspace,
          workspaceName: data[0].workspace?.name,
        });
      }

      // Check if data is an array (even empty)
      if (Array.isArray(data)) {
        if (data.length > 0) {
          // Create a synthetic root node with all goals as direct children
          // This represents the workspace at the top and all goals below it
          const rootNode: Goal = {
            _id: "workspace-root",
            title: "Workspace Root",
            description: "All workspace goals",
            progress: 0,
            status: "no-status",
            isPrivate: false,
            timeframe: "custom",
            ownerId: "system",
            // All goals will be direct children of the workspace
            children: data,
            workspace:
              data[0].workspace ||
              ({
                name: currentWorkspace?.name || "My Workspace",
                _id: currentWorkspace?._id || "workspace-id",
                owner: "system", // Set a placeholder owner ID
                members: [], // Empty members array
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as Workspace),
          };

          console.log(
            "Setting root goal with all goals as direct children:",
            rootNode.children?.length
          );

          setRootGoal(rootNode);

          if (data[0].workspace?.name) {
            setWorkspaceName(data[0].workspace.name);
          } else if (currentWorkspace?.name) {
            setWorkspaceName(currentWorkspace.name);
          }
        } else {
          // Empty array means no goals found
          setRootGoal(null);

          // Set workspace name from context if available
          if (currentWorkspace?.name) {
            setWorkspaceName(currentWorkspace.name);
          }
        }
      } else {
        // Invalid response format
        setError("Invalid response format from server");
        console.error("Invalid data format:", data);
        toast({
          title: "Error",
          description: "Received invalid data format from server.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to fetch goals:", err);
      setError("Failed to load goals hierarchy. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to load goals. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = () => {
    console.log("Edit goal:");
    // Set initial values for a new workspace goal
    setSelectedGoal({
      _id: "", // Will be filled by the backend
      title: "",
      description: "",
      progress: 0,
      ownerId: "", // Will be filled by the form
      status: "no-status",
      isPrivate: false, // Default to workspace goal for strategy map
      timeframe: "Q2",
      workspaceId: currentWorkspace?._id,
    } as Goal);
    setIsModalOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    console.log("Edit goal:", goal);
    // Ensure we're preserving the correct visibility setting
    // Strategy map only shows workspace goals, so we need to make sure
    // isPrivate is set to false when editing from the strategy map
    if (goal && goal.isPrivate === undefined) {
      goal.isPrivate = false; // Strategy map only shows workspace goals
    }
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  const handleModalSuccess = async () => {
    try {
      await fetchGoals();
      toast({
        title: "Success",
        description: "Goal was saved successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to refresh goals:", error);
      toast({
        title: "Warning",
        description:
          "Goal was saved but the display couldn't refresh automatically.",
        variant: "default",
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64 text-gray-400">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#4573D2] mb-4"></div>
            <p>Loading strategy map...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchGoals}
                className="mr-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Try Again
              </Button>
              <Button variant="outline" size="sm" onClick={handleCreateGoal}>
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Create New Goal
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <div className="mb-4 flex justify-end items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Manual refresh clicked");
              fetchGoals();
            }}
            className="mr-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Map
          </Button>
          
        </div>
        {rootGoal ? (
          <StrategyMapView
            initialRootGoal={rootGoal}
            highlightGoalId={highlightGoalId || undefined}
            onEditGoal={handleEditGoal}
            onCreateGoal={handleCreateGoal}
          />
        ) : (
          <div className="text-center py-10 rounded-lg border border-[#353535] bg-[#1a1a1a] p-6">
            <h3 className="text-lg font-medium text-gray-300 mb-4">
              No workspace goals found
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first workspace goal to start building your strategy
              map.
              <br />
              <span className="text-sm mt-2 block">
                Only workspace goals appear on the strategy map.
              </span>
            </p>
            <Button onClick={handleCreateGoal} className="bg-[#4573D2]">
              <Plus className="h-4 w-4 mr-1" />
              Create Workspace Goal
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <GoalsLayout
        workspaceName={workspaceName}
        onCreateGoal={handleCreateGoal}
        showTimePeriodFilter={false}
        activeTab="strategy-map"
      >
        {renderContent()}
      </GoalsLayout>

      <GoalFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        goal={selectedGoal}
        defaultIsPrivate={false} // Default to workspace goals for strategy map
      />
    </>
  );
}
