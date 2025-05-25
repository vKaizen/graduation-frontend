"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoalsLayout } from "@/components/insights/GoalsLayout";
import { GoalTableView } from "@/components/insights/GoalTableView";
import { Goal } from "@/types";
import { fetchGoals } from "@/api-service";
import { useWorkspace } from "@/contexts/workspace-context";
import { useAuth } from "@/contexts/AuthContext";

export default function MyGoalsPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { authState } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoals = async () => {
      if (!currentWorkspace || !authState.userId) return;

      console.log("My Goals - Loading goals for user:", authState.userId);
      console.log("My Goals - Current workspace:", currentWorkspace._id);

      setIsLoading(true);
      setError(null);

      try {
        // Fetch all private goals in the workspace
        // The backend will automatically filter by the current user's ID from the JWT token
        console.log("My Goals - Fetching private goals with params:", {
          workspaceId: currentWorkspace._id,
          isPrivate: true,
        });

        const fetchedGoals = await fetchGoals({
          workspaceId: currentWorkspace._id,
          isPrivate: true,
          // Do not pass userId explicitly - the backend extracts it from the JWT token
        });

        console.log("My Goals - Fetched goals:", fetchedGoals);
        console.log(
          `My Goals - Number of goals returned: ${fetchedGoals.length}`
        );

        // Set all fetched private goals directly
        setGoals(fetchedGoals);
      } catch (err) {
        console.error("Error fetching my goals:", err);
        setError("Failed to load your goals. Please try again.");
        setGoals([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGoals();
  }, [currentWorkspace, authState.userId]);

  const handleCreateGoal = () => {
    router.push("/goals/new");
  };

  const handleGoalClick = (goal: Goal) => {
    console.log("Goal clicked:", goal);
    router.push(`/insights/goals/${goal._id}`);
  };

  return (
    <GoalsLayout
      workspaceName={currentWorkspace?.name || "My workspace"}
      onCreateGoal={handleCreateGoal}
      showFilter={true}
      
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading your goals...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-gray-400 mb-4">No personal goals found</div>
          <div className="text-sm text-gray-500 max-w-md">
            Personal goals are private to you and selected members. Create your
            first personal goal to get started.
          </div>
        </div>
      ) : (
        <GoalTableView goals={goals} onGoalClick={handleGoalClick} />
      )}
    </GoalsLayout>
  );
}
