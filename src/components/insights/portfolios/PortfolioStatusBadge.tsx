import React from "react";
import { AlertTriangle, CheckCircle2, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType =
  | "on-track"
  | "at-risk"
  | "off-track"
  | "completed"
  | "no-status";

interface PortfolioStatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const PortfolioStatusBadge = ({
  status,
  size = "md",
  showIcon = true,
}: PortfolioStatusBadgeProps) => {
  // Define colors and icons based on status
  const config = {
    "on-track": {
      bgColor: "bg-green-500/10",
      textColor: "text-green-500",
      borderColor: "border-green-500/20",
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: "On Track",
    },
    "at-risk": {
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-500",
      borderColor: "border-yellow-500/20",
      icon: <AlertTriangle className="h-4 w-4" />,
      label: "At Risk",
    },
    "off-track": {
      bgColor: "bg-red-500/10",
      textColor: "text-red-500",
      borderColor: "border-red-500/20",
      icon: <AlertTriangle className="h-4 w-4" />,
      label: "Off Track",
    },
    completed: {
      bgColor: "bg-[#4573D2]/10",
      textColor: "text-[#4573D2]",
      borderColor: "border-[#4573D2]/20",
      icon: <CheckCircle className="h-4 w-4" />,
      label: "Completed",
    },
    "no-status": {
      bgColor: "bg-gray-500/10",
      textColor: "text-gray-500",
      borderColor: "border-gray-500/20",
      icon: <Clock className="h-4 w-4" />,
      label: "No Status",
    },
  };

  const { bgColor, textColor, borderColor, icon, label } = config[status];

  // Sizes
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded border",
        bgColor,
        textColor,
        borderColor,
        sizeClasses[size]
      )}
    >
      {showIcon && <span className="mr-1.5">{icon}</span>}
      <span className="font-medium">{label}</span>
    </div>
  );
};
