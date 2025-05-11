"use client";

import { Target, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface GoalItemProps {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: "on-track" | "at-risk" | "off-track";
  dueDate: string;
  owner: string;
  showInStrategyMap?: boolean;
}

export const GoalItem = ({
  id,
  title,
  description,
  progress,
  status,
  dueDate,
  owner,
  showInStrategyMap = true,
}: GoalItemProps) => {
  // Function to render the appropriate status icon
  const getStatusIcon = () => {
    switch (status) {
      case "on-track":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "at-risk":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "off-track":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <Target className="h-5 w-5 text-[#4573D2] mt-1" />
          <div>
            <h3 className="font-medium">{title}</h3>
            {description && (
              <p className="text-sm text-gray-400 mt-1">{description}</p>
            )}
            <p className="text-sm text-gray-400 mt-1">
              Due {new Date(dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm capitalize">{status.replace("-", " ")}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-[#353535] rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              status === "on-track"
                ? "bg-green-500"
                : status === "at-risk"
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="mt-4 flex justify-between text-sm text-gray-400">
        <span>Owner: {owner}</span>
        {showInStrategyMap && (
          <Link
            href={`/insights/goals/strategy-map?highlight=${id}`}
            className="text-[#4573D2] hover:text-[#3A62B3] hover:underline"
          >
            View in Strategy Map
          </Link>
        )}
      </div>
    </div>
  );
};
