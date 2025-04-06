"use client";

import React from "react";
import { Task } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListViewProps {
  tasks: Record<string, Task[]>;
  updateTask: (
    sectionId: string,
    taskId: string,
    updatedTask: Partial<Task>
  ) => void;
  deleteTask: (sectionId: string, taskId: string) => Promise<void>;
  selectedTaskId: string | null;
  setSelectedTaskId: (taskId: string | null) => void;
}

export function ListView({
  tasks,
  updateTask,
  deleteTask,
  selectedTaskId,
  setSelectedTaskId,
}: ListViewProps) {
  // Flatten tasks from all sections into a single array
  const allTasks = Object.entries(tasks).reduce<Task[]>(
    (acc, [sectionId, sectionTasks]) => {
      return [
        ...acc,
        ...sectionTasks.map((task) => ({ ...task, section: sectionId })),
      ];
    },
    []
  );

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[#353535] hover:bg-transparent">
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allTasks.map((task) => (
            <TableRow
              key={task._id}
              className={cn(
                "border-b border-[#353535] hover:bg-[#2f2d45] cursor-pointer",
                selectedTaskId === task._id && "bg-[#2f2d45]"
              )}
              onClick={() => setSelectedTaskId(task._id)}
            >
              <TableCell className="w-[40px]">
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={(checked) => {
                    updateTask(task.section, task._id, {
                      status: checked ? "completed" : "not started",
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableCell>
              <TableCell>{task.title}</TableCell>
              <TableCell className="capitalize">
                {task.section.replace(/-/g, " ")}
              </TableCell>
              <TableCell>{task.project}</TableCell>
              <TableCell>
                <Flag
                  className={cn("h-4 w-4", getPriorityColor(task.priority))}
                />
              </TableCell>
              <TableCell>
                {task.dueDate && (
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Calendar className="h-4 w-4" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.section, task._id);
                  }}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
