"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  User2,
  Calendar,
  Plus,
  Pencil,
  CheckSquare,
  Trash2,
  ChevronDown,
  ChevronRight,
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
import type { Project, Task } from "@/types";
import { TaskDetails } from "./task-details";
import type { TaskDetails as TaskDetailsType } from "@/types";

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
  section: string;
  project: string;
  status: "not started" | "in progress" | "completed";
  order: number;
  isCreating: boolean;
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

  useEffect(() => {
    if (project) {
      console.log("ListView received project with sections:", project.sections);
    }
  }, [project]);

  const handleUpdateSectionName = (sectionId: string, newName: string) => {
    updateSectionName(sectionId, newName);
    setEditingSectionId(null);
  };

  const handleCreateTask = (sectionId: string) => {
    const newTask: Omit<Task, "_id"> = {
      title: "",
      assignee: null,
      dueDate: "",
      priority: undefined,
      section: sectionId,
      project: project._id,
      status: "not started",
      order: 0,
    };
    addTask(sectionId, newTask);
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
        project: project._id,
        status: "not started",
        order:
          project.sections.find((s) => s._id === sectionId)?.tasks.length || 0,
        section: sectionId,
      });
      handleCancelCreate(sectionId);
    }
  };

  const handleEditTask = (sectionId: string, taskId: string) => {
    const task = project.sections
      .find((s) => s._id === sectionId)
      ?.tasks.find((t) => t._id === taskId);
    if (task) {
      setEditingTask({ sectionId, taskId });
      setNewTaskData((prev) => ({
        ...prev,
        [sectionId]: {
          title: task.title,
          assignee: task.assignee,
          dueDate: task.dueDate || "",
          priority: task.priority,
          section: task.section,
          project: task.project,
          status: task.status,
          order: task.order,
          isCreating: false,
        },
      }));
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

  const renderTaskRow = (
    task: Task,
    section: Project["sections"][0],
    isEditing: boolean
  ) => {
    if (isEditing) {
      return (
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
              onKeyDown={(e) => handleKeyDown(e, section._id, task._id)}
              className="bg-[#353535] border-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-white placeholder:text-neutral-500"
            />
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
                <SelectItem value="Unassigned">Unassigned</SelectItem>
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
      <>
        <tr onClick={() => handleTaskClick(task, section._id)}>
          <td className="p-2 border-b border-[#353535] w-1/2">
            <div className="flex items-center gap-3 pl-8">
              <CheckCircle2
                className={cn(
                  "h-4 w-4",
                  selectedTaskId === task._id
                    ? "text-neutral-400"
                    : "text-neutral-500 group-hover:text-neutral-400"
                )}
              />
              <div className="flex items-center gap-2">
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

                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="inline-flex items-center gap-1 text-xs bg-[#2f2d45] text-neutral-300 rounded px-2 py-1">
                    <CheckSquare className="h-3 w-3 text-neutral-400" />
                    <span>{task.subtasks.length}</span>
                  </div>
                )}
              </div>
            </div>
          </td>
          <td className="p-2 border-b border-[#353535] w-1/6">
            {task.assignee ? (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs">
                  {task.assignee}
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-neutral-500 hover:text-neutral-400",
                  selectedTaskId === task._id && "text-neutral-400"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditTask(section._id, task._id);
                }}
              >
                <User2 className="h-4 w-4 mr-2" />
                Assign
              </Button>
            )}
          </td>
          <td className="p-2 border-b border-[#353535] w-1/6">
            {task.dueDate ? (
              <span className="text-neutral-400">{task.dueDate}</span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-neutral-500 hover:text-neutral-400",
                  selectedTaskId === task._id && "text-neutral-400"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditTask(section._id, task._id);
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Set due date
              </Button>
            )}
          </td>
          <td className="p-2 border-b border-[#353535] w-1/6">
            <div className="flex items-center justify-between">
              {task.priority ? (
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs rounded",
                    task.priority === "High"
                      ? "bg-red-500/20 text-red-300"
                      : task.priority === "Medium"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-blue-500/20 text-blue-300"
                  )}
                >
                  {task.priority}
                </span>
              ) : (
                <span className="text-neutral-500">-</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 opacity-0 group-hover:opacity-100 text-[#ffff]"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditTask(section._id, task._id);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </td>
        </tr>
      </>
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="sections" type="section">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="rounded-lg overflow-hidden"
          >
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky top-0 z-20 text-left p-3 text-neutral-400 font-medium border-b border-[#353535] w-1/2">
                    Task name
                  </th>
                  <th className="sticky top-0 z-20 text-left p-3 text-neutral-400 font-medium border-b border-[#353535] w-1/6">
                    Assignee
                  </th>
                  <th className="sticky top-0 z-20 text-left p-3 text-neutral-400 font-medium border-b border-[#353535] w-1/6">
                    Due date
                  </th>
                  <th className="sticky top-0 z-20 text-left p-3 text-neutral-400 font-medium border-b border-[#353535] w-1/6">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody>
                {project.sections.map((section, sectionIndex) => (
                  <Draggable
                    key={`section-${section._id}-${sectionIndex}`}
                    draggableId={section._id}
                    index={sectionIndex}
                  >
                    {(provided, snapshot) => (
                      <React.Fragment
                        key={`section-container-${section._id}-${sectionIndex}`}
                      >
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "group",
                            snapshot.isDragging && "opacity-50"
                          )}
                        >
                          <td
                            colSpan={4}
                            className="p-2 border-b border-[#353535]"
                          >
                            <div className="flex items-center justify-between">
                              <button
                                className="flex items-center gap-2 text-neutral-300"
                                onClick={() => toggleSection(section._id)}
                              >
                                {collapsedSections[section._id] ? (
                                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                                )}
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
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="font-medium cursor-pointer">
                                    {section.title}
                                  </span>
                                )}
                                <span className="text-sm text-neutral-500">
                                  {section.tasks.length}
                                </span>
                              </button>
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
                          </td>
                        </tr>
                        {!collapsedSections[section._id] && (
                          <Droppable droppableId={section._id} type="task">
                            {(provided) => (
                              <tr>
                                <td colSpan={4} className="p-0">
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
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
                                              "group hover:bg-[#353535] transition-colors",
                                              selectedTaskId === task._id &&
                                                "bg-[#353535] hover:bg-[#353535]",
                                              snapshot.isDragging &&
                                                "opacity-50"
                                            )}
                                          >
                                            <table className="w-full">
                                              <tbody>
                                                {renderTaskRow(
                                                  task,
                                                  section,
                                                  editingTask?.sectionId ===
                                                    section._id &&
                                                    editingTask?.taskId ===
                                                      task._id
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {newTaskData[section._id]?.isCreating ? (
                                      <div className="p-2 bg-[#1a1a1a] border-b border-[#353535]">
                                        <table className="w-full">
                                          <tbody>
                                            <tr>
                                              <td className="p-2 w-1/2">
                                                <Input
                                                  autoFocus
                                                  placeholder="Task name"
                                                  value={
                                                    newTaskData[section._id]
                                                      .title
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
                                                      section._id
                                                    )
                                                  }
                                                  className="bg-[#353535] border-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-white placeholder:text-neutral-500"
                                                />
                                              </td>
                                              <td className="p-2 w-1/6">
                                                <Select
                                                  value={
                                                    newTaskData[section._id]
                                                      .assignee || ""
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
                                                  <SelectTrigger className="h-9 bg-[#353535] border-0 text-white">
                                                    <SelectValue placeholder="Assignee" />
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                                                    <SelectItem value="CX">
                                                      CX
                                                    </SelectItem>
                                                    <SelectItem value="JD">
                                                      JD
                                                    </SelectItem>
                                                    <SelectItem value="Unassigned">
                                                      Unassigned
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </td>
                                              <td className="p-2 w-1/6">
                                                <Input
                                                  type="date"
                                                  value={
                                                    newTaskData[section._id]
                                                      .dueDate
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
                                                  className="h-9 bg-[#353535] border-0 text-sm text-white placeholder:text-neutral-500"
                                                />
                                              </td>
                                              <td className="p-2 w-1/6">
                                                <div className="flex items-center gap-2">
                                                  <Select
                                                    value={
                                                      newTaskData[section._id]
                                                        .priority || "none"
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
                                                    <SelectTrigger className="h-9 bg-[#353535] border-0 text-white">
                                                      <SelectValue placeholder="Priority" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                                                      <SelectItem value="High">
                                                        High
                                                      </SelectItem>
                                                      <SelectItem value="Medium">
                                                        Medium
                                                      </SelectItem>
                                                      <SelectItem value="Low">
                                                        Low
                                                      </SelectItem>
                                                      <SelectItem value="none">
                                                        None
                                                      </SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 px-2 hover:text-neutral-300"
                                                    onClick={() =>
                                                      handleAddTask(section._id)
                                                    }
                                                  >
                                                    Save
                                                  </Button>
                                                </div>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="p-2 border-b border-[#353535]">
                                        <Button
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
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Droppable>
                        )}
                      </React.Fragment>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <tr>
                  <td colSpan={4} className="p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-neutral-500 hover:text-neutral-400 hover:bg-[#353535]"
                      onClick={addSection}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add section
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Droppable>
      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => {
            setSelectedTask(null);
            setSelectedTaskId(null);
          }}
          onUpdate={handleTaskUpdate}
          onDelete={() =>
            handleDeleteTask(selectedTask.project.id, selectedTask._id)
          }
        />
      )}
    </DragDropContext>
  );
}
