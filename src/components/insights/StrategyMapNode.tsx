"use client";

import {
  Edit,
  CheckCircle,
  Circle,
  TargetIcon,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Goal, GoalStatus } from "@/types";
import { Handle, Position } from "reactflow"; // Added import for Handle components

interface StrategyMapNodeProps {
  data: {
    _id: string;
    title: string;
    description?: string;
    progress: number;
    status?: GoalStatus;
    timeframe?: string;
    timeframeYear?: number;
    ownerName?: string;
    ownerId?: string;
    owner?: { fullName?: string };
    onEdit?: (goal: Goal) => void;
    isRoot?: boolean;
    isProject?: boolean;
    isTask?: boolean;
    isPlaceholder?: boolean;
    children?: StrategyMapNodeProps["data"][];
  };
}

// Helper function to get status indicator
const getStatusIndicator = (status: GoalStatus | undefined) => {
  switch (status) {
    case "on-track":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "at-risk":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "off-track":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "no-status":
      return <Clock className="h-4 w-4 text-gray-400" />;
    default:
      return null;
  }
};

export const StrategyMapNode = ({ data }: StrategyMapNodeProps) => {
  const router = useRouter();

  const handleNodeClick = () => {
    if (data.isRoot || data.isPlaceholder) return;
    if (data.isProject || data.isTask) return; // Don't navigate for project/task nodes
    router.push(`/insights/goals/${data._id}`);
  };

  // Placeholder node for when there are no goals
  if (data.isPlaceholder) {
    return (
      <>
        {/* Add Handle for target (top) */}
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: "#fff",
            width: 8,
            height: 8,
            opacity: 1,
            zIndex: 1000,
          }}
        />

        <div className="bg-[#272727] border border-[#454545] border-dashed rounded-lg p-4 w-[230px] h-[150px] flex flex-col items-center justify-center relative shadow-md text-center">
          <PlusCircle className="h-5 w-5 text-[#4573D2] mb-2" />
          <div className="text-sm font-medium mb-1 text-center text-gray-300">
            {data.title}
          </div>
          <div className="text-xs text-gray-500 text-center">
            {data.description}
          </div>
        </div>
      </>
    );
  }

  // Workspace root node
  if (data.isRoot) {
    return (
      <>
        {/* Add Handle for source (bottom) */}
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: "#fff",
            width: 8,
            height: 8,
            opacity: 1,
            zIndex: 1000,
          }}
        />

        <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-5 w-[260px] h-[120px] flex flex-col items-center justify-center relative shadow-lg">
          <div className="text-xl font-semibold mb-2 text-center text-white">
            {data.title}
          </div>
          <div className="bg-[#333] px-2 py-0.5 rounded text-xs text-gray-300 mt-1">
            Workspace
          </div>
        </div>
      </>
    );
  }

  // Project node
  if (data.isProject) {
    return (
      <>
        {/* Add Handle for target (top) */}
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: "#fff",
            width: 8,
            height: 8,
            opacity: 1,
            zIndex: 1000,
          }}
        />

        {/* Add Handle for source (bottom) */}
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: "#fff",
            width: 8,
            height: 8,
            opacity: 1,
            zIndex: 1000,
          }}
        />

        <div
          className="bg-[#212121] border border-[#353535] hover:border-[#4573D2] rounded-lg p-4 w-[280px] h-[180px] flex flex-col relative cursor-pointer shadow-md hover:shadow-lg transition-all duration-200"
          onClick={handleNodeClick}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-[#4573D2] px-2 py-0.5 rounded text-xs text-white">
              Project
            </div>
            {data.progress >= 100 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-gray-400" />
            )}
          </div>

          <div className="text-sm font-medium mb-3 text-white line-clamp-2">
            {data.title}
          </div>

          <div className="text-xs text-gray-400 mb-3 min-h-[2.5rem] line-clamp-2">
            {data.description || "No description"}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#353535] rounded-full mt-auto mb-3">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${data.progress}%`,
                backgroundColor:
                  data.progress >= 70
                    ? "#4caf50"
                    : data.progress >= 30
                    ? "#ff9800"
                    : "#f44336",
              }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <div>{data.progress}% complete</div>
          </div>
        </div>
      </>
    );
  }

  // Task node
  if (data.isTask) {
    return (
      <>
        {/* Add Handle for target (top) */}
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: "#fff",
            width: 8,
            height: 8,
            opacity: 1,
            zIndex: 1000,
          }}
        />

        <div
          className="bg-[#1E1E1E] border border-[#353535] hover:border-[#45D2A3] rounded-lg p-4 w-[280px] h-[180px] flex flex-col relative cursor-pointer shadow-md hover:shadow-lg transition-all duration-200"
          onClick={handleNodeClick}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-[#45D2A3] px-2 py-0.5 rounded text-xs text-white flex items-center">
              <ClipboardList className="h-3 w-3 mr-1" />
              <span>Task</span>
            </div>
            {data.progress >= 100 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-gray-400" />
            )}
          </div>

          <div className="text-sm font-medium mb-3 text-white line-clamp-2">
            {data.title}
          </div>

          <div className="text-xs text-gray-400 mb-3 min-h-[2.5rem] line-clamp-2">
            {data.description || "No description"}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#353535] rounded-full mt-auto mb-3">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${data.progress}%`,
                backgroundColor: data.progress >= 100 ? "#4caf50" : "#353535",
              }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <div>{data.progress >= 100 ? "Completed" : "Incomplete"}</div>
          </div>
        </div>
      </>
    );
  }

  // Standard goal node (with consistent height)
  return (
    <>
      {/* Add Handle for target (top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "#fff",
          width: 8,
          height: 8,
          opacity: 1,
          zIndex: 1000,
        }}
      />

      {/* Add Handle for source (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "#fff",
          width: 8,
          height: 8,
          opacity: 1,
          zIndex: 1000,
        }}
      />

      <div
        className="bg-[#1a1a1a] border border-[#333333] hover:border-[#939090] rounded-lg p-4 w-[280px] h-[180px] flex flex-col relative cursor-pointer shadow-md hover:shadow-lg transition-all duration-200"
        onClick={handleNodeClick}
      >
        {/* Goal indicator and progress */}
        <div className="flex items-center justify-between mb-2">
          <div className="bg-[#333] px-2 py-0.5 rounded text-xs text-white flex items-center">
            <TargetIcon className="h-3 w-3 mr-1" />
            <span>Goal</span>
          </div>
          <div
            className="text-xs font-medium"
            style={{
              color:
                data.progress >= 70
                  ? "#4caf50"
                  : data.progress >= 30
                  ? "#ff9800"
                  : "#f44336",
            }}
          >
            {data.progress}%
          </div>
        </div>

        {/* Title */}
        <div className="text-sm font-medium text-white mb-2 line-clamp-2">
          {data.title}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[#353535] rounded-full mb-3">
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${data.progress}%`,
              backgroundColor:
                data.progress >= 70
                  ? "#4caf50"
                  : data.progress >= 30
                  ? "#ff9800"
                  : "#f44336",
            }}
          ></div>
        </div>

        {/* Description - with min-height to ensure consistent sizing */}
        <div className="text-xs text-gray-400 mb-3 min-h-[2.5rem] line-clamp-2">
          {data.description || "No description"}
        </div>

        {/* Goal metadata - pushed to bottom with mt-auto */}
        <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
          {/* Timeframe */}
          <div className="flex items-center">
            {data.timeframe && (
              <span className="bg-[#262626] px-2 py-0.5 rounded">
                {data.timeframe} {data.timeframeYear}
              </span>
            )}
          </div>

          {/* Owner */}
          <div className="flex items-center space-x-1">
            <Avatar className="h-5 w-5 bg-[#4573D2]">
              <span className="text-[10px] font-medium text-white flex items-center justify-center h-full w-full">
                {data.ownerName ? data.ownerName.charAt(0) : "U"}
              </span>
            </Avatar>
            <span className="text-xs">{data.ownerName || "Unknown"}</span>
          </div>
        </div>

        {/* Child projects indicator - only shown if there are children */}
        {data.children && data.children.length > 0 && (
          <div className="text-xs text-[#4573D2] mt-2 flex items-center">
            <span className="mr-1">•</span>
            <span>
              {data.children.length} project
              {data.children.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </>
  );
};
