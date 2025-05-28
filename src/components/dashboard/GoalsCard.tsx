"use client";

import { useEffect, useState } from "react";
import { BaseCard } from "./BaseCard";
import { Goal } from "@/types";
import { fetchGoals } from "@/api-service";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/workspace-context";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  TimerIcon,
  CalendarIcon,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoals } from "@/contexts/GoalContext";

interface GoalsCardProps {
  onRemove?: () => void;
  cardId?: string;
  isFullWidth?: boolean;
  onSizeChange?: (isFullWidth: boolean) => void;
}

export function GoalsCard({
  onRemove,
  cardId = "goals-card",
  isFullWidth = false,
  onSizeChange,
}: GoalsCardProps) {
  const { authState } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();
  const [localGoals, setLocalGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use the GoalContext to get global goals state
  const { goals: contextGoals } = useGoals();

  // Merge global context goals with local goals for real-time updates
  const goals = localGoals.map((localGoal) => {
    // Find matching goal in context if it exists
    const contextGoal = contextGoals.find((g) => g._id === localGoal._id);

    // If found in context, use the progress from context for real-time updates
    if (contextGoal) {
      return {
        ...localGoal,
        progress: contextGoal.progress,
      };
    }

    // Otherwise use the local goal data
    return localGoal;
  });

  useEffect(() => {
    const loadGoals = async () => {
      if (!authState.userId || !currentWorkspace?._id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch only goals from the current workspace that the user is a member of
        const fetchedGoals = await fetchGoals({
          userId: authState.userId,
          workspaceId: currentWorkspace._id,
        });

        console.log("Fetched goals for current workspace:", fetchedGoals);

        // Sort by most recently updated
        const sortedGoals = fetchedGoals.sort((a, b) => {
          return (
            new Date(b.updatedAt || b.createdAt || "").getTime() -
            new Date(a.updatedAt || a.createdAt || "").getTime()
          );
        });

        // Take the most recent 3 goals
        setLocalGoals(sortedGoals.slice(0, 3));
      } catch (err) {
        console.error("Error fetching goals for dashboard:", err);
        setError("Failed to load goals");
      } finally {
        setIsLoading(false);
      }
    };

    loadGoals();
  }, [authState.userId, currentWorkspace]);

  const handleGoalClick = (goalId: string) => {
    router.push(`/insights/goals/${goalId}`);
  };

  const handleCreateGoal = () => {
    router.push("/insights/goals/new");
  };

  // Function to get status color and background
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "on-track":
        return {
          bg: "bg-[#1e2e1e]",
          text: "text-green-400",
          dot: "bg-green-500",
        };
      case "at-risk":
        return {
          bg: "bg-[#2e2a1e]",
          text: "text-yellow-400",
          dot: "bg-yellow-500",
        };
      case "off-track":
        return { bg: "bg-[#2e1e1e]", text: "text-red-400", dot: "bg-red-500" };
      case "achieved":
        return {
          bg: "bg-[#1e2e2e]",
          text: "text-blue-400",
          dot: "bg-blue-500",
        };
      default:
        return {
          bg: "bg-[#252525]",
          text: "text-gray-400",
          dot: "bg-gray-500",
        };
    }
  };

  // Function to determine progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-[#4573D2]";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-[#4573D2]";
  };

  // Loading state
  if (isLoading) {
    return (
      <BaseCard
        title="Goals"
        onRemove={onRemove}
        cardId={cardId}
        isFullWidth={isFullWidth}
        onSizeChange={onSizeChange}
      >
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </BaseCard>
    );
  }

  // Error state
  if (error) {
    return (
      <BaseCard
        title="Goals"
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

              if (!authState.userId || !currentWorkspace?._id) {
                setError("Missing user or workspace information");
                setIsLoading(false);
                return;
              }

              fetchGoals({
                userId: authState.userId,
                workspaceId: currentWorkspace._id,
              })
                .then((goals) => {
                  const sortedGoals = goals.sort((a, b) => {
                    return (
                      new Date(b.updatedAt || b.createdAt || "").getTime() -
                      new Date(a.updatedAt || a.createdAt || "").getTime()
                    );
                  });
                  setLocalGoals(sortedGoals.slice(0, 3));
                  setIsLoading(false);
                })
                .catch((err) => {
                  console.error("Error retrying goals fetch:", err);
                  setError("Failed to load goals");
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
    <BaseCard
      title="Goals"
      onRemove={onRemove}
      cardId={cardId}
      isFullWidth={isFullWidth}
      onSizeChange={onSizeChange}
    >
      <div className="h-full flex flex-col">
        <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
          {goals.length === 0 ? (
            <div className="text-center text-[#a1a1a1] py-4">
              <p>No goals found in this workspace</p>
            </div>
          ) : (
            <>
              {goals.map((goal) => {
                const statusStyle = getStatusStyle(goal.status);
                const progressColor = getProgressColor(goal.progress);

                return (
                  <div
                    key={goal._id}
                    className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-3 cursor-pointer hover:bg-[#252525] transition-all"
                    onClick={() => handleGoalClick(goal._id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-white truncate pr-2">
                        {goal.title}
                      </h3>
                      <div
                        className={`text-xs rounded-full px-2 py-0.5 flex items-center ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot} mr-1`}
                        ></span>
                        {goal.status === "no-status"
                          ? "No status"
                          : goal.status.replace(/-/g, " ")}
                      </div>
                    </div>

                    <div className="flex gap-1 mb-2 text-xs text-[#a1a1a1] items-center">
                      <CalendarIcon className="h-3 w-3" />
                      <span>
                        {goal.timeframe} {goal.timeframeYear}
                      </span>
                      {goal.progress === 100 && (
                        <span className="ml-auto flex items-center text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-0.5" />
                          Complete
                        </span>
                      )}
                    </div>

                    <div className="relative pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs inline-block text-[#a1a1a1]">
                          {goal.progress}% Complete
                        </div>
                      </div>
                      <div className="flex h-1.5 bg-[#353535] rounded-full overflow-hidden">
                        <div
                          className={`${progressColor} rounded-full transition-all duration-500 ease-in-out`}
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {goals.length > 0 && (
                <button
                  onClick={() => router.push("/insights/goals/my-goals")}
                  className="text-xs text-center text-[#4573D2] hover:text-[#5584E3] w-full py-1 mt-1"
                >
                  View all goals →
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </BaseCard>
  );
}
