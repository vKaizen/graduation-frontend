import { useEffect, useState } from "react";
import { BaseCard } from "./BaseCard";
import { Goal } from "@/types";
import { fetchGoals } from "@/api-service";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, TimerIcon, CalendarIcon } from "lucide-react";

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
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoals = async () => {
      if (!authState.userId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch all goals where the user is a member
        const fetchedGoals = await fetchGoals({ userId: authState.userId });

        // Sort by most recently updated
        const sortedGoals = fetchedGoals.sort((a, b) => {
          return (
            new Date(b.updatedAt || b.createdAt || "").getTime() -
            new Date(a.updatedAt || a.createdAt || "").getTime()
          );
        });

        // Take the most recent 3 goals
        setGoals(sortedGoals.slice(0, 3));
      } catch (err) {
        console.error("Error fetching goals for dashboard:", err);
        setError("Failed to load goals");
      } finally {
        setIsLoading(false);
      }
    };

    loadGoals();
  }, [authState.userId]);

  const handleGoalClick = (goalId: string) => {
    router.push(`/insights/goals/${goalId}`);
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

  return (
    <BaseCard
      title="Goals"
      onRemove={onRemove}
      cardId={cardId}
      isFullWidth={isFullWidth}
      onSizeChange={onSizeChange}
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-[#a1a1a1]">Loading goals...</div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : goals.length === 0 ? (
          <div className="text-center text-[#a1a1a1] py-4">
            <p>No goals found</p>
            <button
              onClick={() => router.push("/insights/goals/my-goals")}
              className="text-[#4573D2] hover:text-[#5584E3] text-sm mt-2"
            >
              Create your first goal
            </button>
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
            <button
              onClick={() => router.push("/insights/goals/my-goals")}
              className="text-xs text-center text-[#4573D2] hover:text-[#5584E3] w-full py-1 mt-1"
            >
              View all goals →
            </button>
          </>
        )}
      </div>
    </BaseCard>
  );
}
