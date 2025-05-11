"use client";

import { Avatar } from "@/components/ui/avatar";

interface ReportingHeaderProps {
  title: string;
}

export const ReportingHeader = ({ title }: ReportingHeaderProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <Avatar className="h-12 w-12 bg-[#4573D2] mr-3">
          <span className="text-sm font-medium text-white">R</span>
        </Avatar>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
      </div>
    </div>
  );
};
