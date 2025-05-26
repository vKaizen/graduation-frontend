"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GoalsLayout } from "@/components/insights/GoalsLayout";
import { GoalTableView } from "@/components/insights/GoalTableView";
import { Goal } from "@/types";
import { fetchGoals } from "@/api-service";
import { useWorkspace } from "@/contexts/workspace-context";

export default function WorkspaceGoalsPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    const loadGoals = async () => {
      if (!currentWorkspace) return;
      if (isLoadingRef.current) return; // Prevent multiple simultaneous calls

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        // Fetch workspace (non-private) goals
        console.log(
          "Workspace Goals - Fetching goals for workspace:",
          currentWorkspace._id
        );
        const fetchedGoals = await fetchGoals({
          workspaceId: currentWorkspace._id,
          isPrivate: false,
        });

        console.log(
          `Workspace Goals - Fetched ${fetchedGoals.length} workspace goals`
        );
        setGoals(fetchedGoals);
      } catch (err) {
        console.error("Error fetching workspace goals:", err);
        setError("Failed to load workspace goals. Please try again.");
        setGoals([]);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadGoals();
  }, [currentWorkspace?._id]);

  const handleCreateGoal = () => {
    router.push("/goals/new?type=workspace");
  };

  const handleGoalClick = (goal: Goal) => {
    router.push(`/insights/goals/${goal._id}`);
  };

  return (
    <GoalsLayout
      workspaceName={currentWorkspace?.name || "My workspace"}
      onCreateGoal={handleCreateGoal}
      showFilter={true}
      filterText="Filter: Workspace goals"
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading workspace goals...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-gray-400 mb-4">No workspace goals found</div>
          <div className="text-sm text-gray-500 max-w-md">
            Workspace goals are visible to all workspace members. Create your
            first workspace goal to get started.
          </div>
        </div>
      ) : (
        <GoalTableView goals={goals} onGoalClick={handleGoalClick} />
      )}
    </GoalsLayout>
  );
}
