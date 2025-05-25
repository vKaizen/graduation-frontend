"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  X,
  Plus,
  GripVertical,
  CheckSquare,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { getAuthCookie } from "@/lib/cookies";
import { jwtDecode } from "jwt-decode";

interface Task {
  _id: string;
  title: string;
  assignee: string | null;
  dueDate: string;
  priority: string;
  status: string;
  tags: string;
  subtasks: Subtask[];
  updatedBy?: string;
  updatedByName?: string;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
}

interface TaskCardProps {
  task: Task;
  sectionId: string;
  onEdit: (sectionId: string, taskId: string) => void;
  onUpdate: (
    sectionId: string,
    taskId: string,
    updatedTask: Partial<Task>
  ) => void;
  onCancel: () => void;
  isEditing: boolean;
  taskData: Partial<Task>;
  setTaskData: (data: Partial<Task>) => void;
  getAssigneeName: (assigneeId: string | null) => string;
  projectMembers: { _id: string; fullName?: string; email: string }[];
  handleKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    sectionId: string,
    taskId?: string
  ) => void;
  dragHandleProps: Record<string, unknown>;
  onDuplicate: (sectionId: string, taskId: string) => void;
  onDelete: (sectionId: string, taskId: string) => void;
  onMoveTask: (
    sectionId: string,
    taskId: string,
    targetSectionId: string
  ) => void;
  projectSections: { _id: string; title: string }[];
  onTaskClick?: (task: Task, sectionId: string) => void;
}

export function TaskCard({
  task,
  sectionId,
  onEdit,
  onUpdate,
  onCancel,
  isEditing,
  taskData,
  setTaskData,
  getAssigneeName,
  projectMembers,
  handleKeyDown,
  dragHandleProps,
  onDuplicate,
  onDelete,
  onMoveTask,
  projectSections,
  onTaskClick,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const [animationInProgress, setAnimationInProgress] = useState(false);

  // Track if we're in edit mode
  useEffect(() => {
    if (isEditing) {
      setIsExpanded(true);
    }
  }, [isEditing]);

  // Measure the card height when expanded
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      // Start animation
      setAnimationInProgress(true);

      // Get the scrollHeight (full height of content)
      const height = cardRef.current.scrollHeight;
      setCardHeight(height);

      // End animation after transition completes
      const timer = setTimeout(() => {
        setAnimationInProgress(false);
      }, 300); // Match this to the CSS transition duration

      return () => clearTimeout(timer);
    } else {
      setCardHeight(null);
    }
  }, [isExpanded, taskData]);

  // Add this to the useEffect that handles expanded state
  useEffect(() => {
    // When task status changes, make sure the UI updates
    // This will refresh the component when the task object changes
    if (cardRef.current && task) {
      const height = cardRef.current.scrollHeight;
      if (isExpanded) {
        setCardHeight(height);
      }
    }
  }, [task, isExpanded]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      setIsExpanded(!isExpanded);
      if (!isExpanded) {
        onEdit(sectionId, task._id);
      }
    }
  };

  const handleSave = () => {
    // Get current user information from JWT token instead of localStorage
    let updatedBy = "";
    let updatedByName = "Unknown User";

    try {
      const token = getAuthCookie();
      if (token) {
        const decoded: {
          sub?: string;
          id?: string;
          userId?: string;
          username?: string;
          name?: string;
          fullName?: string;
          email?: string;
        } = jwtDecode(token);

        // Extract current user ID from token
        updatedBy = decoded.sub || decoded.id || decoded.userId || "";
        // Extract name from token
        updatedByName =
          decoded.fullName ||
          decoded.name ||
          decoded.email ||
          decoded.username ||
          "Unknown User";
      }
    } catch (error) {
      console.error("Error extracting user info from token:", error);
    }

    // Create the update payload
    const updatedTask = {
      title: taskData.title || task.title,
      assignee: taskData.assignee || task.assignee,
      dueDate: taskData.dueDate || task.dueDate,
      priority: taskData.priority || task.priority,
      status: taskData.status || task.status,
      tags: taskData.tags || task.tags,
      // Add updater information using JWT data
      updatedBy,
      updatedByName,
    };

    console.log("🔍 [TaskCard] Save button clicked. Sending update:", {
      sectionId,
      taskId: task._id,
      updatedTask,
    });

    // Call the update function
    onUpdate(sectionId, task._id, updatedTask);

    // Close the expanded view
    setIsExpanded(false);
    onCancel();
  };

  const handleCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onCancel();
    setIsExpanded(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only handle click if not clicking on a button or dropdown
    if (
      !(e.target as HTMLElement).closest("button") &&
      !(e.target as HTMLElement).closest('[role="menu"]') &&
      !(e.target as HTMLElement).closest('[data-state="open"]')
    ) {
      // Open the side menu instead of expanding the card
      if (onTaskClick) {
        onTaskClick(task, sectionId);
      }
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "p-3 mb-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out bg-[#1a1a1a] border border-transparent hover:border-[#353535] shadow-sm hover:shadow-md relative overflow-hidden",
        isExpanded ? "ring-1 ring-[#353535]" : "",
        isEditing ? "cursor-default" : "",
        animationInProgress ? "overflow-hidden" : ""
      )}
      style={{
        height: isExpanded ? (cardHeight ? `${cardHeight}px` : "auto") : "",
        minHeight: "90px",
        transition:
          "height 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 150ms ease",
      }}
      onClick={handleCardClick}
    >
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Input
              autoFocus
              placeholder="Task name"
              value={taskData.title || ""}
              onChange={(e) =>
                setTaskData({ ...taskData, title: e.target.value })
              }
              onKeyDown={(e) => handleKeyDown(e, sectionId, task._id)}
              className="bg-[#353535] border-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-white placeholder:text-neutral-400"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 ml-2 text-neutral-400 hover:text-neutral-300"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs text-neutral-400 mb-1 block">
                Priority
              </label>
              <Select
                value={taskData.priority || "none"}
                onValueChange={(value) =>
                  setTaskData({ ...taskData, priority: value })
                }
              >
                <SelectTrigger className="bg-[#353535] border-0 text-white h-8">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                  <SelectItem
                    value="High"
                    className="text-white hover:bg-[#2f2d45]"
                  >
                    High
                  </SelectItem>
                  <SelectItem
                    value="Medium"
                    className="text-white hover:bg-[#2f2d45]"
                  >
                    Medium
                  </SelectItem>
                  <SelectItem
                    value="Low"
                    className="text-white hover:bg-[#2f2d45]"
                  >
                    Low
                  </SelectItem>
                  <SelectItem
                    value="none"
                    className="text-white hover:bg-[#2f2d45]"
                  >
                    None
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <label className="text-xs text-neutral-400 mb-1 block">
                Status
              </label>
              <Select
                value={taskData.status || "not started"}
                onValueChange={(value) =>
                  setTaskData({ ...taskData, status: value })
                }
              >
                <SelectTrigger className="bg-[#353535] border-0 text-white h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                  <SelectItem
                    value="not started"
                    className="text-white hover:bg-[#2f2d45]"
                  >
                    Not started
                  </SelectItem>
                  <SelectItem
                    value="in progress"
                    className="text-white hover:bg-[#2f2d45]"
                  >
                    In progress
                  </SelectItem>
                  <SelectItem
                    value="on track"
                    className="text-white hover:bg-[#2f2d45]"
                  >
                    On track
                  </SelectItem>
                  <SelectItem
                    value="at risk"
                    className="text-white hover:bg-[#2f2d45]"
                  >
                    At risk
                  </SelectItem>
                  <SelectItem
                    value="completed"
                    className="text-white hover:bg-[#2f2d45]"
                  >
                    Completed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1">
              <label className="text-xs text-neutral-400 mb-1 block">
                Assignee
              </label>
              <Select
                value={taskData.assignee || ""}
                onValueChange={(value) =>
                  setTaskData({
                    ...taskData,
                    assignee: value === "unassigned" ? null : value,
                  })
                }
              >
                <SelectTrigger className="bg-[#353535] border-0 text-white h-8">
                  <SelectValue placeholder="Assign" />
                </SelectTrigger>
                <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                  {projectMembers.map((member) => (
                    <SelectItem
                      key={member._id}
                      value={member._id}
                      className="text-white hover:bg-[#2f2d45]"
                    >
                      {member.fullName || member.email}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="unassigned"
                    className="text-white hover:bg-[#2f2d45]"
                  >
                    Unassigned
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1">
              <label className="text-xs text-neutral-400 mb-1 block">
                Due Date
              </label>
              <div className="relative bg-[#353535] rounded-md h-8 flex items-center px-3">
                <input
                  type="date"
                  value={taskData.dueDate || ""}
                  onChange={(e) =>
                    setTaskData({ ...taskData, dueDate: e.target.value })
                  }
                  className="absolute inset-0 opacity-0 cursor-pointer [color-scheme:dark] w-full"
                />
                <span className="text-sm truncate text-white">
                  {taskData.dueDate
                    ? new Date(taskData.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "Select date"}
                </span>
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs text-neutral-400 mb-1 block">
                Tags
              </label>
              <Input
                placeholder="Tags (comma separated)"
                value={taskData.tags || ""}
                onChange={(e) =>
                  setTaskData({ ...taskData, tags: e.target.value })
                }
                className="bg-[#353535] border-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-white placeholder:text-neutral-400 h-8"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="col-span-2 h-8 justify-start text-neutral-400 hover:text-neutral-300 hover:bg-[#353535]/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add field
            </Button>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="h-8">
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex items-start">
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing mr-2"
            >
              <GripVertical className="w-4 h-4 text-neutral-500 hover:text-neutral-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <p className="text-neutral-200 text-sm font-medium pr-6">
                  {task.title}
                </p>

                {/* Three-dot menu in top right corner */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-300 absolute top-2 right-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="right"
                    className="w-40 bg-[#1a1a1a] border-[#262626]"
                  >
                    <DropdownMenuItem
                      className="text-white hover:bg-[#262626] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(sectionId, task._id);
                      }}
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="8"
                          y="8"
                          width="12"
                          height="12"
                          rx="2"
                          ry="2"
                        />
                        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                      </svg>
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-white hover:bg-[#262626] cursor-pointer">
                        <svg
                          className="h-4 w-4 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14" />
                          <path d="M12 5l7 7-7 7" />
                        </svg>
                        Move to
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent
                        className="bg-[#1a1a1a] border-[#262626]"
                        alignOffset={-5}
                      >
                        {projectSections
                          .filter((s) => s._id !== sectionId)
                          .map((targetSection) => (
                            <DropdownMenuItem
                              key={targetSection._id}
                              className="text-white hover:bg-[#262626] cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveTask(
                                  sectionId,
                                  task._id,
                                  targetSection._id
                                );
                              }}
                            >
                              {targetSection.title}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem
                      className="text-white hover:bg-[#262626] cursor-pointer text-red-400 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(sectionId, task._id);
                      }}
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {/* Priority pill */}
                {task.priority && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-full font-medium",
                      task.priority === "High"
                        ? "bg-red-500/20 text-red-300"
                        : task.priority === "Medium"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-blue-500/20 text-blue-300"
                    )}
                  >
                    {task.priority}
                  </span>
                )}

                {/* Status pill - updated to show more prominently for completed tasks */}
                {task.status && task.status !== "not started" && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-full capitalize font-medium",
                      task.status === "completed"
                        ? "bg-green-500/30 text-green-300 ring-1 ring-green-500/50" // Enhanced for completed tasks
                        : task.status === "in progress" ||
                          task.status === "on track"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : task.status === "at risk"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-neutral-500/20 text-neutral-300"
                    )}
                  >
                    {task.status.replace(/-/g, " ")}
                  </span>
                )}

                {/* Tags - show if available */}
                {task.tags &&
                  typeof task.tags === "string" &&
                  task.tags.split(",").map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs rounded-full font-medium bg-teal-500/20 text-teal-300"
                    >
                      {tag.trim()}
                    </span>
                  ))}
              </div>

              <div className="flex items-center mt-2">
                {/* Assignee avatar */}
                {task.assignee && task.assignee !== "" ? (
                  <div className="h-6 w-6 rounded-full bg-rose-400 flex items-center justify-center text-white text-xs font-medium">
                    {getAssigneeName(task.assignee).substring(0, 2)}
                  </div>
                ) : null}

                {/* Due Date */}
                {task.dueDate && (
                  <span
                    className={cn(
                      "text-xs ml-2",
                      new Date(task.dueDate) < new Date()
                        ? "text-red-400"
                        : "text-neutral-400"
                    )}
                  >
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}

                {/* Subtask counter badge */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="inline-flex items-center gap-1 text-xs text-neutral-400 ml-auto">
                    <CheckSquare className="h-3.5 w-3.5 text-neutral-400" />
                    <span>{task.subtasks.length}</span>
                  </div>
                )}

                <div className="ml-auto flex items-center">
                  {/* Edit button (pencil icon) */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-neutral-400 hover:text-neutral-300"
                    onClick={toggleExpand}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
