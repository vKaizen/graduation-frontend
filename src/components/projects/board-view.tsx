"use client";

import React, { useState, useEffect, Fragment } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Plus,
  User2,
  MoreHorizontal,
  Pencil,
  CheckSquare,
  CheckCircle2,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Copy,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, Project, TaskDetails as TaskDetailsType } from "@/types";
// Update the import path to correctly point to the components directory
import { TaskDetails } from "./task-details";
import type { DropResult } from "@hello-pangea/dnd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

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
}

export function BoardView({
  project,
  deleteTask,
  ...otherProps
}: BoardViewProps) {
  console.log("BoardView received project:", project);

  // Add this near the top of the component to verify data
  useEffect(() => {
    if (project) {
      console.log(
        "BoardView received project with sections:",
        project.sections
      );
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
          isCreating: false,
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
      });
      setEditingTask(null);
      handleCancelCreate(sectionId);
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
        name: project.name,
        section: sectionName,
      },
    };

    setSelectedTask(taskDetails);
  };

  // Update the handleTaskUpdate function to ensure changes are reflected in the board view
  const handleTaskUpdate = (
    taskId: string,
    updates: Partial<TaskDetailsType>
  ) => {
    // Find which section contains this task
    let taskSectionId: string | null = null;

    for (const section of project.sections) {
      const taskExists = section.tasks.some((t) => t.id === taskId);
      if (taskExists) {
        taskSectionId = section.id;
        break;
      }
    }

    if (taskSectionId) {
      // Extract only the properties that exist in the Task type
      const taskUpdates: Partial<Task> = {
        title: updates.title,
        assignee: updates.assignee,
        dueDate: updates.dueDate,
        priority: updates.priority,
        description: updates.description,
        subtasks: updates.subtasks,
      };

      // Update the task in the project
      updateTask(taskSectionId, taskId, taskUpdates);
    }

    // Update the selected task
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
        const sectionId = target.dataset.sectionId;
        const isCancel = target.dataset.cancel;

        if (isCancel) {
          sectionMenu.remove();
          return;
        }

        if (sectionId) {
          // Move the task to the new section
          const updatedTask = { ...task, section: sectionId };
          updateTask(sectionId, taskId, updatedTask);
          sectionMenu.remove();
        }
      });

      document.body.appendChild(sectionMenu);
    }
  };

  const handleDeleteTask = async (sectionId: string, taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(sectionId, taskId);
    }
  };

  if (!project) return <div>No project data</div>;

  return (
    <>
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
                {project.sections.map((section, sectionIndex) => (
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
                                          {...provided.dragHandleProps}
                                          className={cn(
                                            "p-3 rounded-lg cursor-pointer group transition-colors bg-[#1a1a1a] ",
                                            snapshot.isDragging && "shadow-lg"
                                          )}
                                          onClick={() =>
                                            handleTaskClick(task, section._id)
                                          }
                                        >
                                          {editingTask?.sectionId ===
                                            section._id &&
                                          editingTask?.taskId === task._id ? (
                                            <div>
                                              <Input
                                                autoFocus
                                                placeholder="Task name"
                                                value={
                                                  newTaskData[section._id]
                                                    ?.title || ""
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
                                                  handleKeyDown(
                                                    e,
                                                    section._id,
                                                    task._id
                                                  )
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
                                                      setNewTaskData(
                                                        (prev) => ({
                                                          ...prev,
                                                          [section._id]: {
                                                            ...prev[
                                                              section._id
                                                            ],
                                                            assignee:
                                                              value || null,
                                                          },
                                                        })
                                                      )
                                                    }
                                                  >
                                                    <SelectTrigger className="border-0 p-0 h-auto bg-transparent w-full">
                                                      <span className="text-xs truncate text-white">
                                                        {newTaskData[
                                                          section._id
                                                        ]?.assignee || "Assign"}
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
                                                        value="Unassigned"
                                                        className="text-white hover:bg-[#2f2d45] hover:text-white"
                                                      >
                                                        Unassigned
                                                      </SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                                <div className="flex items-center bg-[#353535] rounded-md h-7 px-2 min-w-[110px]">
                                                  <Calendar className="h-3.5 w-3.5 text-neutral-400 mr-1.5" />
                                                  <div className="relative w-full">
                                                    <input
                                                      type="date"
                                                      value={
                                                        newTaskData[section._id]
                                                          ?.dueDate || ""
                                                      }
                                                      onChange={(e) =>
                                                        setNewTaskData(
                                                          (prev) => ({
                                                            ...prev,
                                                            [section._id]: {
                                                              ...prev[
                                                                section._id
                                                              ],
                                                              dueDate:
                                                                e.target.value,
                                                            },
                                                          })
                                                        )
                                                      }
                                                      className="absolute inset-0 opacity-0 cursor-pointer [color-scheme:dark]"
                                                      onKeyDown={(e) =>
                                                        handleKeyDown(
                                                          e,
                                                          section._id,
                                                          task._id
                                                        )
                                                      }
                                                    />
                                                    <span className="text-xs truncate text-neutral-400">
                                                      {newTaskData[section._id]
                                                        ?.dueDate
                                                        ? new Date(
                                                            newTaskData[
                                                              section._id
                                                            ].dueDate
                                                          ).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                              month: "short",
                                                              day: "numeric",
                                                              year: "numeric",
                                                            }
                                                          )
                                                        : "Due date"}
                                                    </span>
                                                  </div>
                                                </div>
                                                <div className="flex items-center bg-[#353535] rounded-md h-7 px-2 min-w-[90px]">
                                                  <Select
                                                    value={
                                                      newTaskData[section._id]
                                                        ?.priority || "none"
                                                    }
                                                    onValueChange={(value) =>
                                                      setNewTaskData(
                                                        (prev) => ({
                                                          ...prev,
                                                          [section._id]: {
                                                            ...prev[
                                                              section._id
                                                            ],
                                                            priority:
                                                              value as Task["priority"],
                                                          },
                                                        })
                                                      )
                                                    }
                                                  >
                                                    <SelectTrigger className="border-0 p-0 h-auto bg-transparent w-full">
                                                      <span className="text-xs truncate text-white">
                                                        {newTaskData[
                                                          section._id
                                                        ]?.priority ||
                                                          "Priority"}
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
                                            </div>
                                          ) : (
                                            <div className="flex flex-col">
                                              <div className="flex items-start gap-3">
                                                <div
                                                  {...provided.dragHandleProps}
                                                  className="cursor-grab active:cursor-grabbing"
                                                >
                                                  <GripVertical className="w-4 h-4 text-neutral-500 hover:text-neutral-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-neutral-200 text-sm mb-2">
                                                    {task.title}
                                                  </p>

                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                      {task.assignee ? (
                                                        <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs">
                                                          {task.assignee}
                                                        </div>
                                                      ) : null}
                                                      {task.dueDate && (
                                                        <span className="text-xs text-neutral-400">
                                                          {new Date(
                                                            task.dueDate
                                                          ).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                              month: "short",
                                                              day: "numeric",
                                                              year: "numeric",
                                                            }
                                                          )}
                                                        </span>
                                                      )}
                                                      {task.priority && (
                                                        <span
                                                          className={cn(
                                                            "px-2 py-0.5 text-xs rounded",
                                                            task.priority ===
                                                              "High"
                                                              ? "bg-red-500/20 text-red-300"
                                                              : task.priority ===
                                                                "Medium"
                                                              ? "bg-amber-500/20 text-amber-300"
                                                              : "bg-blue-500/20 text-blue-300"
                                                          )}
                                                        >
                                                          {task.priority}
                                                        </span>
                                                      )}
                                                    </div>

                                                    {/* Subtask counter badge - only show if there are subtasks */}
                                                    {task.subtasks &&
                                                      task.subtasks.length >
                                                        0 && (
                                                        <div className="inline-flex items-center gap-1 text-xs bg-[#2f2d45] text-neutral-300 rounded px-2 py-1">
                                                          <CheckSquare className="h-3 w-3 text-neutral-400" />
                                                          <span>
                                                            {
                                                              task.subtasks
                                                                .length
                                                            }
                                                          </span>
                                                        </div>
                                                      )}
                                                  </div>
                                                </div>
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-neutral-400 hover:text-neutral-300"
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
                                                        handleEditTask(
                                                          section._id,
                                                          task._id
                                                        );
                                                      }}
                                                    >
                                                      <Pencil className="h-4 w-4 mr-2" />
                                                      Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                      className="text-white hover:bg-[#262626] cursor-pointer"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDuplicateTask(
                                                          section._id,
                                                          task._id
                                                        );
                                                      }}
                                                    >
                                                      <Copy className="h-4 w-4 mr-2" />
                                                      Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSub>
                                                      <DropdownMenuSubTrigger
                                                        className="text-white hover:bg-[#262626] cursor-pointer"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          e.preventDefault();
                                                        }}
                                                      >
                                                        <ArrowRight className="h-4 w-4 mr-2" />
                                                        Move to
                                                      </DropdownMenuSubTrigger>
                                                      <DropdownMenuSubContent
                                                        className="bg-[#1a1a1a] border-[#262626]"
                                                        alignOffset={-5}
                                                        side="right"
                                                      >
                                                        {project.sections
                                                          .filter(
                                                            (s) =>
                                                              s._id !==
                                                              section._id
                                                          ) // Don't show current section
                                                          .map(
                                                            (targetSection) => (
                                                              <DropdownMenuItem
                                                                key={
                                                                  targetSection._id
                                                                }
                                                                className="text-white hover:bg-[#262626] cursor-pointer"
                                                                onClick={(
                                                                  e
                                                                ) => {
                                                                  e.stopPropagation();
                                                                  // Calculate new order (append to end of target section)
                                                                  const newOrder =
                                                                    targetSection
                                                                      .tasks
                                                                      .length;
                                                                  // Move task using onDragEnd
                                                                  onDragEnd({
                                                                    destination:
                                                                      {
                                                                        droppableId:
                                                                          targetSection._id,
                                                                        index:
                                                                          newOrder,
                                                                      },
                                                                    source: {
                                                                      droppableId:
                                                                        section._id,
                                                                      index:
                                                                        section.tasks.findIndex(
                                                                          (t) =>
                                                                            t._id ===
                                                                            task._id
                                                                        ),
                                                                    },
                                                                    draggableId:
                                                                      task._id,
                                                                    type: "task",
                                                                    mode: "FLUID",
                                                                    reason:
                                                                      "DROP",
                                                                  });
                                                                }}
                                                              >
                                                                {
                                                                  targetSection.title
                                                                }
                                                              </DropdownMenuItem>
                                                            )
                                                          )}
                                                      </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                    <DropdownMenuItem
                                                      className="text-white hover:bg-[#262626] cursor-pointer text-red-400 hover:text-red-400"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteTask(
                                                          section._id,
                                                          task._id
                                                        );
                                                      }}
                                                    >
                                                      <Trash2 className="h-4 w-4 mr-2" />
                                                      Delete
                                                    </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                  {newTaskData[section._id]?.isCreating ? (
                                    <div
                                      key={`new-task-form-${section._id}`}
                                      className="p-3 rounded-lg bg-[#1a1a1a]"
                                    >
                                      <Input
                                        autoFocus
                                        placeholder="Task name"
                                        value={newTaskData[section._id].title}
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
                                        className="mb-2 bg-[#353535] border-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-white placeholder:text-neutral-400"
                                      />
                                      <div className="flex items-center gap-2 text-neutral-400">
                                        <Select
                                          value={
                                            newTaskData[section._id].assignee ||
                                            ""
                                          }
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
                                          <SelectTrigger className="h-7 w-7 px-0 border-0 bg-transparent hover:bg-[#353535] hover:text-neutral-300">
                                            <User2
                                              className={cn(
                                                "h-4 w-4",
                                                newTaskData[section._id]
                                                  .assignee
                                                  ? "text-violet-500"
                                                  : "text-neutral-400"
                                              )}
                                            />
                                          </SelectTrigger>
                                          <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                                            <SelectItem
                                              key="cx"
                                              value="CX"
                                              className="text-white hover:bg-[#2f2d45] hover:text-white"
                                            >
                                              CX
                                            </SelectItem>
                                            <SelectItem
                                              key="jd"
                                              value="JD"
                                              className="text-white hover:bg-[#2f2d45] hover:text-white"
                                            >
                                              JD
                                            </SelectItem>
                                            <SelectItem
                                              key="unassigned"
                                              value="Unassigned"
                                              className="text-white hover:bg-[#2f2d45] hover:text-white"
                                            >
                                              Unassigned
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <div className="flex items-center bg-[#353535] rounded-md h-7 px-2 min-w-[110px]">
                                          <Calendar className="h-3.5 w-3.5 text-neutral-400 mr-1.5" />
                                          <div className="relative w-full">
                                            <input
                                              type="date"
                                              value={
                                                newTaskData[section._id].dueDate
                                              }
                                              onChange={(e) =>
                                                setNewTaskData((prev) => ({
                                                  ...prev,
                                                  [section._id]: {
                                                    ...prev[section._id],
                                                    dueDate: e.target.value,
                                                  },
                                                }))
                                              }
                                              className="absolute inset-0 opacity-0 cursor-pointer [color-scheme:dark]"
                                            />
                                            <span className="text-xs truncate text-neutral-400">
                                              {newTaskData[section._id].dueDate
                                                ? new Date(
                                                    newTaskData[
                                                      section._id
                                                    ].dueDate
                                                  ).toLocaleDateString(
                                                    "en-US",
                                                    {
                                                      month: "short",
                                                      day: "numeric",
                                                      year: "numeric",
                                                    }
                                                  )
                                                : "Due date"}
                                            </span>
                                          </div>
                                        </div>
                                        <Select
                                          value={
                                            newTaskData[section._id].priority ||
                                            "none"
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
                                          <SelectTrigger className="h-7 px-2 border-0 bg-transparent hover:bg-[#353535] hover:text-neutral-300">
                                            <span className="text-sm text-white">
                                              {newTaskData[section._id]
                                                .priority || "Priority"}
                                            </span>
                                          </SelectTrigger>
                                          <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                                            <SelectItem
                                              key="high"
                                              value="High"
                                              className="text-white hover:bg-[#2f2d45] hover:text-white"
                                            >
                                              High
                                            </SelectItem>
                                            <SelectItem
                                              key="medium"
                                              value="Medium"
                                              className="text-white hover:bg-[#2f2d45] hover:text-white"
                                            >
                                              Medium
                                            </SelectItem>
                                            <SelectItem
                                              key="low"
                                              value="Low"
                                              className="text-white hover:bg-[#2f2d45] hover:text-white"
                                            >
                                              Low
                                            </SelectItem>
                                            <SelectItem
                                              key="none"
                                              value="none"
                                              className="text-white hover:bg-[#2f2d45] hover:text-white"
                                            >
                                              None
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 hover:text-neutral-300"
                                          onClick={() =>
                                            handleAddTask(section._id)
                                          }
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      key={`add-task-button-${section._id}`}
                                      variant="ghost"
                                      className="w-full justify-start text-neutral-500 hover:text-neutral-400 hover:bg-[#353535]"
                                      onClick={() =>
                                        handleCreateTask(section._id)
                                      }
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
                      </Fragment>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <Button
                  key="add-section-button"
                  variant="ghost"
                  className="h-10 px-4 border border-dashed border-[#353535] text-neutral-500 hover:text-neutral-400 hover:bg-[#353535]/50 hover:border-neutral-600"
                  onClick={addSection}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add section
                </Button>
              </div>
            </Fragment>
          )}
        </Droppable>
      </DragDropContext>

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
    </>
  );
}
