"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  DraggableProvided,
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
import type { Project, Task, User } from "@/types";
import { TaskDetails } from "./task-details";
import type { TaskDetails as TaskDetailsType } from "@/types";
import { format } from "date-fns";
import { SortConfig } from "./sort-menu";
import { fetchProjectMembers } from "@/api-service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MuiDatePickerComponent } from "@/components/ui/mui-date-picker";
import { getInitials } from "@/lib/user-utils";
import { getAuthCookie } from "@/lib/cookies";
import { jwtDecode } from "jwt-decode";
import { useRBAC } from "@/hooks/useRBAC";

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
  activeSort?: SortConfig | null;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteSection,
  deleteTask,
  activeSort = null,
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
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Check if user has permissions to edit tasks
  const { checkPermission } = useRBAC();
  const canEditTasks = checkPermission("edit", "task", { project });

  // Fetch project members when the component mounts
  useEffect(() => {
    if (project) {
      const loadProjectMembers = async () => {
        setLoadingMembers(true);
        try {
          const members = await fetchProjectMembers(project._id);
          setProjectMembers(members);
        } catch (error) {
          console.error("Failed to load project members:", error);
        } finally {
          setLoadingMembers(false);
        }
      };

      loadProjectMembers();
    }
  }, [project]);

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
        assignee: taskData.assignee === "unassigned" ? null : taskData.assignee,
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

  const handleUpdateTask = (
    taskId: string,
    updates: Partial<TaskDetailsType>
  ) => {
    // Find which section contains this task
    let taskSectionId: string | null = null;
    let foundTask: Task | null = null;

    for (const section of project.sections) {
      const task = section.tasks.find((t) => t._id === taskId);
      if (task) {
        taskSectionId = section._id;
        foundTask = task;
        break;
      }
    }

    if (taskSectionId && foundTask) {
      // Get current user information from localStorage or JWT token
      let userId = null;
      let userName = null;

      try {
        // First try to get from localStorage
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        userId = user.userId || user._id;
        userName = user.fullName || user.email || "Unknown User";

        // If no user in localStorage, try to get from JWT token
        if (!userId) {
          const token = getAuthCookie();
          if (token) {
            const decoded: {
              sub?: string;
              userId?: string;
              fullName?: string;
              email?: string;
            } = jwtDecode(token);
            userId = decoded.sub || decoded.userId;
            userName = decoded.fullName || decoded.email || "User";
          }
        }
      } catch (error) {
        console.error("Error getting user info:", error);
        // Fallback to using task info
        userId = foundTask.createdBy || foundTask.assignee || "current-user";
        userName = "Current User";
      }

      // Extract only the properties that exist in the Task type
      const taskUpdates: Partial<Task> = {
        title: updates.title,
        assignee: updates.assignee,
        dueDate: updates.dueDate,
        priority: updates.priority,
        description: updates.description,
        subtasks: updates.subtasks,
        status: updates.status,
        completed: updates.status === "completed",
        completedAt:
          updates.status === "completed" ? new Date().toISOString() : undefined,
        // Add updater information
        updatedBy: userId || "current-user",
        updatedByName: userName || "Unknown User",
      };

      console.log("List view updating task with user info:", taskUpdates);

      // Update the task in the project
      updateTask(taskSectionId, taskId, taskUpdates);

      // Exit edit mode after updating
      setEditingTask(null);
    }

    // Update the selected task in the UI
    setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
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
        handleUpdateTask(taskId, {
          title: newTaskData[sectionId]?.title || "",
          assignee: newTaskData[sectionId]?.assignee || null,
          dueDate: newTaskData[sectionId]?.dueDate || "",
          priority: newTaskData[sectionId]?.priority || undefined,
          description: newTaskData[sectionId]?.description || "",
          subtasks: newTaskData[sectionId]?.subtasks || [],
          status: newTaskData[sectionId]?.status || "not started",
        });
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

    // Get the actual user info for the creator if possible
    const creatorId = task.createdBy || "";
    const creator = projectMembers.find((member) => member._id === creatorId);
    const creatorName = creator ? creator.fullName || creator.email : "User";

    // Get the actual user info for the updater if possible
    const updaterId = task.updatedBy || "";
    const updater = projectMembers.find((member) => member._id === updaterId);
    const updaterName = updater ? updater.fullName || updater.email : "User";

    const taskDetails: TaskDetailsType = {
      ...task,
      description: task.description || "",
      activities: [
        {
          type: "created",
          user: creatorId || "User",
          timestamp: "Yesterday at 1:28am",
          content: `Task created by ${creatorName}`,
        },
        {
          type: "updated",
          user: updaterId || "User",
          timestamp: "Yesterday at 6:29am",
          content: `${updaterName} changed priority to ${
            task.priority || "None"
          }`,
        },
      ],
      subtasks: task.subtasks || [],
      collaborators: ["User"],
      project: {
        id: project._id,
        name: project.name,
        status: sectionName,
        color: project.color,
      },
    };
    setSelectedTask(taskDetails);
  };

  const handleDeleteTask = async (sectionId: string, taskId: string) => {
    if (!canEditTasks) {
      // If user doesn't have permission, don't allow deletion
      return;
    }

    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(sectionId, taskId);
    }
  };

  const handleBulkDelete = async () => {
    if (!canEditTasks) {
      // If user doesn't have permission, don't allow bulk deletion
      return;
    }

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
      const tasks = [...section.tasks];

      // Apply sorting based on activeSort prop
      if (activeSort) {
        tasks.sort((a, b) => {
          const direction = activeSort.direction === "asc" ? 1 : -1;
          switch (activeSort.option) {
            case "title":
              return direction * a.title.localeCompare(b.title);
            case "dueDate":
              // Handle null or undefined due dates
              if (!a.dueDate && !b.dueDate) return 0;
              if (!a.dueDate) return direction;
              if (!b.dueDate) return -direction;
              return (
                direction *
                (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              );
            case "priority": {
              // Define priority order: High > Medium > Low > null
              const priorityOrder = {
                High: 3,
                Medium: 2,
                Low: 1,
                null: 0,
                undefined: 0,
              };
              const aPriority = a.priority ? priorityOrder[a.priority] : 0;
              const bPriority = b.priority ? priorityOrder[b.priority] : 0;
              return direction * (aPriority - bPriority);
            }
            case "assignee":
              // Handle null assignees
              if (!a.assignee && !b.assignee) return 0;
              if (!a.assignee) return direction;
              if (!b.assignee) return -direction;
              return direction * a.assignee.localeCompare(b.assignee);
            default:
              return 0;
          }
        });
      } else {
        // If no activeSort is provided, sort by order property
        tasks.sort((a, b) => {
          // Default to order by task order if available
          if (typeof a.order === "number" && typeof b.order === "number") {
            return a.order - b.order;
          }
          // Fallback to default sort if order is missing
          return 0;
        });
      }

      return { ...section, tasks };
    });
  }, [project.sections, activeSort]);

  const getAssigneeName = (assigneeId: string | null): string => {
    if (!assigneeId) return "Unassigned";

    // Find the member with this ID
    const member = projectMembers.find((member) => member._id === assigneeId);
    return member ? member.fullName || member.email : assigneeId;
  };

  const renderTaskRow = (
    task: Task,
    section: Project["sections"][0],
    isEditing: boolean,
    provided: DraggableProvided
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
              value={newTaskData[section._id]?.assignee || "unassigned"}
              onValueChange={(value) =>
                setNewTaskData((prev) => ({
                  ...prev,
                  [section._id]: {
                    ...prev[section._id],
                    assignee: value,
                  },
                }))
              }
            >
              <SelectTrigger className="h-9 bg-[#353535] border-0 text-white">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                {loadingMembers ? (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                    Loading members...
                  </SelectItem>
                ) : (
                  <>
                    {projectMembers.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.fullName || member.email}
                      </SelectItem>
                    ))}
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </td>
          <td className="p-2 pl-4 border-b border-[#353535] w-1/6">
            <MuiDatePickerComponent
              date={
                newTaskData[section._id]?.dueDate
                  ? new Date(newTaskData[section._id].dueDate)
                  : null
              }
              onDateChange={(date) =>
                setNewTaskData((prev) => ({
                  ...prev,
                  [section._id]: {
                    ...prev[section._id],
                    dueDate: date ? date.toISOString().split("T")[0] : "",
                  },
                }))
              }
              className="h-9"
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
                size="sm"
                className="h-9 px-3 bg-[#454545] text-white hover:bg-[#555555]"
                onClick={() => {
                  handleUpdateTask(task._id, {
                    title: newTaskData[section._id]?.title || "",
                    assignee: newTaskData[section._id]?.assignee || null,
                    dueDate: newTaskData[section._id]?.dueDate || "",
                    priority: newTaskData[section._id]?.priority || undefined,
                    description: newTaskData[section._id]?.description || "",
                    subtasks: newTaskData[section._id]?.subtasks || [],
                    status: newTaskData[section._id]?.status || "not started",
                  });
                  // This is redundant since handleUpdateTask now sets editingTask to null,
                  // but adding it here for clarity and as a safeguard
                  setEditingTask(null);
                }}
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
          "group cursor-pointer transition-colors duration-150",
          "hover:bg-[#292929]",
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
                  : "text-neutral-300 group-hover:text-neutral-100"
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
            <span className="text-sm text-neutral-400 capitalize group-hover:text-neutral-300">
              {task.status}
            </span>
          </div>
        </td>
        <td className="p-2 pl-4 border-b border-[#353535] w-1/6">
          <div className="flex items-center gap-3">
            {task.assignee && task.assignee !== "" ? (
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs bg-violet-700 text-white">
                  {getInitials(getAssigneeName(task.assignee))}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User2 className="h-4 w-4 text-neutral-500 group-hover:text-neutral-400" />
            )}
            <span className="text-sm text-neutral-400 group-hover:text-neutral-300">
              {task.assignee && task.assignee !== ""
                ? getAssigneeName(task.assignee)
                : "Unassigned"}
            </span>
          </div>
        </td>
        <td className="p-2 pl-4 border-b border-[#353535] w-1/6">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-neutral-500 group-hover:text-neutral-400" />
            <span className="text-sm text-neutral-400 group-hover:text-neutral-300">
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
                  ? "text-red-400 group-hover:text-red-300"
                  : task.priority === "Medium"
                  ? "text-yellow-400 group-hover:text-yellow-300"
                  : task.priority === "Low"
                  ? "text-green-400 group-hover:text-green-300"
                  : "text-neutral-400 group-hover:text-neutral-300"
              )}
            >
              {task.priority || "None"}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-500 opacity-70 group-hover:opacity-100 group-hover:text-white"
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
                  disabled={!canEditTasks}
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
    <div className="px-4 bg-[#121212]">
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
                disabled={isLoading || !canEditTasks}
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
          <div key={section._id} className="mb-2" data-section-id={section._id}>
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
                                value={
                                  newTaskData[section._id]?.assignee ||
                                  "unassigned"
                                }
                                onValueChange={(value) =>
                                  setNewTaskData((prev) => ({
                                    ...prev,
                                    [section._id]: {
                                      ...prev[section._id],
                                      assignee: value,
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger className="h-9 bg-[#353535] border-0 text-white">
                                  <SelectValue placeholder="Assignee" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                                  {loadingMembers ? (
                                    <SelectItem value="loading" disabled>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                                      Loading members...
                                    </SelectItem>
                                  ) : (
                                    <>
                                      {projectMembers.map((member) => (
                                        <SelectItem
                                          key={member._id}
                                          value={member._id}
                                        >
                                          {member.fullName || member.email}
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="unassigned">
                                        Unassigned
                                      </SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2 border-b border-[#353535] w-1/6">
                              <MuiDatePickerComponent
                                date={
                                  newTaskData[section._id]?.dueDate
                                    ? new Date(newTaskData[section._id].dueDate)
                                    : null
                                }
                                onDateChange={(date) =>
                                  setNewTaskData((prev) => ({
                                    ...prev,
                                    [section._id]: {
                                      ...prev[section._id],
                                      dueDate: date
                                        ? date.toISOString().split("T")[0]
                                        : "",
                                    },
                                  }))
                                }
                                className="h-9"
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
                                  size="sm"
                                  className="h-9 px-3 bg-[#454545] text-white hover:bg-[#555555]"
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
                              data-add-task
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
        {canEditTasks && (
          <button
            onClick={addSection}
            className="w-full flex items-center gap-2 px-6 py-2 text-neutral-500 hover:text-white hover:bg-[#252525] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Add section</span>
          </button>
        )}
      </div>

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => {
            setSelectedTask(null);
          }}
          onUpdate={handleUpdateTask}
          onDelete={() =>
            handleDeleteTask(selectedTask.project.id, selectedTask._id)
          }
        />
      )}
    </div>
  );
}
