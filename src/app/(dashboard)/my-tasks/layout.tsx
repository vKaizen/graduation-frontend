import React from "react";
import { MyTasksTabs } from "@/components/my-tasks/MyTasksTabs";
import { TasksNav } from "@/components/my-tasks/TasksNav";
import { TaskPageHeader } from "@/components/my-tasks/TaskPageHeader";

export default function MyTasksLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-col h-full bg-black">
      <TaskPageHeader />
      <div className="border-b border-[#262626] bg-black">
        <MyTasksTabs />
      </div>
      <TasksNav />
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  );
}
