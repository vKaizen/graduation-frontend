"use client"

import { useEffect, useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Filter,
  MoreHorizontal,
  Calendar,
  User2,
  CheckCircle2,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  assignee: string | null
  dueDate?: string
  priority?: "High" | "Medium" | "Low"
}

interface Section {
  id: string
  title: string
  tasks: Task[]
}

interface Project {
  id: string
  name: string
  color: string
  sections: Section[]
}

export function ProjectView({ projectId, view }: Readonly<{ projectId: string; view?: string }>) {
  const [activeView, setActiveView] = useState<string>("board")
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setActiveView(view ?? "board")

    setTimeout(() => {
      const projects: Record<string, Project> = {
        AboRas: {
          id: "AboRas",
          name: "AboRas",
          color: "bg-purple-500",
          sections: [
            {
              id: "section-1",
              title: "To Do",
              tasks: [
                {
                  id: "task-1",
                  title: "Design homepage",
                  assignee: "CX",
                  dueDate: "Feb 4",
                  priority: "Medium",
                },
                {
                  id: "task-2",
                  title: "Implement API",
                  assignee: "JD",
                  dueDate: "Saturday",
                  priority: "High",
                },
              ],
            },
            {
              id: "section-2",
              title: "In Progress",
              tasks: [
                {
                  id: "task-3",
                  title: "Database setup",
                  assignee: null,
                  priority: "Low",
                },
              ],
            },
          ],
        },
        // ... other projects
      }

      setProject(projects[projectId] || null)
      setLoading(false)
    }, 500)
  }, [projectId, view])

  const onDragEnd = (result: any) => {
    if (!project) return

    const { destination, source, type } = result

    // If dropped outside a droppable area
    if (!destination) return

    // If dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // Handle section reordering
    if (type === "section") {
      const newSections = Array.from(project.sections)
      const [removed] = newSections.splice(source.index, 1)
      newSections.splice(destination.index, 0, removed)

      setProject({
        ...project,
        sections: newSections,
      })
      return
    }

    // Handle task reordering
    const sourceSection = project.sections.find((section) => section.id === source.droppableId)
    const destSection = project.sections.find((section) => section.id === destination.droppableId)

    if (!sourceSection || !destSection) return

    // Create new arrays to avoid mutating state
    const newSourceTasks = Array.from(sourceSection.tasks)
    const newDestTasks = source.droppableId === destination.droppableId ? newSourceTasks : Array.from(destSection.tasks)

    // Remove from source array
    const [removed] = newSourceTasks.splice(source.index, 1)

    // Add to destination array
    if (source.droppableId === destination.droppableId) {
      newSourceTasks.splice(destination.index, 0, removed)
    } else {
      newDestTasks.splice(destination.index, 0, removed)
    }

    // Create new sections array with updated tasks
    const newSections = project.sections.map((section) => {
      if (section.id === source.droppableId) {
        return { ...section, tasks: newSourceTasks }
      }
      if (section.id === destination.droppableId) {
        return { ...section, tasks: newDestTasks }
      }
      return section
    })

    setProject({
      ...project,
      sections: newSections,
    })
  }

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  if (loading) {
    return <div className="text-neutral-400 text-center py-20">Loading project...</div>
  }

  if (!project) {
    return <div className="text-neutral-400 text-center py-20">Project not found</div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board Actions */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800">
            Sort
          </Button>
          <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800">
            Group
          </Button>
          <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Render Active View */}
      <div className="flex-1 p-6 overflow-x-auto">
        {activeView === "board" && (
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
                        >
                          <div className="flex items-center justify-between mb-4 text-neutral-300">
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-4 w-4 text-neutral-500 hover:text-neutral-400 cursor-grab active:cursor-grabbing" />
                              </div>
                              <h3 className="font-medium">{section.title}</h3>
                            </div>
                            <span className="text-sm text-neutral-500">{section.tasks.length}</span>
                          </div>
                          <Droppable droppableId={section.id} type="task">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                  "space-y-2",
                                  snapshot.isDraggingOver && "bg-neutral-800/30 rounded-lg p-2 -m-2",
                                )}
                              >
                                {section.tasks.map((task, index) => (
                                  <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={cn(
                                          "border border-[#262729] hover:bg-[#2c2d30] p-3 rounded-lg cursor-pointer group transition-colors",
                                          snapshot.isDragging && "shadow-lg",
                                        )}
                                      >
                                        <div className="flex items-start gap-3">
                                          <div {...provided.dragHandleProps}>
                                            <GripVertical className="h-4 w-4 mt-1 text-neutral-500 hover:text-neutral-400 cursor-grab active:cursor-grabbing" />
                                          </div>
                                          <CheckCircle2 className="h-4 w-4 mt-1 text-neutral-500 group-hover:text-neutral-400" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-neutral-200 text-sm mb-2">{task.title}</p>
                                            <div className="flex items-center gap-2">
                                              {task.priority && (
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
                                              )}
                                              {task.dueDate && (
                                                <span className="flex items-center gap-1 text-xs text-neutral-400">
                                                  <Calendar className="h-3 w-3" />
                                                  {task.dueDate}
                                                </span>
                                              )}
                                              {task.assignee && (
                                                <div className="flex items-center gap-1 text-xs text-neutral-400">
                                                  <div className="h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center text-white">
                                                    {task.assignee}
                                                  </div>
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
                              </div>
                            )}
                          </Droppable>
                          <Button
                            variant="ghost"
                            className="w-full mt-2 justify-start text-neutral-500 hover:text-neutral-400 hover:bg-neutral-800/50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add task
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <Button
                    variant="ghost"
                    className="h-10 px-4 border border-dashed border-neutral-700 text-neutral-500 hover:text-neutral-400 hover:bg-neutral-800/50 hover:border-neutral-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add section
                  </Button>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {activeView === "list" && (
          <div className="rounded-lg overflow-hidden">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky top-0 z-20  text-left p-3 text-neutral-400 font-medium border-b border-neutral-800">
                    Task name
                  </th>
                  <th className="sticky top-0 z-20  text-left p-3 text-neutral-400 font-medium border-b border-neutral-800">
                    Assignee
                  </th>
                  <th className="sticky top-0 z-20  text-left p-3 text-neutral-400 font-medium border-b border-neutral-800">
                    Due date
                  </th>
                  <th className="sticky top-0 z-20  text-left p-3 text-neutral-400 font-medium border-b border-neutral-800">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody>
                {project.sections.map((section) => (
                  <>
                    <tr key={`section-${section.id}`} className="group">
                      <td colSpan={4} className="p-2 border-b border-neutral-800">
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="flex items-center gap-2 text-neutral-300 hover:text-neutral-200"
                        >
                          {collapsedSections[section.id] ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="font-medium">{section.title}</span>
                          <span className="text-sm text-neutral-500">{section.tasks.length}</span>
                        </button>
                      </td>
                    </tr>
                    {!collapsedSections[section.id] &&
                      section.tasks.map((task) => (
                        <tr
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={cn(
                            "group hover:bg-[#262729] transition-colors",
                            selectedTaskId === task.id && "bg-[#0d2b4e] hover:bg-[#0d2b4e]",
                          )}
                        >
                          <td className="p-2 border-b border-neutral-800">
                            <div className="flex items-center gap-3 pl-8">
                              <CheckCircle2
                                className={cn(
                                  "h-4 w-4",
                                  selectedTaskId === task.id
                                    ? "text-neutral-400"
                                    : "text-neutral-500 group-hover:text-neutral-400",
                                )}
                              />
                              <span
                                className={cn(
                                  "text-sm",
                                  selectedTaskId === task.id
                                    ? "text-neutral-200"
                                    : "text-neutral-300 group-hover:text-neutral-200",
                                )}
                              >
                                {task.title}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 border-b border-neutral-800">
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
                              >
                                <User2 className="h-4 w-4 mr-2" />
                                Assign
                              </Button>
                            )}
                          </td>
                          <td className="p-2 border-b border-neutral-800">
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
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Set due date
                              </Button>
                            )}
                          </td>
                          <td className="p-2 border-b border-neutral-800">
                            {task.priority && (
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
                            )}
                          </td>
                        </tr>
                      ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

