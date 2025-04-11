"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  User2,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Copy,
  ArrowRight,
  Loader2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import type { Project, Task } from "@/types";
import { TaskDetails } from "./task-details";
import type { TaskDetails as TaskDetailsType } from "@/types";
import { format } from "date-fns";

interface ListViewProps {
  project: Project;
  collapsedSections: Record<string, boolean>;
  toggleSection: (sectionId: string) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (taskId: string | null) => void;
  onDragEnd: (result: DropResult) => void;
  addSection: () => void;
  updateSectionName: (sectionId: string, newName: string) => void;
  addTask: (sectionId: string, task: Omit<Task, "_id">) => void;
  updateTask: (
    sectionId: string,
    taskId: string,
    updates: Partial<Task>
  ) => void;
  deleteSection: (sectionId: string) => void;
  deleteTask: (sectionId: string, taskId: string) => Promise<void>;
}

interface NewTaskData {
  title: string;
  assignee: string | null;
  dueDate: string;
  priority: "High" | "Medium" | "Low" | undefined;
  description?: string;
  subtasks: TaskDetailsType["subtasks"];
  isCreating: boolean;
  status: Task["status"];
}

export function ListView({
  project,
  collapsedSections,
  toggleSection,
  selectedTaskId,
  setSelectedTaskId,
  onDragEnd,
  addSection,
  updateSectionName,
  addTask,
  updateTask,
  deleteSection,
  deleteTask,
}: ListViewProps) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [newTaskData, setNewTaskData] = useState<Record<string, NewTaskData>>(
    {}
  );
  const [editingTask, setEditingTask] = useState<{
    sectionId: string;
    taskId: string;
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskDetailsType | null>(
    null
  );
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTask = (sectionId: string) => {
    setNewTaskData((prev) => ({
      ...prev,
      [sectionId]: {
        title: "",
        assignee: null,
        dueDate: "",
        priority: undefined,
        description: "",
        subtasks: [],
        isCreating: true,
        status: "not started",
      },
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
      const newTask: Omit<Task, "_id"> = {
        title: taskData.title.trim(),
        assignee: taskData.assignee || null,
        dueDate: taskData.dueDate || undefined,
        priority: taskData.priority || undefined,
        description: taskData.description || "",
        subtasks: taskData.subtasks || [],
        project: project._id,
        section: sectionId,
        status: taskData.status,
        order:
          project.sections.find((s) => s._id === sectionId)?.tasks.length || 0,
      };

      addTask(sectionId, newTask);
      handleCancelCreate(sectionId);
    }
  };

  const handleEditTask = (
    sectionId: string,
    taskId: string,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    const task = project.sections
      .find((s) => s._id === sectionId)
      ?.tasks.find((t) => t._id === taskId);

    if (task) {
      setNewTaskData((prev) => ({
        ...prev,
        [sectionId]: {
          title: task.title,
          assignee: task.assignee,
          dueDate: task.dueDate || "",
          priority: task.priority,
          description: task.description || "",
          subtasks: task.subtasks || [],
          isCreating: false,
          status: task.status,
        },
      }));
      setEditingTask({ sectionId, taskId });
    }
  };

  const handleUpdateTask = (sectionId: string, taskId: string) => {
    const taskData = newTaskData[sectionId];
    if (taskData) {
      updateTask(sectionId, taskId, {
        title: taskData.title,
        assignee: taskData.assignee,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        description: taskData.description,
        subtasks: taskData.subtasks,
        status: taskData.status,
      });
      setEditingTask(null);
      handleCancelCreate(sectionId);
    }
  };

  const handleDuplicateTask = (sectionId: string, taskId: string) => {
    const task = project.sections
      .find((s) => s._id === sectionId)
      ?.tasks.find((t) => t._id === taskId);

    if (task) {
      addTask(sectionId, {
        title: `${task.title} (Copy)`,
        assignee: task.assignee,
        dueDate: task.dueDate,
        priority: task.priority,
        description: task.description,
        subtasks: task.subtasks,
        project: project._id,
        section: sectionId,
        status: task.status,
        order:
          project.sections.find((s) => s._id === sectionId)?.tasks.length || 0,
      });
    }
  };

  const handleMoveTask = (sectionId: string, taskId: string) => {
    const task = project.sections
      .find((s) => s._id === sectionId)
      ?.tasks.find((t) => t._id === taskId);

    if (task) {
      // Find all sections except the current one
      const targetSections = project.sections.filter(
        (s) => s._id !== sectionId
      );

      // Create a dropdown menu for section selection
      const sectionMenu = document.createElement("div");
      sectionMenu.className =
        "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
      sectionMenu.innerHTML = `
        <div class="bg-[#353535] rounded-lg p-4 w-80">
          <h3 class="text-white font-medium mb-4">Move to section</h3>
          <div class="space-y-2">
            ${targetSections
              .map(
                (s) => `
              <button
                class="w-full text-left px-3 py-2 rounded text-white hover:bg-[#2f2d45]"
                data-section-id="${s._id}"
              >
                ${s.title}
              </button>
            `
              )
              .join("")}
            <button
              class="w-full text-left px-3 py-2 rounded text-neutral-400 hover:bg-[#2f2d45]"
              data-cancel
            >
              Cancel
            </button>
          </div>
        </div>
      `;

      // Add click handlers
      sectionMenu.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const targetSectionId = target.dataset.sectionId;
        const isCancel = target.dataset.cancel;

        if (isCancel) {
          sectionMenu.remove();
          return;
        }

        if (targetSectionId) {
          // Move the task to the new section
          const updatedTask = { ...task, section: targetSectionId };
          updateTask(targetSectionId, taskId, updatedTask);
          sectionMenu.remove();
        }
      });

      document.body.appendChild(sectionMenu);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    sectionId: string,
    taskId?: string
  ) => {
    if (e.key === "Enter") {
      if (taskId) {
        handleUpdateTask(sectionId, taskId);
      } else {
        handleAddTask(sectionId);
      }
    } else if (e.key === "Escape") {
      if (taskId) {
        setEditingTask(null);
      }
      handleCancelCreate(sectionId);
    }
  };

  const handleTaskClick = (task: Task, sectionId: string) => {
    if (
      editingTask?.sectionId === sectionId &&
      editingTask?.taskId === task._id
    ) {
      return;
    }

    setSelectedTaskId(task._id);

    const section = project.sections.find((s) => s._id === sectionId);
    const sectionName = section ? section.title : "Unknown Section";

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
        id: project._id,
        name: project.name,
        status: sectionName,
        color: project.color,
      },
    };
    setSelectedTask(taskDetails);
  };

  const handleTaskUpdate = (
    taskId: string,
    updates: Partial<TaskDetailsType>
  ) => {
    let taskSectionId: string | null = null;

    for (const section of project.sections) {
      const taskExists = section.tasks.some((t) => t._id === taskId);
      if (taskExists) {
        taskSectionId = section._id;
        break;
      }
    }

    if (taskSectionId) {
      const taskUpdates: Partial<Task> = {
        title: updates.title,
        assignee: updates.assignee,
        dueDate: updates.dueDate,
        priority: updates.priority,
        description: updates.description,
        subtasks: updates.subtasks,
        status: updates.status,
      };

      updateTask(taskSectionId, taskId, taskUpdates);
    }

    setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleDeleteTask = async (sectionId: string, taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(sectionId, taskId);
    }
  };

  const handleBulkDelete = async () => {
    setIsLoading(true);
    try {
      await Promise.all(
        selectedTasks.map(async (taskId) => {
          const section = project.sections.find((s) =>
            s.tasks.some((t) => t._id === taskId)
          );
          if (section) {
            await deleteTask(section._id, taskId);
          }
        })
      );
      setSelectedTasks([]);
    } catch (error) {
      console.error("Failed to delete tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkMove = async (targetSectionId: string) => {
    setIsLoading(true);
    try {
      await Promise.all(
        selectedTasks.map(async (taskId) => {
          const task = project.sections
            .flatMap((s) => s.tasks)
            .find((t) => t._id === taskId);
          if (task) {
            const currentSection = project.sections.find((s) =>
              s.tasks.some((t) => t._id === taskId)
            );
            if (currentSection) {
              await updateTask(currentSection._id, taskId, {
                ...task,
                section: targetSectionId,
              });
            }
          }
        })
      );
      setSelectedTasks([]);
    } catch (error) {
      console.error("Failed to move tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const filteredAndSortedTasks = useMemo(() => {
    return project.sections.map((section) => {
      let tasks = [...section.tasks];
      return { ...section, tasks };
    });
  }, [project.sections]);

  const renderTaskRow = (
    task: Task,
    section: Project["sections"][0],
    isEditing: boolean,
    provided: any
  ) => {
    if (isEditing) {
      return (
        <tr
          ref={provided?.innerRef}
          {...provided?.draggableProps}
          {...provided?.dragHandleProps}
        >
          <td className="p-2 border-b border-[#353535] w-1/2">
            <div className="flex items-center gap-3">
              <div className="flex items-center cursor-grab">
                <GripVertical className="h-4 w-4 text-neutral-500 opacity-50" />
              </div>
              <Input
                autoFocus
                placeholder="Task name"
                value={newTaskData[section._id]?.title || ""}
                onChange={(e) =>
                  setNewTaskData((prev) => ({
                    ...prev,
                    [section._id]: {
                      ...prev[section._id],
                      title: e.target.value,
                    },
                  }))
                }
                onKeyDown={(e) => handleKeyDown(e, section._id, task._id)}
                className="bg-[#353535] border-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-white placeholder:text-neutral-500"
              />
            </div>
          </td>
          <td className="p-2 pl-4 border-b border-[#353535] w-1/6">
            <Select
              value={newTaskData[section._id]?.status || "not started"}
              onValueChange={(value) =>
                setNewTaskData((prev) => ({
                  ...prev,
                  [section._id]: {
                    ...prev[section._id],
                    status: value as Task["status"],
                  },
                }))
              }
            >
              <SelectTrigger className="h-9 bg-[#353535] border-0 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                <SelectItem value="not started">Not Started</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </td>
          <td className="p-2 pl-4 border-b border-[#353535] w-1/6">
            <Select
              value={newTaskData[section._id]?.assignee || ""}
              onValueChange={(value) =>
                setNewTaskData((prev) => ({
                  ...prev,
                  [section._id]: {
                    ...prev[section._id],
                    assignee: value || null,
                  },
                }))
              }
            >
              <SelectTrigger className="h-9 bg-[#353535] border-0 text-white">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                <SelectItem value="CX">CX</SelectItem>
                <SelectItem value="JD">JD</SelectItem>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </td>
          <td className="p-2 pl-4 border-b border-[#353535] w-1/6">
            <Input
              type="date"
              value={newTaskData[section._id]?.dueDate || ""}
              onChange={(e) =>
                setNewTaskData((prev) => ({
                  ...prev,
                  [section._id]: {
                    ...prev[section._id],
                    dueDate: e.target.value,
                  },
                }))
              }
              className="h-9 bg-[#353535] border-0 text-sm text-white placeholder:text-neutral-500"
            />
          </td>
          <td className="p-2 pl-4 border-b border-[#353535] w-1/6">
            <div className="flex items-center gap-2">
              <Select
                value={newTaskData[section._id]?.priority || "none"}
                onValueChange={(value) =>
                  setNewTaskData((prev) => ({
                    ...prev,
                    [section._id]: {
                      ...prev[section._id],
                      priority: value as Task["priority"],
                    },
                  }))
                }
              >
                <SelectTrigger className="h-9 bg-[#353535] border-0 text-white">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 hover:text-neutral-300"
                onClick={() => handleUpdateTask(section._id, task._id)}
              >
                Save
              </Button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr
        ref={provided?.innerRef}
        {...provided?.draggableProps}
        {...provided?.dragHandleProps}
        className={cn(
          "group cursor-pointer",
          selectedTaskId === task._id && "bg-[#252525]",
          selectedTasks.includes(task._id) && "bg-[#252525]"
        )}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) {
            toggleTaskSelection(task._id);
          } else {
            handleTaskClick(task, section._id);
          }
        }}
      >
        <td className="p-2 border-b border-[#353535] w-1/2">
          <div className="flex items-center gap-3">
            <div className="flex items-center cursor-grab">
              <GripVertical className="h-4 w-4 text-neutral-500 opacity-50 group-hover:opacity-100" />
            </div>
            <span
              className={cn(
                "text-sm",
                selectedTaskId === task._id
                  ? "text-neutral-200"
                  : "text-neutral-300 group-hover:text-neutral-200"
              )}
            >
              {task.title}
            </span>
          </div>
        </td>
        <td className="p-2 pl-4 border-b border-[#353535] w-1/6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                task.status === "completed"
                  ? "bg-green-500"
                  : task.status === "in progress"
                  ? "bg-yellow-500"
                  : "bg-neutral-500"
              )}
            />
            <span className="text-sm text-neutral-400 capitalize">
              {task.status}
            </span>
          </div>
        </td>
        <td className="p-2 pl-4 border-b border-[#353535] w-1/6">
          <div className="flex items-center gap-3">
            <User2 className="h-4 w-4 text-neutral-500" />
            <span className="text-sm text-neutral-400">
              {task.assignee || "Unassigned"}
            </span>
          </div>
        </td>
        <td className="p-2 pl-4 border-b border-[#353535] w-1/6">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-neutral-500" />
            <span className="text-sm text-neutral-400">
              {task.dueDate
                ? format(new Date(task.dueDate), "MMM d, yyyy")
                : "No date"}
            </span>
          </div>
        </td>
        <td className="p-2 pl-4 border-b border-[#353535] w-1/6">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-sm",
                task.priority === "High"
                  ? "text-red-400"
                  : task.priority === "Medium"
                  ? "text-yellow-400"
                  : task.priority === "Low"
                  ? "text-green-400"
                  : "text-neutral-400"
              )}
            >
              {task.priority || "None"}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-500 hover:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 bg-[#252525] border-[#353535]"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  className="text-neutral-300 focus:text-white focus:bg-[#353535]"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEditTask(section._id, task._id, e);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-neutral-300 focus:text-white focus:bg-[#353535]"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDuplicateTask(section._id, task._id);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-neutral-300 focus:text-white focus:bg-[#353535]">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Move to
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-[#252525] border-[#353535]">
                    {project.sections
                      .filter((s) => s._id !== section._id)
                      .map((s) => (
                        <DropdownMenuItem
                          key={s._id}
                          className="text-neutral-300 focus:text-white focus:bg-[#353535]"
                          onClick={() => handleMoveTask(section._id, task._id)}
                        >
                          {s.title}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-400 focus:bg-[#353535]"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteTask(section._id, task._id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          {selectedTasks.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-400">
                {selectedTasks.length} task
                {selectedTasks.length !== 1 ? "s" : ""} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isLoading}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Selected
              </Button>
              <Select onValueChange={handleBulkMove} disabled={isLoading}>
                <SelectTrigger className="w-32 bg-[#353535] border-0 text-white">
                  <SelectValue placeholder="Move to" />
                </SelectTrigger>
                <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                  {project.sections.map((section) => (
                    <SelectItem key={section._id} value={section._id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left p-2 text-sm font-medium text-neutral-400 w-1/2">
              Task name
            </th>
            <th className="text-left p-2 text-sm font-medium text-neutral-400 w-1/6">
              Status
            </th>
            <th className="text-left p-2 text-sm font-medium text-neutral-400 w-1/6">
              Assignee
            </th>
            <th className="text-left p-2 text-sm font-medium text-neutral-400 w-1/6">
              Due date
            </th>
            <th className="text-left p-2 text-sm font-medium text-neutral-400 w-1/6">
              Priority
            </th>
          </tr>
        </thead>
      </table>

      <DragDropContext onDragEnd={onDragEnd}>
        {filteredAndSortedTasks.map((section) => (
          <div key={section._id} className="mb-2">
            <div className="flex items-center gap-2 py-2 pl-2">
              <button
                onClick={() => toggleSection(section._id)}
                className="text-neutral-400 hover:text-white"
              >
                {collapsedSections[section._id] ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
              {editingSectionId === section._id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.querySelector("input");
                    if (input && input.value.trim()) {
                      updateSectionName(section._id, input.value.trim());
                    }
                    setEditingSectionId(null);
                  }}
                  className="flex-1"
                >
                  <Input
                    autoFocus
                    defaultValue={section.title}
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        updateSectionName(section._id, e.target.value.trim());
                      }
                      setEditingSectionId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (e.currentTarget.value.trim()) {
                          updateSectionName(
                            section._id,
                            e.currentTarget.value.trim()
                          );
                        }
                        setEditingSectionId(null);
                      }
                      if (e.key === "Escape") {
                        setEditingSectionId(null);
                      }
                    }}
                    className="h-7 w-48 bg-[#353535] border-0 text-white focus-visible:ring-1 focus-visible:ring-neutral-500"
                  />
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingSectionId(section._id)}
                    className="text-neutral-300 hover:text-white font-medium"
                  >
                    {section.title}
                  </button>
                  <span className="text-sm text-neutral-500">
                    {section.tasks.length}
                  </span>
                </div>
              )}
            </div>

            {!collapsedSections[section._id] && (
              <Droppable droppableId={section._id}>
                {(provided) => (
                  <div>
                    <div className="h-[1px] bg-[#353535] my-2 mx-8"></div>
                    <table
                      className="w-full border-separate border-spacing-0"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      <tbody>
                        {section.tasks.map((task, index) => (
                          <Draggable
                            key={task._id}
                            draggableId={task._id}
                            index={index}
                          >
                            {(provided) =>
                              renderTaskRow(
                                task,
                                section,
                                editingTask?.taskId === task._id,
                                provided
                              )
                            }
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {newTaskData[section._id]?.isCreating && (
                          <tr>
                            <td className="p-2 border-b border-[#353535] w-1/2">
                              <Input
                                autoFocus
                                placeholder="Task name"
                                value={newTaskData[section._id]?.title || ""}
                                onChange={(e) =>
                                  setNewTaskData((prev) => ({
                                    ...prev,
                                    [section._id]: {
                                      ...prev[section._id],
                                      title: e.target.value,
                                    },
                                  }))
                                }
                                onKeyDown={(e) => handleKeyDown(e, section._id)}
                                className="bg-[#353535] border-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-white placeholder:text-neutral-500"
                              />
                            </td>
                            <td className="p-2 border-b border-[#353535] w-1/6">
                              <Select
                                value={
                                  newTaskData[section._id]?.status ||
                                  "not started"
                                }
                                onValueChange={(value) =>
                                  setNewTaskData((prev) => ({
                                    ...prev,
                                    [section._id]: {
                                      ...prev[section._id],
                                      status: value as Task["status"],
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger className="h-9 bg-[#353535] border-0 text-white">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                                  <SelectItem value="not started">
                                    Not Started
                                  </SelectItem>
                                  <SelectItem value="in progress">
                                    In Progress
                                  </SelectItem>
                                  <SelectItem value="completed">
                                    Completed
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2 border-b border-[#353535] w-1/6">
                              <Select
                                value={newTaskData[section._id]?.assignee || ""}
                                onValueChange={(value) =>
                                  setNewTaskData((prev) => ({
                                    ...prev,
                                    [section._id]: {
                                      ...prev[section._id],
                                      assignee: value || null,
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger className="h-9 bg-[#353535] border-0 text-white">
                                  <SelectValue placeholder="Assignee" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                                  <SelectItem value="CX">CX</SelectItem>
                                  <SelectItem value="JD">JD</SelectItem>
                                  <SelectItem value="Unassigned">
                                    Unassigned
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2 border-b border-[#353535] w-1/6">
                              <Input
                                type="date"
                                value={newTaskData[section._id]?.dueDate || ""}
                                onChange={(e) =>
                                  setNewTaskData((prev) => ({
                                    ...prev,
                                    [section._id]: {
                                      ...prev[section._id],
                                      dueDate: e.target.value,
                                    },
                                  }))
                                }
                                className="h-9 bg-[#353535] border-0 text-sm text-white placeholder:text-neutral-500"
                              />
                            </td>
                            <td className="p-2 border-b border-[#353535] w-1/6">
                              <div className="flex items-center gap-2">
                                <Select
                                  value={
                                    newTaskData[section._id]?.priority || "none"
                                  }
                                  onValueChange={(value) =>
                                    setNewTaskData((prev) => ({
                                      ...prev,
                                      [section._id]: {
                                        ...prev[section._id],
                                        priority: value as Task["priority"],
                                      },
                                    }))
                                  }
                                >
                                  <SelectTrigger className="h-9 bg-[#353535] border-0 text-white">
                                    <SelectValue placeholder="Priority" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">
                                      Medium
                                    </SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="none">None</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 px-2 hover:text-neutral-300"
                                  onClick={() => handleAddTask(section._id)}
                                >
                                  Save
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={5}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start gap-2 px-6 py-2 text-neutral-500 hover:text-white hover:bg-[#252525] transition-colors"
                              onClick={() => handleCreateTask(section._id)}
                            >
                              <Plus className="h-4 w-4" />
                              Add task
                            </Button>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </Droppable>
            )}
          </div>
        ))}
      </DragDropContext>

      <div className="mt-1 border-t border-[#252525]">
        <button
          onClick={addSection}
          className="w-full flex items-center gap-2 px-6 py-2 text-neutral-500 hover:text-white hover:bg-[#252525] transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Add section</span>
        </button>
      </div>

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => {
            setSelectedTask(null);
          }}
          onUpdate={handleTaskUpdate}
          onDelete={() =>
            handleDeleteTask(selectedTask.project.id, selectedTask._id)
          }
        />
      )}
    </div>
  );
}
