"use client";

import { useState } from "react";
import {
  ChevronRight,
  Lock,
  ExternalLink,
  Paperclip,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Goal, GoalStatus, Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGoals } from "@/contexts/GoalContext";

interface GoalRowProps {
  goal: Goal;
  onGoalClick: (goal: Goal) => void;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: (goalId: string) => void;
  depth?: number;
}

const GoalRow = ({
  goal,
  onGoalClick,
  expandable = false,
  expanded = false,
  onToggleExpand = () => {},
  depth = 0,
}: GoalRowProps) => {
  // Use the GoalContext to get the most up-to-date progress
  const { goals: contextGoals } = useGoals();

  // Get the latest progress value from context if available
  const contextGoal = contextGoals.find((g) => g._id === goal._id);
  const progress = contextGoal ? contextGoal.progress : goal.progress;

  // Status icon mapping
  const statusIcons = {
    "on-track": <CheckCircle className="h-4 w-4 text-green-500" />,
    "at-risk": <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    "off-track": <XCircle className="h-4 w-4 text-red-500" />,
    achieved: <CheckCircle className="h-4 w-4 text-blue-500" />,
    "no-status": <Clock className="h-4 w-4 text-gray-500" />,
  };

  // Format time period string
  const formatTimePeriod = () => {
    if (goal.timeframe === "custom") {
      if (goal.startDate && goal.dueDate) {
        const start = new Date(goal.startDate);
        const end = new Date(goal.dueDate);
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      }
      return "Custom";
    }

    if (goal.timeframeYear) {
      return `${goal.timeframe} ${goal.timeframeYear}`;
    }

    return goal.timeframe;
  };

  return (
    <div
      className="grid grid-cols-12 py-3 items-center hover:bg-[#1a1a1a] rounded cursor-pointer"
      style={{ paddingLeft: `${depth * 20}px` }}
    >
      <div className="col-span-6 flex items-center space-x-2">
        {expandable ? (
          <ChevronRight
            className={`h-4 w-4 text-gray-500 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(goal._id);
            }}
          />
        ) : (
          <div className="w-4"></div>
        )}

        {goal.isPrivate && <Lock className="h-4 w-4 text-gray-500" />}

        <div
          className="flex-1 flex items-center space-x-2 overflow-hidden"
          onClick={() => onGoalClick(goal)}
        >
          <span className="text-white text-ellipsis overflow-hidden">
            {goal.title}
          </span>

          {goal.children && goal.children.length > 0 && (
            <span className="text-xs text-gray-400">
              {goal.children.length} ▼
            </span>
          )}

          {goal.linkedTasks && goal.linkedTasks.length > 0 && (
            <Paperclip className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      <div className="col-span-2 text-gray-300 text-sm">
        {formatTimePeriod()}
      </div>

      <div className="col-span-2">
        <div className="flex items-center space-x-2">
          <Progress value={progress} className="w-24 h-1.5" />
          <span className="text-sm text-gray-300">{progress}%</span>
        </div>
        <div className="text-xs text-gray-400 mt-1 flex items-center">
          {statusIcons[goal.status as GoalStatus]}
          <span className="ml-1">{goal.status.replace("-", " ")}</span>
        </div>
      </div>

      <div className="col-span-2 flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Avatar className="h-8 w-8 bg-[#4573D2]">
                <span className="text-xs font-medium text-white flex items-center justify-center h-full w-full">
                  {goal.owner ? goal.owner.fullName?.charAt(0) || "U" : "U"}
                </span>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{goal.owner?.fullName || "Unknown user"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {goal.linkedTasks && goal.linkedTasks.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="ml-2">
                <div className="text-xs text-gray-400 flex items-center">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {goal.linkedTasks.length}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {goal.linkedTasks.length} linked task
                  {goal.linkedTasks.length !== 1 ? "s" : ""}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

interface GoalTableViewProps {
  goals: Goal[];
  onGoalClick?: (goal: Goal) => void;
  linkedTasks?: Task[];
}

export const GoalTableView = ({
  goals,
  onGoalClick = () => {},
  linkedTasks,
}: GoalTableViewProps) => {
  const [expandedGoals, setExpandedGoals] = useState<string[]>([]);

  // Use the GoalContext to access the most up-to-date goals
  const { goals: contextGoals } = useGoals();

  // Merge the provided goals with any updates from the context
  const mergedGoals = goals.map((goal) => {
    const contextGoal = contextGoals.find((g) => g._id === goal._id);
    if (contextGoal) {
      // Return goal with updated progress from context
      return {
        ...goal,
        progress: contextGoal.progress,
      };
    }
    return goal;
  });

  const toggleExpand = (goalId: string) => {
    setExpandedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const renderGoalRows = (goalsToRender: Goal[], depth = 0) => {
    return goalsToRender.map((goal) => (
      <div key={goal._id}>
        <GoalRow
          goal={goal}
          onGoalClick={onGoalClick}
          expandable={Boolean(goal.children && goal.children.length > 0)}
          expanded={expandedGoals.includes(goal._id)}
          onToggleExpand={toggleExpand}
          depth={depth}
        />

        {/* Render children if expanded */}
        {expandedGoals.includes(goal._id) &&
          goal.children &&
          goal.children.length > 0 && (
            <div className="ml-4">
              {renderGoalRows(goal.children, depth + 1)}
            </div>
          )}
      </div>
    ));
  };

  return (
    <div className="overflow-hidden">
      {/* Table Headers */}
      <div className="grid grid-cols-12 text-sm text-gray-400 pb-2 border-b border-[#353535]">
        <div className="col-span-6">Name</div>
        <div className="col-span-2">Time period</div>
        <div className="col-span-2">Progress</div>
        <div className="col-span-2">Owner</div>
      </div>

      {/* Table Rows */}
      <div className="space-y-1 mt-2">
        {mergedGoals.length > 0 ? (
          renderGoalRows(mergedGoals)
        ) : (
          <div className="py-8 text-center text-gray-400">
            No goals found. Create your first goal to get started.
          </div>
        )}
      </div>
    </div>
  );
};
