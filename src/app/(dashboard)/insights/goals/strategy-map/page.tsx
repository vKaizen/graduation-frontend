"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GoalsLayout } from "@/components/insights/GoalsLayout";
import { StrategyMapView } from "@/components/insights/StrategyMapView";
import { GoalFormModal } from "@/components/insights/GoalFormModal";
import { fetchGoalHierarchy } from "@/api-service";
import { Goal } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getAuthCookie } from "@/lib/cookies";

export default function StrategyMapPage() {
  const [rootGoal, setRootGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("My workspace");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>(undefined);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

      const dataPromise = fetchGoalHierarchy();

      // Race between the actual fetch and the timeout
      const data = (await Promise.race([
        dataPromise,
        timeoutPromise,
      ])) as Goal[];

      console.log("Received goal hierarchy:", data);

      // Check if data is an array (even empty)
      if (Array.isArray(data)) {
        if (data.length > 0) {
          setRootGoal(data[0]);
          if (data[0].workspace?.name) {
            setWorkspaceName(data[0].workspace.name);
          }
        } else {
          // Empty array means no goals found
          setRootGoal(null);
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
    setSelectedGoal(undefined);
    setIsModalOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
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
          Loading goals hierarchy...
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
                Try Again
              </Button>
              <Button variant="outline" size="sm" onClick={handleCreateGoal}>
                Create New Goal
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (!rootGoal) {
      return (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-300 mb-4">
            No goals found
          </h3>
          <p className="text-gray-400 mb-6">
            Create your first goal to start building your strategy map
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleCreateGoal}>Create Goal</Button>
            <Button
              variant="outline"
              onClick={() => {
                console.log("Manual refresh clicked");
                fetchGoals();
              }}
            >
              Refresh
            </Button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Manual refresh clicked");
              fetchGoals();
            }}
            className="mr-2"
          >
            Refresh Map
          </Button>
        </div>
        <StrategyMapView
          initialRootGoal={rootGoal}
          highlightGoalId={highlightGoalId || undefined}
          onEditGoal={handleEditGoal}
        />
      </>
    );
  };

  return (
    <>
      <GoalsLayout
        workspaceName={workspaceName}
        onCreateGoal={handleCreateGoal}
        showTimePeriodFilter={true}
      >
        {renderContent()}
      </GoalsLayout>

      <GoalFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        goal={selectedGoal}
      />
    </>
  );
}
