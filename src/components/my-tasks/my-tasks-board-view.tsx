"use client";

import React, { useState, Fragment } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Task } from "@/types";
import type { TaskDetails as TaskDetailsType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  MoreHorizontal,
  User2,
  CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  GripVertical,
  ArrowRight,
  X,
  Clock,
  Calendar,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { TaskDetails } from "@/components/projects/task-details";

interface MyTasksBoardViewProps {
  tasks: Record<string, Task[]>;
  onDragEnd: (result: DropResult) => void;
  addTask: (sectionId: string, task: Omit<Task, "_id">) => void;
  updateTask?: (
    sectionId: string,
    taskId: string,
    updatedTask: Partial<Task>
  ) => void;
  deleteTask?: (sectionId: string, taskId: string) => Promise<void>;
}

const SECTION_TITLES: Record<string, string> = {
  "recently-assigned": "Recently Assigned",
  today: "Today",
  upcoming: "Upcoming",
  later: "Later",
};

export function MyTasksBoardView({
  tasks,
  onDragEnd,
  addTask,
  updateTask,
  deleteTask,
}: MyTasksBoardViewProps) {
  const [newTaskData, setNewTaskData] = useState<
    Record<
      string,
      {
        title: string;
        assignee: string | null;
        dueDate: string;
        priority?: string;
        isCreating: boolean;
      }
    >
  >({});
  const [editingTask, setEditingTask] = useState<{
    sectionId: string;
    taskId: string;
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskDetailsType | null>(
    null
  );
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});

  const handleCreateTask = (sectionId: string) => {
    setNewTaskData((prev) => ({
      ...prev,
      [sectionId]: { title: "", assignee: null, dueDate: "", isCreating: true },
    }));
  };

  const handleCancelCreate = (sectionId: string) => {
    setNewTaskData((prev) => {
      const newData = { ...prev };
      delete newData[sectionId];
      return newData;
    });
  };

  const handleAddTask = (sectionId: string) => {
    const taskData = newTaskData[sectionId];
    if (taskData && taskData.title.trim()) {
      addTask(sectionId, {
        title: taskData.title,
        assignee: taskData.assignee,
        status: "not started",
        order: tasks[sectionId]?.length || 0,
        section: sectionId,
        project: "personal", // For tasks without a specific project
        dueDate: taskData.dueDate,
        priority: taskData.priority,
      });
      handleCancelCreate(sectionId);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    sectionId: string
  ) => {
    if (e.key === "Enter") {
      handleAddTask(sectionId);
    } else if (e.key === "Escape") {
      handleCancelCreate(sectionId);
    }
  };

  // Helper function to determine task priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "High":
        return "bg-red-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-black";
      case "Low":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Format date string to display in a user-friendly way
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleEditTask = (
    sectionId: string,
    taskId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingTask({ sectionId, taskId });
  };

  const handleTaskUpdate = (
    taskId: string,
    updates: Partial<TaskDetailsType>
  ) => {
    let taskSectionId: string | null = null;

    // Find which section contains the task
    for (const [sectionId, sectionTasks] of Object.entries(tasks)) {
      const taskExists = sectionTasks.some((t) => t._id === taskId);
      if (taskExists) {
        taskSectionId = sectionId;
        break;
      }
    }

    if (taskSectionId && updateTask) {
      const taskUpdates: Partial<Task> = {
        title: updates.title,
        assignee: updates.assignee,
        dueDate: updates.dueDate,
        priority: updates.priority,
        description: updates.description,
        subtasks: updates.subtasks,
      };

      updateTask(taskSectionId, taskId, taskUpdates);
    }

    setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleDeleteTask = async (sectionId: string, taskId: string) => {
    if (deleteTask && confirm("Are you sure you want to delete this task?")) {
      await deleteTask(sectionId, taskId);
    }
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleTaskClick = (task: Task, sectionId: string) => {
    if (
      editingTask?.sectionId === sectionId &&
      editingTask?.taskId === task._id
    ) {
      return;
    }

    const section = SECTION_TITLES[sectionId];
    const taskDetails: TaskDetailsType = {
      ...task,
      description: task.description || "",
      activities: [
        {
          type: "created",
          user: "Ka",
          timestamp: "Yesterday at 1:28am",
        },
        {
          type: "updated",
          user: "Ka",
          timestamp: "Yesterday at 6:29am",
          content: "Changed priority to " + (task.priority || "None"),
        },
      ],
      subtasks: task.subtasks || [],
      collaborators: ["Ka", "JD"],
      project: {
        id: "personal",
        name: "My Tasks",
        status: section,
        color: "#353535",
      },
    };
    setSelectedTask(taskDetails);
  };

  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
  };

  const handleStatusChange = (status: string) => {
    if (selectedTask && updateTask) {
      updateTask(selectedTask.sectionId, selectedTask._id, { status });
    }
  };

  const handlePriorityChange = (priority: string) => {
    if (selectedTask && updateTask) {
      updateTask(selectedTask.sectionId, selectedTask._id, { priority });
    }
  };

  const handleAssigneeChange = (assignee: string) => {
    if (selectedTask && updateTask) {
      updateTask(selectedTask.sectionId, selectedTask._id, {
        assignee: assignee === "unassigned" ? null : assignee,
      });
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6">
        {Object.entries(SECTION_TITLES).map(([sectionId, title]) => (
          <div key={sectionId} className="flex-1 w-80 shrink-0">
            <div className="flex items-center justify-between gap-2 py-2 group">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSection(sectionId)}
                  className="text-neutral-500 hover:text-neutral-400"
                >
                  {collapsedSections[sectionId] ? (
                    <ChevronRight className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                <h3 className="font-medium text-white">{title}</h3>
                <span className="text-sm text-neutral-500">
                  {tasks[sectionId]?.length || 0}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-400 h-6 px-1 hover:text-neutral-300 hover:bg-neutral-800"
                onClick={() => handleCreateTask(sectionId)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {!collapsedSections[sectionId] && (
              <Droppable droppableId={sectionId}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "space-y-2",
                      snapshot.isDraggingOver &&
                        "bg-[#353535]/30 rounded-lg p-2 -m-2"
                    )}
                  >
                    {tasks[sectionId]?.map((task, index) => (
                      <Draggable
                        key={task._id}
                        draggableId={task._id}
                        index={index}
                        isDragDisabled={
                          editingTask?.sectionId === sectionId &&
                          editingTask?.taskId === task._id
                        }
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "p-3 rounded-lg cursor-pointer group transition-colors bg-[#1a1a1a] border border-transparent hover:border-[#353535]",
                              snapshot.isDragging &&
                                "shadow-lg ring-1 ring-[#353535]"
                            )}
                            onClick={() => handleTaskClick(task, sectionId)}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <GripVertical className="w-4 h-4 text-neutral-500 hover:text-neutral-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={cn(
                                        "w-2 h-2 rounded-full flex-shrink-0",
                                        task.status === "completed"
                                          ? "bg-green-500"
                                          : task.status === "in progress"
                                          ? "bg-blue-500"
                                          : "bg-neutral-500"
                                      )}
                                    />
                                    <h4 className="font-medium text-white truncate">
                                      {task.title}
                                    </h4>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-neutral-400 hover:text-white"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      side="right"
                                      className="bg-[#353535] border-[#1a1a1a]"
                                    >
                                      <DropdownMenuItem
                                        className="text-white hover:bg-[#2f2d45] hover:text-white cursor-pointer"
                                        onClick={(e) =>
                                          handleEditTask(sectionId, task._id, e)
                                        }
                                      >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-white hover:bg-[#2f2d45] hover:text-white cursor-pointer"
                                        onClick={() =>
                                          handleDeleteTask(sectionId, task._id)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                  {task.priority && (
                                    <span
                                      className={cn(
                                        "text-xs px-2 py-0.5 rounded font-medium",
                                        getPriorityColor(task.priority)
                                      )}
                                    >
                                      {task.priority}
                                    </span>
                                  )}

                                  {task.dueDate && (
                                    <div className="flex items-center text-xs text-neutral-400 hover:text-neutral-300">
                                      <CalendarIcon className="h-3 w-3 mr-1" />
                                      {formatDate(task.dueDate)}
                                    </div>
                                  )}

                                  {task.assignee && (
                                    <div className="flex items-center text-xs text-neutral-400 hover:text-neutral-300">
                                      <User2 className="h-3 w-3 mr-1" />
                                      {task.assignee}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {newTaskData[sectionId]?.isCreating && (
                      <div className="p-3 rounded-lg bg-[#1a1a1a]">
                        <Input
                          autoFocus
                          value={newTaskData[sectionId]?.title || ""}
                          onChange={(e) =>
                            setNewTaskData((prev) => ({
                              ...prev,
                              [sectionId]: {
                                ...prev[sectionId],
                                title: e.target.value,
                              },
                            }))
                          }
                          onKeyDown={(e) => handleKeyDown(e, sectionId)}
                          placeholder="Task name"
                          className="mb-2 bg-transparent border-none focus:ring-1 focus:ring-neutral-500"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <Select
                            value={
                              newTaskData[sectionId]?.assignee || "unassigned"
                            }
                            onValueChange={(value) =>
                              setNewTaskData((prev) => ({
                                ...prev,
                                [sectionId]: {
                                  ...prev[sectionId],
                                  assignee:
                                    value === "unassigned" ? null : value,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="border-0 p-0 h-auto bg-transparent w-full">
                              <span className="text-xs truncate text-white">
                                {newTaskData[sectionId]?.assignee || "Assign"}
                              </span>
                            </SelectTrigger>
                            <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                              <SelectItem
                                value="CX"
                                className="text-white hover:bg-[#2f2d45] hover:text-white"
                              >
                                CX
                              </SelectItem>
                              <SelectItem
                                value="JD"
                                className="text-white hover:bg-[#2f2d45] hover:text-white"
                              >
                                JD
                              </SelectItem>
                              <SelectItem
                                value="unassigned"
                                className="text-white hover:bg-[#2f2d45] hover:text-white"
                              >
                                Unassigned
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={newTaskData[sectionId]?.priority || ""}
                            onValueChange={(value) =>
                              setNewTaskData((prev) => ({
                                ...prev,
                                [sectionId]: {
                                  ...prev[sectionId],
                                  priority: value,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="border-0 p-0 h-auto bg-transparent w-full">
                              <span className="text-xs truncate text-white">
                                {newTaskData[sectionId]?.priority || "Priority"}
                              </span>
                            </SelectTrigger>
                            <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                              <SelectItem
                                value="High"
                                className="text-white hover:bg-[#2f2d45] hover:text-white"
                              >
                                High
                              </SelectItem>
                              <SelectItem
                                value="Medium"
                                className="text-white hover:bg-[#2f2d45] hover:text-white"
                              >
                                Medium
                              </SelectItem>
                              <SelectItem
                                value="Low"
                                className="text-white hover:bg-[#2f2d45] hover:text-white"
                              >
                                Low
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="flex items-center gap-2 ml-auto">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-neutral-400 hover:text-neutral-300"
                              onClick={() => handleCancelCreate(sectionId)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleAddTask(sectionId)}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!newTaskData[sectionId]?.isCreating && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-neutral-500 hover:text-neutral-400 hover:bg-[#353535]"
                        onClick={() => handleCreateTask(sectionId)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add task
                      </Button>
                    )}
                  </div>
                )}
              </Droppable>
            )}
          </div>
        ))}
      </div>

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={handleCloseTaskDetails}
          onUpdate={handleTaskUpdate}
          onDelete={() =>
            deleteTask && deleteTask(selectedTask.sectionId, selectedTask._id)
          }
        />
      )}
    </DragDropContext>
  );
}
