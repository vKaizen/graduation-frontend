"use client"

import type React from "react"
import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Plus, GripVertical, User2, MoreHorizontal, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task, Project, TaskDetails as TaskDetailsType } from "@/types"
// Update the import path to correctly point to the components directory
import { TaskDetails } from "./task-details"



interface BoardViewProps {
  project: Project
  onDragEnd: (result: any) => void
  addTask: (sectionId: string, task: Omit<Task, "id">) => void
  updateTask: (sectionId: string, taskId: string, updatedTask: Partial<Task>) => void
  addSection: () => void
  updateSectionName: (sectionId: string, newName: string) => void
}

export function BoardView({ project, ...otherProps }) {
  console.log("BoardView received project:", project)

  const { onDragEnd, addTask, updateTask, addSection, updateSectionName } = otherProps
  const [newTaskData, setNewTaskData] = useState<Record<string, Omit<Task, "id"> & { isCreating: boolean }>>({})
  const [editingTask, setEditingTask] = useState<{ sectionId: string; taskId: string } | null>(null)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskDetailsType | null>(null)

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

  const handleEditTask = (sectionId: string, taskId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation() // Prevent task selection when clicking edit
    }

    setEditingTask({ sectionId, taskId })
    const task = project.sections.find((s) => s.id === sectionId)?.tasks.find((t) => t.id === taskId)
    if (task) {
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

  const handleUpdateSectionName = (sectionId: string, newName: string) => {
    updateSectionName(sectionId, newName)
    setEditingSectionId(null)
  }

  // Update the handleTaskClick function to ensure task details are properly populated with the correct data
  const handleTaskClick = (task: Task, sectionId: string) => {
    // Don't open task details if we're in edit mode
    if (editingTask?.sectionId === sectionId && editingTask?.taskId === task.id) {
      return
    }

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
      subtasks: [
        {
          id: "subtask-1",
          title: "Review requirements",
          completed: true,
        },
        {
          id: "subtask-2",
          title: "Create initial draft",
          completed: false,
        },
      ],
      collaborators: ["Ka", "JD"],
      project: {
        id: project.id,
        name: project.name,
        status: sectionName,
      },
    }
    setSelectedTask(taskDetails)
  }

  // Update the handleTaskUpdate function to ensure changes are reflected in the board view
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

  if (!project) return <div>No project data</div>

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections" type="section" direction="horizontal">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="flex gap-6">
              {project.sections.map((section, sectionIndex) => (
                <Draggable key={section.id} draggableId={section.id} index={sectionIndex}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn("min-w-[300px]", snapshot.isDragging && "opacity-70")}
                      data-section-id={section.id}
                    >
                      <div className="flex items-center justify-between mb-4 text-neutral-300">
                        <div className="flex items-center gap-2">
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-neutral-500 hover:text-neutral-400 cursor-grab active:cursor-grabbing" />
                          </div>
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
                            <h3
                              className="font-medium cursor-pointer hover:text-neutral-200"
                              onClick={() => setEditingSectionId(section.id)}
                            >
                              {section.title}
                            </h3>
                          )}
                          <span className="text-sm text-neutral-500">{section.tasks.length}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                        </Button>
                      </div>
                      <Droppable droppableId={section.id} type="task">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "space-y-2",
                              snapshot.isDraggingOver && "bg-[#353535]/30 rounded-lg p-2 -m-2",
                            )}
                          >
                            {section.tasks.map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      "p-3 rounded-lg cursor-pointer group transition-colors bg-[#1a1a1a] hover:bg-[#353535]",
                                      snapshot.isDragging && "shadow-lg",
                                    )}
                                    onClick={() => handleTaskClick(task, section.id)}
                                  >
                                    {editingTask?.sectionId === section.id && editingTask?.taskId === task.id ? (
                                      <div className="space-y-2">
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
                                        <div className="flex items-center gap-2 text-neutral-400">
                                          <Select
                                            value={newTaskData[section.id]?.assignee || ""}
                                            onValueChange={(value) =>
                                              setNewTaskData((prev) => ({
                                                ...prev,
                                                [section.id]: { ...prev[section.id], assignee: value || null },
                                              }))
                                            }
                                          >
                                            <SelectTrigger className="h-7 px-2 border-0 bg-transparent hover:bg-[#353535] hover:text-neutral-300">
                                              <User2
                                                className={cn(
                                                  "h-4 w-4",
                                                  newTaskData[section.id]?.assignee
                                                    ? "text-violet-500"
                                                    : "text-neutral-400",
                                                )}
                                              />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                                              <SelectItem value="CX">CX</SelectItem>
                                              <SelectItem value="JD">JD</SelectItem>
                                              <SelectItem value="Unassigned">Unassigned</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <Input
                                            type="date"
                                            value={newTaskData[section.id]?.dueDate || ""}
                                            onChange={(e) =>
                                              setNewTaskData((prev) => ({
                                                ...prev,
                                                [section.id]: { ...prev[section.id], dueDate: e.target.value },
                                              }))
                                            }
                                            className="h-7 px-2 bg-transparent border-0 text-sm text-white hover:text-white focus:text-white"
                                          />
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
                                            <SelectTrigger className="h-7 px-2 border-0 bg-transparent hover:bg-[#353535] hover:text-neutral-300">
                                              <span className="text-sm">
                                                {newTaskData[section.id]?.priority || "Priority"}
                                              </span>
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
                                            className="h-7 px-2 hover:text-neutral-300"
                                            onClick={() => handleUpdateTask(section.id, task.id)}
                                          >
                                            Save
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-start gap-3">
                                        <div {...provided.dragHandleProps}>
                                          <GripVertical className="h-4 w-4 mt-1 text-neutral-500 hover:text-neutral-400 cursor-grab active:cursor-grabbing" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-neutral-200 text-sm mb-2">{task.title}</p>
                                          <div className="flex items-center gap-2">
                                            {task.assignee ? (
                                              <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs">
                                                {task.assignee}
                                              </div>
                                            ) : null}
                                            {task.dueDate && (
                                              <span className="text-xs text-neutral-400">{task.dueDate}</span>
                                            )}
                                            {task.priority && (
                                              <span
                                                className={cn(
                                                  "px-2 py-0.5 text-xs rounded",
                                                  task.priority === "High"
                                                    ? "bg-red-500/20 text-red-300"
                                                    : task.priority === "Medium"
                                                      ? "bg-amber-500/20 text-amber-300"
                                                      : "bg-blue-500/20 text-blue-300",
                                                )}
                                              >
                                                {task.priority}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 hover:text-neutral-300"
                                          onClick={(e) => handleEditTask(section.id, task.id, e)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            {newTaskData[section.id]?.isCreating ? (
                              <div className="p-3 rounded-lg bg-[#1a1a1a]">
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
                                  className="mb-2 bg-[#353535] border-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-white placeholder:text-neutral-500"
                                />
                                <div className="flex items-center gap-2 text-neutral-400">
                                  <Select
                                    value={newTaskData[section.id].assignee || ""}
                                    onValueChange={(value) =>
                                      setNewTaskData((prev) => ({
                                        ...prev,
                                        [section.id]: { ...prev[section.id], assignee: value || null },
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="h-7 w-7 px-0 border-0 bg-transparent hover:bg-[#353535] hover:text-neutral-300">
                                      <User2
                                        className={cn(
                                          "h-4 w-4",
                                          newTaskData[section.id].assignee ? "text-violet-500" : "text-neutral-400",
                                        )}
                                      />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#353535] border-[#1a1a1a]">
                                      <SelectItem value="CX">CX</SelectItem>
                                      <SelectItem value="JD">JD</SelectItem>
                                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="date"
                                    value={newTaskData[section.id].dueDate}
                                    onChange={(e) =>
                                      setNewTaskData((prev) => ({
                                        ...prev,
                                        [section.id]: { ...prev[section.id], dueDate: e.target.value },
                                      }))
                                    }
                                    className="h-7 px-2 bg-transparent border-0 text-sm text-white hover:text-white focus:text-white"
                                  />
                                  <Select
                                    value={newTaskData[section.id].priority || "none"}
                                    onValueChange={(value) =>
                                      setNewTaskData((prev) => ({
                                        ...prev,
                                        [section.id]: { ...prev[section.id], priority: value as Task["priority"] },
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="h-7 px-2 border-0 bg-transparent hover:bg-[#353535] hover:text-neutral-300">
                                      <span className="text-sm">{newTaskData[section.id].priority || "Priority"}</span>
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
                                    className="h-7 px-2 hover:text-neutral-300"
                                    onClick={() => handleAddTask(section.id)}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                className="w-full justify-start text-neutral-500 hover:text-neutral-400 hover:bg-[#353535]"
                                onClick={() => handleCreateTask(section.id)}
                                data-add-task
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add task
                              </Button>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <Button
                variant="ghost"
                className="h-10 px-4 border border-dashed border-[#353535] text-neutral-500 hover:text-neutral-400 hover:bg-[#353535]/50 hover:border-neutral-600"
                onClick={addSection}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add section
              </Button>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <TaskDetails task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={handleTaskUpdate} />
    </>
  )
}

