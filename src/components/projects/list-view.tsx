"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, CheckCircle2, User2, Calendar, Plus, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Project, Task } from "@/types"
// First, add the import for TaskDetails at the top of the file
import { TaskDetails } from "./task-details"
import type { TaskDetails as TaskDetailsType } from "@/types"

interface ListViewProps {
  project: Project
  collapsedSections: Record<string, boolean>
  toggleSection: (sectionId: string) => void
  selectedTaskId: string | null
  setSelectedTaskId: (taskId: string | null) => void
  onDragEnd: (result: any) => void
  addSection: () => void
  updateSectionName: (sectionId: string, newName: string) => void
  addTask: (sectionId: string, task: Omit<Task, "id">) => void
  updateTask: (sectionId: string, taskId: string, updatedTask: Partial<Task>) => void
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
}: ListViewProps) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [newTaskData, setNewTaskData] = useState<Record<string, Omit<Task, "id"> & { isCreating: boolean }>>({})
  const [editingTask, setEditingTask] = useState<{ sectionId: string; taskId: string } | null>(null)
  // Add a new state for the selected task details after the existing state declarations
  const [selectedTask, setSelectedTask] = useState<TaskDetailsType | null>(null)

  const handleUpdateSectionName = (sectionId: string, newName: string) => {
    updateSectionName(sectionId, newName)
    setEditingSectionId(null)
  }

  const handleCreateTask = (sectionId: string) => {
    setNewTaskData((prev) => ({
      ...prev,
      [sectionId]: { title: "", assignee: null, dueDate: "", priority: undefined, isCreating: true },
    }))
  }

  const handleCancelCreate = (sectionId: string) => {
    setNewTaskData((prev) => {
      const newData = { ...prev }
      delete newData[sectionId]
      return newData
    })
  }

  const handleAddTask = (sectionId: string) => {
    const taskData = newTaskData[sectionId]
    if (taskData && taskData.title.trim()) {
      addTask(sectionId, {
        title: taskData.title,
        assignee: taskData.assignee,
        dueDate: taskData.dueDate || undefined,
        priority: taskData.priority,
      })
      handleCancelCreate(sectionId)
    }
  }

  const handleEditTask = (sectionId: string, taskId: string) => {
    const task = project.sections.find((s) => s.id === sectionId)?.tasks.find((t) => t.id === taskId)
    if (task) {
      setEditingTask({ sectionId, taskId })
      setNewTaskData((prev) => ({
        ...prev,
        [sectionId]: { ...task, isCreating: false },
      }))
    }
  }

  const handleUpdateTask = (sectionId: string, taskId: string) => {
    const taskData = newTaskData[sectionId]
    if (taskData) {
      updateTask(sectionId, taskId, {
        title: taskData.title,
        assignee: taskData.assignee,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
      })
      setEditingTask(null)
      handleCancelCreate(sectionId)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, sectionId: string, taskId?: string) => {
    if (e.key === "Enter") {
      if (taskId) {
        handleUpdateTask(sectionId, taskId)
      } else {
        handleAddTask(sectionId)
      }
    } else if (e.key === "Escape") {
      if (taskId) {
        setEditingTask(null)
      }
      handleCancelCreate(sectionId)
    }
  }

  // Add a handleTaskClick function after the handleKeyDown function
  const handleTaskClick = (task: Task, sectionId: string) => {
    // Don't open task details if we're in edit mode
    if (editingTask?.sectionId === sectionId && editingTask?.taskId === task.id) {
      return
    }

    setSelectedTaskId(task.id)

    // Find the section this task belongs to
    const section = project.sections.find((s) => s.id === sectionId)
    const sectionName = section ? section.title : "Unknown Section"

    // Convert Task to TaskDetailsType with more detailed information
    const taskDetails: TaskDetailsType = {
      ...task,
      description: task.description || "", // Use existing description if available
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
      subtasks: [], // Initialize with an empty array instead of default subtasks
      collaborators: ["Ka", "JD"],
      project: {
        id: project.id,
        name: project.name,
        status: sectionName,
        color: project.color, // Add this line to include the project color
      },
    }
    setSelectedTask(taskDetails)
  }

  // Add a handleTaskUpdate function after the handleTaskClick function
  const handleTaskUpdate = (taskId: string, updates: Partial<TaskDetailsType>) => {
    // Find which section contains this task
    let taskSectionId: string | null = null

    for (const section of project.sections) {
      const taskExists = section.tasks.some((t) => t.id === taskId)
      if (taskExists) {
        taskSectionId = section.id
        break
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
      }

      // Update the task in the project
      updateTask(taskSectionId, taskId, taskUpdates)
    }

    // Update the selected task
    setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const renderTaskRow = (task: Task, section: Project["sections"][0], isEditing: boolean) => {
    if (isEditing) {
      return (
        <tr>
          <td className="p-2 border-b border-[#353535] w-1/2">
            <Input
              autoFocus
              placeholder="Task name"
              value={newTaskData[section.id]?.title || ""}
              onChange={(e) =>
                setNewTaskData((prev) => ({
                  ...prev,
                  [section.id]: { ...prev[section.id], title: e.target.value },
                }))
              }
              onKeyDown={(e) => handleKeyDown(e, section.id, task.id)}
              className="bg-[#353535] border-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-white placeholder:text-neutral-500"
            />
          </td>
          <td className="p-2 border-b border-[#353535] w-1/6">
            <Select
              value={newTaskData[section.id]?.assignee || ""}
              onValueChange={(value) =>
                setNewTaskData((prev) => ({
                  ...prev,
                  [section.id]: { ...prev[section.id], assignee: value || null },
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
              value={newTaskData[section.id]?.dueDate || ""}
              onChange={(e) =>
                setNewTaskData((prev) => ({
                  ...prev,
                  [section.id]: { ...prev[section.id], dueDate: e.target.value },
                }))
              }
              className="h-9 bg-[#353535] border-0 text-sm text-white placeholder:text-neutral-500"
            />
          </td>
          <td className="p-2 border-b border-[#353535] w-1/6">
            <div className="flex items-center gap-2">
              <Select
                value={newTaskData[section.id]?.priority || "none"}
                onValueChange={(value) =>
                  setNewTaskData((prev) => ({
                    ...prev,
                    [section.id]: {
                      ...prev[section.id],
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
                onClick={() => handleUpdateTask(section.id, task.id)}
              >
                Save
              </Button>
            </div>
          </td>
        </tr>
      )
    }

    return (
      <tr onClick={() => handleTaskClick(task, section.id)}>
        <td className="p-2 border-b border-[#353535] w-1/2">
          <div className="flex items-center gap-3 pl-8">
            <CheckCircle2
              className={cn(
                "h-4 w-4",
                selectedTaskId === task.id ? "text-neutral-400" : "text-neutral-500 group-hover:text-neutral-400",
              )}
            />
            <span
              className={cn(
                "text-sm",
                selectedTaskId === task.id ? "text-neutral-200" : "text-neutral-300 group-hover:text-neutral-200",
              )}
            >
              {task.title}
            </span>
          </div>
        </td>
        <td className="p-2 border-b border-[#353535] w-1/6">
          {task.assignee ? (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs">
                {task.assignee}
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-neutral-500 hover:text-neutral-400",
                selectedTaskId === task.id && "text-neutral-400",
              )}
              onClick={(e) => {
                e.stopPropagation()
                handleEditTask(section.id, task.id)
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
                selectedTaskId === task.id && "text-neutral-400",
              )}
              onClick={(e) => {
                e.stopPropagation()
                handleEditTask(section.id, task.id)
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
                      ? "bg-orange-500/20 text-orange-300"
                      : "bg-blue-500/20 text-blue-300",
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
                e.stopPropagation()
                handleEditTask(section.id, task.id)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="sections" type="section">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="rounded-lg overflow-hidden">
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
                  <Draggable key={section.id} draggableId={section.id} index={sectionIndex}>
                    {(provided, snapshot) => (
                      <React.Fragment>
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn("group", snapshot.isDragging && "opacity-50")}
                        >
                          <td colSpan={4} className="p-2 border-b border-[#353535]">
                            <button
                              onClick={(e) => {
                                if (editingSectionId !== section.id) {
                                  toggleSection(section.id)
                                }
                                e.stopPropagation()
                              }}
                              className="flex items-center gap-2 text-neutral-300 hover:text-neutral-200"
                            >
                              {collapsedSections[section.id] ? (
                                <ChevronRight className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              {editingSectionId === section.id ? (
                                <Input
                                  autoFocus
                                  defaultValue={section.title}
                                  className="h-6 py-0 px-1 text-sm font-medium bg-transparent border-none focus:ring-1 focus:ring-neutral-500"
                                  onBlur={(e) => handleUpdateSectionName(section.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleUpdateSectionName(section.id, e.currentTarget.value)
                                    }
                                  }}
                                />
                              ) : (
                                <span
                                  className="font-medium cursor-pointer"
                                  onClick={() => setEditingSectionId(section.id)}
                                >
                                  {section.title}
                                </span>
                              )}
                              <span className="text-sm text-neutral-500">{section.tasks.length}</span>
                            </button>
                          </td>
                        </tr>
                        {!collapsedSections[section.id] && (
                          <Droppable droppableId={section.id} type="task">
                            {(provided) => (
                              <tr>
                                <td colSpan={4} className="p-0">
                                  <div {...provided.droppableProps} ref={provided.innerRef}>
                                    {section.tasks.map((task, index) => (
                                      <Draggable key={task.id} draggableId={task.id} index={index}>
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={cn(
                                              "group hover:bg-[#353535] transition-colors",
                                              selectedTaskId === task.id && "bg-[#353535] hover:bg-[#353535]",
                                              snapshot.isDragging && "opacity-50",
                                            )}
                                          >
                                            <table className="w-full">
                                              <tbody>
                                                {renderTaskRow(
                                                  task,
                                                  section,
                                                  editingTask?.sectionId === section.id &&
                                                    editingTask?.taskId === task.id,
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {/* Add task form */}
                                    {newTaskData[section.id]?.isCreating ? (
                                      <div className="p-2 bg-[#1a1a1a] border-b border-[#353535]">
                                        <table className="w-full">
                                          <tbody>
                                            <tr>
                                              <td className="p-2 w-1/2">
                                                <Input
                                                  autoFocus
                                                  placeholder="Task name"
                                                  value={newTaskData[section.id].title}
                                                  onChange={(e) =>
                                                    setNewTaskData((prev) => ({
                                                      ...prev,
                                                      [section.id]: { ...prev[section.id], title: e.target.value },
                                                    }))
                                                  }
                                                  onKeyDown={(e) => handleKeyDown(e, section.id)}
                                                  className="bg-[#353535] border-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-white placeholder:text-neutral-500"
                                                />
                                              </td>
                                              <td className="p-2 w-1/6">
                                                <Select
                                                  value={newTaskData[section.id].assignee || ""}
                                                  onValueChange={(value) =>
                                                    setNewTaskData((prev) => ({
                                                      ...prev,
                                                      [section.id]: { ...prev[section.id], assignee: value || null },
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
                                              <td className="p-2 w-1/6">
                                                <Input
                                                  type="date"
                                                  value={newTaskData[section.id].dueDate}
                                                  onChange={(e) =>
                                                    setNewTaskData((prev) => ({
                                                      ...prev,
                                                      [section.id]: { ...prev[section.id], dueDate: e.target.value },
                                                    }))
                                                  }
                                                  className="h-9 bg-[#353535] border-0 text-sm text-white placeholder:text-neutral-500"
                                                />
                                              </td>
                                              <td className="p-2 w-1/6">
                                                <div className="flex items-center gap-2">
                                                  <Select
                                                    value={newTaskData[section.id].priority || "none"}
                                                    onValueChange={(value) =>
                                                      setNewTaskData((prev) => ({
                                                        ...prev,
                                                        [section.id]: {
                                                          ...prev[section.id],
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
                                                    onClick={() => handleAddTask(section.id)}
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
                                          onClick={() => handleCreateTask(section.id)}
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
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <TaskDetails
        task={selectedTask}
        onClose={() => {
          setSelectedTask(null)
          setSelectedTaskId(null)
        }}
        onUpdate={handleTaskUpdate}
      />
    </DragDropContext>
  )
}

