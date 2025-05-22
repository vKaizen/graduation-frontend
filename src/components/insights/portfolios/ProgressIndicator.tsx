import React from "react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  className?: string;
}

export const ProgressIndicator = ({
  progress,
  size = "md",
  showPercentage = true,
  className,
}: ProgressIndicatorProps) => {
  // Calculate progress color based on value
  const getProgressColor = (value: number) => {
    if (value >= 70) return "bg-green-500";
    if (value >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Ensure progress is within 0-100 range
  const safeProgress = Math.max(0, Math.min(100, progress));

  // Size configurations
  const heightClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-1">
        {showPercentage && (
          <span
            className={cn("font-medium text-gray-300", textSizeClasses[size])}
          >
            {safeProgress}%
          </span>
        )}
      </div>
      <div
        className={cn(
          "w-full bg-gray-700 rounded overflow-hidden",
          heightClasses[size]
        )}
      >
        <div
          className={cn(
            "transition-all duration-300",
            getProgressColor(safeProgress)
          )}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
};
