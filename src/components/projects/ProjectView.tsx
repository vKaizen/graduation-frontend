"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal } from "lucide-react"

import { BoardView } from "./board-view"
import { ListView } from "./list-view"
import type { Project, Task } from "@/types"
import { addTask, fetchProject } from "@/api-service"
import { TaskFilters } from "./task-filters"

export function ProjectView({ projectId, view }: Readonly<{ projectId: string; view?: string }>) {
  const [activeView, setActiveView] = useState<string>("board")
  const [project, setProject] = useState<Project | null>(null)
  const [originalProject, setOriginalProject] = useState<Project | null>(null) // Store the original project data
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  useEffect(() => {
    setActiveView(view ?? "board")
    loadProject()
  }, [view])

  const loadProject = async () => {
    setLoading(true)
    const loadedProject = await fetchProject(projectId)
    setProject(loadedProject)
    setOriginalProject(loadedProject) // Save the original data
    setLoading(false)
  }

  const handleAddTask = async (sectionId: string, task: Omit<Task, "id">) => {
    if (!project || !originalProject) return

    const newTask = await addTask(project.id, sectionId, task)

    // Update both project and originalProject
    const updatedSections = project.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          tasks: [...section.tasks, newTask],
        }
      }
      return section
    })

    const updatedOriginalSections = originalProject.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          tasks: [...section.tasks, newTask],
        }
      }
      return section
    })

    setProject({
      ...project,
      sections: updatedSections,
    })

    setOriginalProject({
      ...originalProject,
      sections: updatedOriginalSections,
    })
  }

  const handleUpdateTask = async (sectionId: string, taskId: string, updatedTask: Partial<Task>) => {
    if (!project || !originalProject) return

    // Update both project and originalProject
    const updatedSections = project.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          tasks: section.tasks.map((task) => (task.id === taskId ? { ...task, ...updatedTask } : task)),
        }
      }
      return section
    })

    const updatedOriginalSections = originalProject.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          tasks: section.tasks.map((task) => (task.id === taskId ? { ...task, ...updatedTask } : task)),
        }
      }
      return section
    })

    setProject({
      ...project,
      sections: updatedSections,
    })

    setOriginalProject({
      ...originalProject,
      sections: updatedOriginalSections,
    })
  }

  const handleAddSection = () => {
    if (!project || !originalProject) return

    const newSection = {
      id: `section-${Date.now()}`,
      title: "New Section",
      tasks: [],
    }

    setProject({
      ...project,
      sections: [...project.sections, newSection],
    })

    setOriginalProject({
      ...originalProject,
      sections: [...originalProject.sections, newSection],
    })
  }

  const handleUpdateSectionName = (sectionId: string, newName: string) => {
    setProject((prevProject) => {
      if (!prevProject) return prevProject
      return {
        ...prevProject,
        sections: prevProject.sections.map((section) =>
          section.id === sectionId ? { ...section, title: newName } : section,
        ),
      }
    })

    setOriginalProject((prevProject) => {
      if (!prevProject) return prevProject
      return {
        ...prevProject,
        sections: prevProject.sections.map((section) =>
          section.id === sectionId ? { ...section, title: newName } : section,
        ),
      }
    })
  }

  const onDragEnd = (result: any) => {
    if (!project || !originalProject) return

    const { destination, source, type } = result

    if (!destination) return

    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    if (type === "section") {
      const newSections = Array.from(project.sections)
      const [removed] = newSections.splice(source.index, 1)
      newSections.splice(destination.index, 0, removed)

      const newOriginalSections = Array.from(originalProject.sections)
      const [removedOriginal] = newOriginalSections.splice(source.index, 1)
      newOriginalSections.splice(destination.index, 0, removedOriginal)

      setProject({
        ...project,
        sections: newSections,
      })

      setOriginalProject({
        ...originalProject,
        sections: newOriginalSections,
      })
      return
    }

    const sourceSection = project.sections.find((section) => section.id === source.droppableId)
    const destSection = project.sections.find((section) => section.id === destination.droppableId)

    if (!sourceSection || !destSection) return

    const newSourceTasks = Array.from(sourceSection.tasks)
    const newDestTasks = source.droppableId === destination.droppableId ? newSourceTasks : Array.from(destSection.tasks)

    const [removed] = newSourceTasks.splice(source.index, 1)

    if (source.droppableId === destination.droppableId) {
      newSourceTasks.splice(destination.index, 0, removed)
    } else {
      newDestTasks.splice(destination.index, 0, removed)
    }

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

  const handleFilterChange = useCallback(
    (filters: string[]) => {
      setActiveFilters(filters)

      if (!originalProject) return

      if (filters.length === 0) {
        // If no filters, restore original project data
        setProject(originalProject)
        return
      }

      // Helper function to check if a date is within this week or next week
      const isDateInThisWeek = (dateStr: string | undefined) => {
        if (!dateStr) return false

        // Try to parse the date string
        let date: Date | null = null

        // Handle different date formats
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // ISO format from date picker (YYYY-MM-DD)
          date = new Date(dateStr)
        } else {
          // Try to parse human-readable formats like "Mar 15" or "Saturday"
          try {
            date = new Date(dateStr)
          } catch (e) {
            console.log("Could not parse date:", dateStr)
            return false
          }
        }

        // If date is invalid, return false
        if (isNaN(date.getTime())) return false

        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
        startOfWeek.setHours(0, 0, 0, 0)

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday
        endOfWeek.setHours(23, 59, 59, 999)

        return date >= startOfWeek && date <= endOfWeek
      }

      const isDateInNextWeek = (dateStr: string | undefined) => {
        if (!dateStr) return false

        // Try to parse the date string
        let date: Date | null = null

        // Handle different date formats
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // ISO format from date picker (YYYY-MM-DD)
          date = new Date(dateStr)
        } else {
          // Try to parse human-readable formats
          try {
            date = new Date(dateStr)
          } catch (e) {
            console.log("Could not parse date:", dateStr)
            return false
          }
        }

        // If date is invalid, return false
        if (isNaN(date.getTime())) return false

        const now = new Date()
        const startOfNextWeek = new Date(now)
        startOfNextWeek.setDate(now.getDate() - now.getDay() + 7) // Next Sunday
        startOfNextWeek.setHours(0, 0, 0, 0)

        const endOfNextWeek = new Date(startOfNextWeek)
        endOfNextWeek.setDate(startOfNextWeek.getDate() + 6) // Next Saturday
        endOfNextWeek.setHours(23, 59, 59, 999)

        return date >= startOfNextWeek && date <= endOfNextWeek
      }

      // Apply filters to the original project data
      const filteredSections = originalProject.sections.map((section) => ({
        ...section,
        tasks: section.tasks.filter((task) => {
          // If no filters are active, show all tasks
          if (filters.length === 0) return true

          // Check each filter
          return filters.some((filter) => {
            switch (filter) {
              case "Incomplete tasks":
                return task.completed === false || task.completed === undefined
              case "Completed tasks":
                return task.completed === true
              case "Just my tasks":
                // Replace with your logic to determine current user
                return task.assignee === "CX" // Example: current user is CX
              case "Due this week":
                return isDateInThisWeek(task.dueDate)
              case "Due next week":
                return isDateInNextWeek(task.dueDate)
              default:
                return true
            }
          })
        }),
      }))

      setProject({
        ...originalProject,
        sections: filteredSections,
      })
    },
    [originalProject],
  )

  if (loading) {
    return <div className="text-neutral-400 text-center py-20">Loading project...</div>
  }

  if (!project) {
    return <div className="text-neutral-400 text-center py-20">Project not found</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-14 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200"
            onClick={() => {
              if (project?.sections.length > 0) {
                const firstSectionId = project.sections[0].id
                if (activeView === "board") {
                  const boardViewRef = document.querySelector(`[data-section-id="${firstSectionId}"]`)
                  if (boardViewRef) {
                    const addTaskButton = boardViewRef.querySelector("button[data-add-task]") as HTMLButtonElement
                    if (addTaskButton) {
                      addTaskButton.click()
                    }
                  }
                } else {
                  const firstSection = project.sections[0]
                  if (firstSection) {
                    handleAddTask(firstSection.id, { title: "New Task", description: "" })
                  }
                }
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <TaskFilters activeFilters={activeFilters} onFilterChange={handleFilterChange} />
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

      <div className="flex-1 p-6 overflow-x-auto">
        {activeView === "board" && (
          <BoardView
            project={project}
            onDragEnd={onDragEnd}
            addTask={handleAddTask}
            updateTask={handleUpdateTask}
            addSection={handleAddSection}
            updateSectionName={handleUpdateSectionName}
          />
        )}

        {activeView === "list" && (
          <ListView
            project={project}
            collapsedSections={collapsedSections}
            toggleSection={toggleSection}
            selectedTaskId={selectedTaskId}
            setSelectedTaskId={setSelectedTaskId}
            onDragEnd={onDragEnd}
            addSection={handleAddSection}
            updateSectionName={handleUpdateSectionName}
            addTask={handleAddTask}
            updateTask={handleUpdateTask}
          />
        )}
      </div>
    </div>
  )
}

