"use client";

import type React from "react";
import { useState, useEffect, Fragment, useMemo, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Task,
  Project,
  TaskDetails as TaskDetailsType,
  User,
} from "@/types";
import type { DropResult } from "@hello-pangea/dnd";
import { fetchProjectMembers } from "@/api-service";
import type { SortConfig } from "./sort-menu";
import { TaskCard } from "./Task-card";
import { TaskDetails } from "./task-details";
import { getAuthCookie } from "@/lib/cookies";
import { jwtDecode } from "jwt-decode";
import { MuiDatePickerComponent } from "@/components/ui/mui-date-picker";
import { getInitials } from "@/lib/user-utils";
import { useRBAC } from "@/hooks/useRBAC";

interface BoardViewProps {
  project: Project;
  onDragEnd: (result: DropResult) => void;
  addTask: (sectionId: string, task: Omit<Task, "id">) => void;
  updateTask: (
    sectionId: string,
    taskId: string,
    updatedTask: Partial<Task>
  ) => void;
  addSection: () => void;
  updateSectionName: (sectionId: string, newName: string) => void;
  deleteSection: (sectionId: string) => Promise<void>;
  deleteTask: (sectionId: string, taskId: string) => Promise<void>;
  activeSort?: SortConfig | null;
}

export function BoardView({
  project,
  deleteTask,
  activeSort = null,
  ...otherProps
}: BoardViewProps) {
  console.log("BoardView received project:", project);

  // Add state for project members
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Add this near the top of the component to verify data
  useEffect(() => {
    if (project) {
      console.log(
        "BoardView received project with sections:",
        project.sections
      );

      // Fetch project members when the component mounts
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

  const {
    onDragEnd,
    addTask,
    updateTask,
    addSection,
    updateSectionName,
    deleteSection,
  } = otherProps;
  const [newTaskData, setNewTaskData] = useState<
    Record<string, Omit<Task, "id"> & { isCreating: boolean }>
  >({});
  const [editingTask, setEditingTask] = useState<{
    sectionId: string;
    taskId: string;
  } | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskDetailsType | null>(
    null
  );
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [updateCounter, setUpdateCounter] = useState(0);

  // Check if user has permissions to edit tasks
  const { checkPermission } = useRBAC();
  const canEditTasks = checkPermission("edit", "task", { project });

  const getAssigneeName = (assigneeId: string | null): string => {
    if (!assigneeId) return "Unassigned";

    const member = projectMembers.find((member) => member._id === assigneeId);
    return member ? member.fullName || member.email : assigneeId;
  };

  const handleCreateTask = (sectionId: string) => {
    setNewTaskData((prev) => ({
      ...prev,
      [sectionId]: {
        title: "",
        assignee: null,
        dueDate: "",
        priority: undefined,
        isCreating: true,
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
      addTask(sectionId, {
        title: taskData.title,
        assignee: taskData.assignee,
        dueDate: taskData.dueDate || undefined,
        priority: taskData.priority,
        order:
          project.sections.find((s) => s._id === sectionId)?.tasks.length || 0,
      });
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
          status: task.status,
          budget: task.budget,
          tags: task.tags,
          isCreating: false,
        },
      }));
      setEditingTask({ sectionId, taskId });
    }
  };

  const handleUpdateTask = useCallback(
    (sectionId: string, taskId: string, updates: Partial<Task>) => {
      console.log("🔍 [BoardView] handleUpdateTask called with:", {
        sectionId,
        taskId,
        updates,
      });

      // Check if sectionId exists before proceeding
      if (!sectionId) {
        console.error("Missing sectionId for task update:", taskId);
        return;
      }

      // Handle task status updates for completion
      let updatedSection = sectionId;
      const task = project.sections
        .find((s) => s._id === sectionId)
        ?.tasks.find((t) => t._id === taskId);

      if (task && updates.status) {
        // For task completion status changes, we need to find the appropriate section
        const completedSection = project.sections.find(
          (s) => s.title.toLowerCase() === "completed"
        );
        const todoSection = project.sections.find(
          (s) =>
            s.title.toLowerCase() === "to do" ||
            s.title.toLowerCase() === "not started"
        );

        if (updates.status === "completed" && completedSection) {
          updatedSection = completedSection._id;
        } else if (updates.status === "not started" && todoSection) {
          updatedSection = todoSection._id;
        }
      }

      // Extract updatedBy and updatedByName from the updates if they exist
      let { updatedBy, updatedByName } = updates;

      // If updatedBy and updatedByName are not provided, get them from the JWT token
      if (!updatedBy || !updatedByName) {
        try {
          // Get token from cookie
          const token = getAuthCookie();
          if (token) {
            // Decode the token to extract user information
            const decoded: any = jwtDecode(token);
            if (decoded && decoded.sub) {
              updatedBy = decoded.sub;

              // Extract the user's fullName from the token, or try other identifier fields
              // Format the name nicely if we only have an email
              if (decoded.email && !decoded.fullName && !decoded.name) {
                // If we have an email but no name, extract the name part from the email
                // e.g., "john.doe@example.com" becomes "John Doe"
                const emailName = decoded.email.split("@")[0];
                const formattedName = emailName
                  .replace(/[._-]/g, " ") // Replace dots, underscores, and hyphens with spaces
                  .split(" ")
                  .map(
                    (word: string) =>
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  )
                  .join(" ");
                updatedByName = formattedName;
              } else {
                // Use available name fields with fallbacks
                updatedByName =
                  decoded.fullName ||
                  decoded.name ||
                  decoded.username ||
                  "Unknown User";
              }
            }
          }
        } catch (error) {
          console.error("Error extracting user info from token:", error);
        }
      }

      // Extract only the properties that exist in the Task type
      const taskUpdates: Partial<Task> = {
        ...updates,
        // Add updater information if not already present
        updatedBy,
        updatedByName,
      };

      // If the task is being marked as complete, make sure status is also set
      if (taskUpdates.completed === true && !taskUpdates.status) {
        taskUpdates.status = "completed";
      }
      // If task is being marked as incomplete, update status accordingly
      else if (taskUpdates.completed === false && !taskUpdates.status) {
        taskUpdates.status = "not started";
      }

      console.log(
        "🔍 [BoardView] Updating task with complete info:",
        taskUpdates
      );

      // Update the task in the project with the potentially new section
      updateTask(updatedSection, taskId, taskUpdates);

      // Clear editing state
      setEditingTask(null);

      // Update the selected task if it's open in the task details panel
      if (selectedTask && selectedTask._id === taskId) {
        // Create a deep copy with all updates applied
        const updatedTaskDetails = {
          ...selectedTask,
          ...taskUpdates,
          // Make sure to update the status in the project object too
          project: {
            ...selectedTask.project,
            status: taskUpdates.status || selectedTask.project.status,
          },
        };

        console.log(
          "🔍 [BoardView] Updating selected task:",
          updatedTaskDetails
        );
        setSelectedTask(updatedTaskDetails);
      }

      // Force a rerender of the component to reflect UI changes immediately
      setUpdateCounter((prev) => prev + 1);

      // If we're moving the task between sections, use the drag and drop handler
      if (updatedSection !== sectionId) {
        // Find the destination index (at the end of the target section)
        const destIndex =
          project.sections.find((s) => s._id === updatedSection)?.tasks
            .length || 0;

        // Find the source index
        const sourceIndex =
          project.sections
            .find((s) => s._id === sectionId)
            ?.tasks.findIndex((t) => t._id === taskId) || 0;

        // Use the existing drag and drop handler
        onDragEnd({
          destination: {
            droppableId: updatedSection,
            index: destIndex,
          },
          source: {
            droppableId: sectionId,
            index: sourceIndex,
          },
          draggableId: taskId,
          type: "task",
          mode: "FLUID",
          reason: "DROP",
          combine: null, // Adding the required combine property
        } as DropResult);
      }
    },
    [
      project,
      selectedTask,
      updateTask,
      onDragEnd,
      setSelectedTask,
      setEditingTask,
    ]
  );

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    sectionId: string,
    taskId?: string
  ) => {
    if (e.key === "Enter") {
      if (taskId) {
        handleUpdateTask(sectionId, taskId, {
          title: selectedTask?.title || "",
          assignee: selectedTask?.assignee || null,
          dueDate: selectedTask?.dueDate || "",
          priority: selectedTask?.priority || undefined,
          status: selectedTask?.status || "not started",
          budget: selectedTask?.budget || 0,
          tags: selectedTask?.tags || [],
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

  const handleUpdateSectionName = (sectionId: string, newName: string) => {
    updateSectionName(sectionId, newName);
    setEditingSectionId(null);
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Update the handleTaskClick function to ensure task details are properly populated with the correct data
  const handleTaskClick = (task: Task, sectionId: string) => {
    // Don't open task details if we're in edit mode
    if (
      editingTask?.sectionId === sectionId &&
      editingTask?.taskId === task._id
    ) {
      return;
    }

    // Find the section this task belongs to
    const section = project.sections.find((s) => s._id === sectionId);
    const sectionName = section ? section.title : "Unknown Section";

    // Convert Task to TaskDetailsType with more detailed information
    const taskDetails: TaskDetailsType = {
      ...task,
      id: task._id,
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
      subtasks: task.subtasks || [], // Use the subtasks from the task or an empty array if undefined
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
        status: task.status,
        budget: task.budget,
        tags: task.tags,
      });
    }
  };

  const handleMoveTask = (
    sectionId: string,
    taskId: string,
    targetSectionId: string
  ) => {
    const task = project.sections
      .find((s) => s._id === sectionId)
      ?.tasks.find((t) => t._id === taskId);

    if (task) {
      // Calculate new order (append to end of target section)
      const targetSection = project.sections.find(
        (s) => s._id === targetSectionId
      );
      if (targetSection) {
        const newOrder = targetSection.tasks.length;

        // Move task using onDragEnd
        onDragEnd({
          destination: {
            droppableId: targetSectionId,
            index: newOrder,
          },
          source: {
            droppableId: sectionId,
            index:
              project.sections
                .find((s) => s._id === sectionId)
                ?.tasks.findIndex((t) => t._id === taskId) || 0,
          },
          draggableId: taskId,
          type: "task",
          mode: "FLUID",
          reason: "DROP",
        });
      }
    }
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
      let tasks = [...section.tasks];

      // Apply filters
      if (filterPriority !== "all") {
        tasks = tasks.filter((task) => task.priority === filterPriority);
      }
      if (filterStatus !== "all") {
        tasks = tasks.filter((task) => task.status === filterStatus);
      }

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
                none: 0,
                undefined: 0,
                null: 0,
              };
              const aPriority = a.priority
                ? priorityOrder[a.priority]
                : priorityOrder.none;
              const bPriority = b.priority
                ? priorityOrder[b.priority]
                : priorityOrder.none;
              return direction * (aPriority - bPriority);
            }
            case "status": {
              const statusOrder = {
                completed: 3,
                "in progress": 2,
                "not started": 1,
              };
              return (
                direction * (statusOrder[a.status] - statusOrder[b.status])
              );
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
  }, [
    project.sections,
    filterPriority,
    filterStatus,
    sortBy,
    sortDirection,
    activeSort,
  ]);

  if (!project) return <div>No project data</div>;

  return (
    <>
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

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable
            droppableId="board-sections"
            type="section"
            direction="horizontal"
          >
            {(provided) => (
              <Fragment key="board-sections-container">
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex gap-6"
                >
                  {filteredAndSortedTasks.map((section, sectionIndex) => (
                    <Draggable
                      key={`section-${section._id}-${sectionIndex}`}
                      draggableId={section._id}
                      index={sectionIndex}
                    >
                      {(provided, snapshot) => (
                        <Fragment
                          key={`section-container-${section._id}-${sectionIndex}`}
                        >
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "flex flex-col w-80 shrink-0",
                              snapshot.isDragging && "opacity-50"
                            )}
                            data-section-id={section._id}
                          >
                            <div className="flex items-center justify-between gap-2 py-2 group">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleSection(section._id)}
                                  className="text-neutral-500 hover:text-neutral-400"
                                >
                                  {collapsedSections[section._id] ? (
                                    <ChevronRight className="w-5 h-5" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5" />
                                  )}
                                </button>
                                {editingSectionId === section._id ? (
                                  <Input
                                    autoFocus
                                    defaultValue={section.title}
                                    className="h-6 py-0 px-1 text-sm font-medium bg-transparent border-none focus:ring-1 focus:ring-neutral-500 text-white"
                                    onBlur={(e) =>
                                      handleUpdateSectionName(
                                        section._id,
                                        e.target.value
                                      )
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleUpdateSectionName(
                                          section._id,
                                          e.currentTarget.value
                                        );
                                      } else if (e.key === "Escape") {
                                        setEditingSectionId(null);
                                      }
                                    }}
                                  />
                                ) : (
                                  <h3
                                    className="font-medium cursor-pointer text-white"
                                    onClick={() =>
                                      setEditingSectionId(section._id)
                                    }
                                  >
                                    {section.title}
                                  </h3>
                                )}
                                <span className="text-sm text-neutral-500">
                                  {section.tasks.length}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1 text-neutral-400 hover:text-red-400"
                                  onClick={() => deleteSection(section._id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {!collapsedSections[section._id] && (
                              <Droppable droppableId={section._id} type="task">
                                {(provided, snapshot) => (
                                  <div
                                    key={section._id}
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                      "space-y-2",
                                      snapshot.isDraggingOver &&
                                        "bg-[#353535]/30 rounded-lg p-2 -m-2"
                                    )}
                                  >
                                    {section.tasks.map((task, index) => (
                                      <Draggable
                                        key={task._id}
                                        draggableId={task._id}
                                        index={index}
                                        isDragDisabled={
                                          editingTask?.sectionId ===
                                            section._id &&
                                          editingTask?.taskId === task._id
                                        }
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={cn(
                                              snapshot.isDragging &&
                                                "shadow-lg ring-1 ring-[#353535]"
                                            )}
                                          >
                                            <TaskCard
                                              task={task}
                                              sectionId={section._id}
                                              onEdit={handleEditTask}
                                              onUpdate={handleUpdateTask}
                                              onCancel={() => {
                                                setEditingTask(null);
                                                handleCancelCreate(section._id);
                                              }}
                                              isEditing={
                                                editingTask?.sectionId ===
                                                  section._id &&
                                                editingTask?.taskId === task._id
                                              }
                                              taskData={
                                                newTaskData[section._id] || {}
                                              }
                                              setTaskData={(data) =>
                                                setNewTaskData((prev) => ({
                                                  ...prev,
                                                  [section._id]: {
                                                    ...data,
                                                    isCreating: false,
                                                  },
                                                }))
                                              }
                                              getAssigneeName={getAssigneeName}
                                              projectMembers={projectMembers}
                                              handleKeyDown={handleKeyDown}
                                              dragHandleProps={
                                                provided.dragHandleProps
                                              }
                                              onDuplicate={handleDuplicateTask}
                                              onDelete={handleDeleteTask}
                                              onMoveTask={handleMoveTask}
                                              projectSections={project.sections}
                                              onTaskClick={handleTaskClick}
                                            />
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {newTaskData[section._id]?.isCreating && (
                                      <div className="p-3 rounded-lg bg-[#1a1a1a]">
                                        <Input
                                          autoFocus
                                          placeholder="Task name"
                                          value={
                                            newTaskData[section._id]?.title ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            setNewTaskData((prev) => ({
                                              ...prev,
                                              [section._id]: {
                                                ...prev[section._id],
                                                title: e.target.value,
                                              },
                                            }))
                                          }
                                          onKeyDown={(e) =>
                                            handleKeyDown(e, section._id)
                                          }
                                          className="bg-[#353535] border-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-white placeholder:text-neutral-400 mb-2"
                                        />
                                        <div className="flex items-center space-x-1">
                                          <div className="flex items-center bg-[#353535] rounded-md h-7 px-2 min-w-[90px]">
                                            <User2 className="h-3.5 w-3.5 text-neutral-400 mr-1.5" />
                                            <Select
                                              value={
                                                newTaskData[section._id]
                                                  ?.assignee || ""
                                              }
                                              onValueChange={(value) =>
                                                setNewTaskData((prev) => ({
                                                  ...prev,
                                                  [section._id]: {
                                                    ...prev[section._id],
                                                    assignee:
                                                      value === "unassigned"
                                                        ? null
                                                        : value,
                                                  },
                                                }))
                                              }
                                            >
                                              <SelectTrigger className="border-0 p-0 h-auto bg-transparent w-full">
                                                <span className="text-xs truncate text-white">
                                                  {newTaskData[section._id]
                                                    ?.assignee
                                                    ? getAssigneeName(
                                                        newTaskData[section._id]
                                                          .assignee
                                                      )
                                                    : "Assign"}
                                                </span>
                                              </SelectTrigger>
                                              <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                                                {projectMembers.map(
                                                  (member) => (
                                                    <SelectItem
                                                      key={member._id}
                                                      value={member._id}
                                                      className="text-white hover:bg-[#2f2d45] hover:text-white"
                                                    >
                                                      {member.fullName ||
                                                        member.email}
                                                    </SelectItem>
                                                  )
                                                )}
                                                <SelectItem
                                                  value="unassigned"
                                                  className="text-white hover:bg-[#2f2d45] hover:text-white"
                                                >
                                                  Unassigned
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="min-w-[110px] h-7">
                                            <MuiDatePickerComponent
                                              date={
                                                newTaskData[section._id]
                                                  ?.dueDate
                                                  ? new Date(
                                                      newTaskData[
                                                        section._id
                                                      ].dueDate
                                                    )
                                                  : null
                                              }
                                              onDateChange={(date) =>
                                                setNewTaskData((prev) => ({
                                                  ...prev,
                                                  [section._id]: {
                                                    ...prev[section._id],
                                                    dueDate: date
                                                      ? date
                                                          .toISOString()
                                                          .split("T")[0]
                                                      : "",
                                                  },
                                                }))
                                              }
                                              className="h-7 text-xs"
                                            />
                                          </div>
                                          <div className="flex items-center bg-[#353535] rounded-md h-7 px-2 min-w-[90px]">
                                            <Select
                                              value={
                                                newTaskData[section._id]
                                                  ?.priority || "none"
                                              }
                                              onValueChange={(value) =>
                                                setNewTaskData((prev) => ({
                                                  ...prev,
                                                  [section._id]: {
                                                    ...prev[section._id],
                                                    priority:
                                                      value as Task["priority"],
                                                  },
                                                }))
                                              }
                                            >
                                              <SelectTrigger className="border-0 p-0 h-auto bg-transparent w-full">
                                                <span className="text-xs truncate text-white">
                                                  {newTaskData[section._id]
                                                    ?.priority || "Priority"}
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
                                                <SelectItem
                                                  value="none"
                                                  className="text-white hover:bg-[#2f2d45] hover:text-white"
                                                >
                                                  None
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-end space-x-2 mt-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleCancelCreate(section._id)
                                            }
                                            className="h-8 bg-transparent border-[#353535] text-neutral-300 hover:bg-[#252525] hover:text-white"
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              handleAddTask(section._id)
                                            }
                                            className="h-8 bg-[#353535] text-white hover:bg-[#454545]"
                                          >
                                            Create
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    <Button
                                      key={`add-task-button-${section._id}`}
                                      variant="ghost"
                                      className="w-full justify-start text-neutral-500 hover:text-neutral-400 hover:bg-[#353535]"
                                      onClick={() =>
                                        handleCreateTask(section._id)
                                      }
                                      data-add-task
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add task
                                    </Button>
                                  </div>
                                )}
                              </Droppable>
                            )}
                          </div>
                        </Fragment>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {canEditTasks && (
                    <Button
                      key="add-section-button"
                      variant="ghost"
                      className="h-10 px-4 border border-dashed border-[#353535] text-neutral-500 hover:text-neutral-400 hover:bg-[#353535]/50 hover:border-neutral-600"
                      onClick={addSection}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add section
                    </Button>
                  )}
                </div>
              </Fragment>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={() =>
            selectedTask.id &&
            handleDeleteTask(selectedTask.project.id, selectedTask.id)
          }
        />
      )}
    </>
  );
}
