"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
import { DropResult } from "@hello-pangea/dnd";
import { getUserIdCookie } from "@/lib/cookies";
import { useRBAC } from "@/hooks/useRBAC";

import { BoardView } from "./board-view";
import { ListView } from "./list-view";
import { Overview } from "./overview";
import type { Project, Task } from "@/types";
import {
  addTask,
  fetchProject,
  createSection,
  updateSection,
  reorderSections,
  deleteSection,
  updateTask,
  deleteTask,
  moveTask,
  reorderTasks,
  updateProjectStatus,
} from "@/api-service";
import { TaskFilters } from "./task-filters";
import { SortMenu, type SortConfig } from "./sort-menu";

export function ProjectView({
  projectId,
  view,
}: Readonly<{ projectId: string; view?: string }>) {
  const [activeView, setActiveView] = useState<string>("board");
  const [project, setProject] = useState<Project | null>(null);
  const [originalProject, setOriginalProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeSort, setActiveSort] = useState<SortConfig | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  const { checkPermission } = useRBAC();
  const canEditProject = project
    ? checkPermission("edit", "project", { project })
    : false;
  const canEditTasks = project
    ? checkPermission("edit", "task", { project })
    : false;

  const handleSortChange = useCallback(
    (sortConfig: SortConfig | null) => {
      setActiveSort(sortConfig);

      if (!originalProject || !sortConfig) {
        // If sorting is cleared, restore the original project (with filters applied)
        handleFilterChange(activeFilters);
        return;
      }

      // Apply sorting to each section's tasks
      const sortedSections =
        project?.sections.map((section) => ({
          ...section,
          tasks: sortTasks(section.tasks, sortConfig),
        })) || [];

      setProject((prev) =>
        prev
          ? {
              ...prev,
              sections: sortedSections,
            }
          : null
      );
    },
    [originalProject, project, activeFilters]
  );

  const handleProjectStatusUpdate = async (status?: string) => {
    // If status is not provided, we're just updating the local state
    // Don't reload the entire project to avoid flickering
    if (!status) {
      return;
    }

    try {
      // Prepare the status data for the API call
      const statusData = { status };

      // Call the API to update the project status
      if (project?._id) {
        // Update in the database
        const updatedProject = await updateProjectStatus(
          project._id,
          statusData
        );

        console.log(`Updated project status to: ${status}`);

        // Update just the status property in the local state without refreshing everything
        setProject((prev) => {
          if (!prev) return updatedProject;
          return {
            ...prev,
            status,
          };
        });

        setOriginalProject((prev) => {
          if (!prev) return updatedProject;
          return {
            ...prev,
            status,
          };
        });
      }
    } catch (error) {
      console.error("Error updating project status:", error);
    }
  };

  const handleFilterChange = useCallback(
    (filters: string[]) => {
      setActiveFilters(filters);
      if (!originalProject) return;

      const applyFilters = () => {
        // Helper functions for date checking
        const isDateInThisWeek = (dateStr: string | undefined) => {
          if (!dateStr) return false;
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return false;
          const now = new Date();
          const startOfWeek = new Date(
            now.setDate(now.getDate() - now.getDay())
          );
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return date >= startOfWeek && date <= endOfWeek;
        };

        const isDateInNextWeek = (dateStr: string | undefined) => {
          if (!dateStr) return false;
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return false;
          const now = new Date();
          const startOfNextWeek = new Date(
            now.setDate(now.getDate() - now.getDay() + 7)
          );
          const endOfNextWeek = new Date(startOfNextWeek);
          endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
          return date >= startOfNextWeek && date <= endOfNextWeek;
        };

        // Apply filters
        const filteredSections = originalProject.sections.map((section) => ({
          ...section,
          tasks: section.tasks.filter((task) => {
            if (filters.length === 0) return true;
            return filters.some((filter) => {
              switch (filter) {
                case "Incomplete tasks":
                  return !task.completed;
                case "Completed tasks":
                  return task.completed;
                case "Just my tasks":
                  return task.assignee === getUserIdCookie();
                case "Due this week":
                  return isDateInThisWeek(task.dueDate);
                case "Due next week":
                  return isDateInNextWeek(task.dueDate);
                default:
                  return true;
              }
            });
          }),
        }));

        setProject({
          ...originalProject,
          sections: filteredSections,
        });
      };

      applyFilters();
    },
    [originalProject]
  );

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add retry logic for token availability
      let retryCount = 0;
      const maxRetries = 3;
      let loadedProject = null;

      while (retryCount < maxRetries) {
        try {
          loadedProject = await fetchProject(projectId);
          break; // If successful, exit the retry loop
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "No authentication token found" &&
            retryCount < maxRetries - 1
          ) {
            console.log(`Retry ${retryCount + 1}: Waiting for auth token...`);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
            retryCount++;
            continue;
          }
          throw error; // Re-throw if it's not a token error or we're out of retries
        }
      }

      if (!loadedProject) {
        setError("Failed to load project: Project data is null or undefined");
        return;
      }

      // Sort tasks by order for proper initial display
      if (loadedProject.sections) {
        loadedProject.sections = loadedProject.sections.map((section) => ({
          ...section,
          tasks: section.tasks.sort((a, b) => {
            if (typeof a.order === "number" && typeof b.order === "number") {
              return a.order - b.order;
            }
            return 0;
          }),
        }));
      }

      console.log("ProjectView - Loaded project data:", {
        id: loadedProject._id,
        sections: loadedProject.sections?.map((section) => ({
          id: section._id,
          title: section.title,
          taskCount: section.tasks?.length || 0,
          tasks: section.tasks,
        })),
      });

      setProject(loadedProject);
      setOriginalProject(loadedProject);
    } catch (error) {
      console.error("Error loading project:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load project"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveView(view ?? "board");
    loadProject();
  }, [projectId, view]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg text-red-500 mb-4">{error}</div>
        <Button onClick={loadProject}>Retry</Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">Project not found</div>
      </div>
    );
  }

  const handleAddTask = async (sectionId: string, task: Omit<Task, "_id">) => {
    if (!project || !originalProject) return;

    try {
      const userId = getUserIdCookie();
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const newTask = await addTask(project._id, sectionId, {
        ...task,
        createdBy: userId,
      });

      // Update both project and originalProject
      const updatedSections = project.sections.map((section) => {
        if (section._id === sectionId) {
          return {
            ...section,
            tasks: [...section.tasks, newTask],
          };
        }
        return section;
      });

      const updatedOriginalSections = originalProject.sections.map(
        (section) => {
          if (section._id === sectionId) {
            return {
              ...section,
              tasks: [...section.tasks, newTask],
            };
          }
          return section;
        }
      );

      setProject({
        ...project,
        sections: updatedSections,
      });

      setOriginalProject({
        ...originalProject,
        sections: updatedOriginalSections,
      });
    } catch (error) {
      console.error("Error adding task:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleUpdateTask = async (
    sectionId: string,
    taskId: string,
    updatedTask: Partial<Task>
  ) => {
    if (!project || !originalProject) return;

    try {
      console.log("🔍 [ProjectView] handleUpdateTask called with:", {
        sectionId,
        taskId,
        updatedTask,
      });

      // Call the API to update the task - passing only taskId and updatedTask to the API
      const updatedTaskData = await updateTask(taskId, updatedTask);

      console.log(
        "🔍 [ProjectView] Task successfully updated, received:",
        updatedTaskData
      );

      // Create a copy of the project sections for immediate UI update
      const updatedSections = project.sections.map((section) => {
        // Find all instances of this task in any section
        if (section.tasks.some((t) => t._id === taskId)) {
          return {
            ...section,
            tasks: section.tasks.map((task) =>
              task._id === taskId ? { ...task, ...updatedTaskData } : task
            ),
          };
        }
        return section;
      });

      // Update both project and originalProject with the response from the API
      setProject({
        ...project,
        sections: updatedSections,
      });

      // Also update originalProject to ensure filters and sorts work correctly
      const updatedOriginalSections = originalProject.sections.map(
        (section) => {
          if (section.tasks.some((t) => t._id === taskId)) {
            return {
              ...section,
              tasks: section.tasks.map((task) =>
                task._id === taskId ? { ...task, ...updatedTaskData } : task
              ),
            };
          }
          return section;
        }
      );

      setOriginalProject({
        ...originalProject,
        sections: updatedOriginalSections,
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleAddSection = async () => {
    if (!project || !originalProject) return;

    try {
      const newSection = await createSection(project._id, "New Section");

      setProject({
        ...project,
        sections: [...project.sections, newSection],
      });

      setOriginalProject({
        ...originalProject,
        sections: [...originalProject.sections, newSection],
      });

      // Set the new section in edit mode immediately
      setEditingSectionId(newSection._id);
    } catch (error) {
      console.error("Error creating section:", error);
    }
  };

  const handleUpdateSectionName = async (
    sectionId: string,
    newName: string
  ) => {
    if (!project) return;

    try {
      const updatedSection = await updateSection(project._id, sectionId, {
        title: newName,
      });
      console.log("Section updated:", updatedSection);

      // Find the existing section to preserve its tasks
      const existingSection = project.sections.find(
        (section) => section._id === sectionId
      );

      if (!existingSection) {
        console.error("Section not found:", sectionId);
        return;
      }

      // Merge the updated section with existing tasks
      const mergedSection = {
        ...updatedSection,
        tasks: existingSection.tasks,
      };

      setProject((prevProject) => {
        if (!prevProject) return prevProject;
        return {
          ...prevProject,
          sections: prevProject.sections.map((section) =>
            section._id === sectionId ? mergedSection : section
          ),
        };
      });

      setOriginalProject((prevProject) => {
        if (!prevProject) return prevProject;
        return {
          ...prevProject,
          sections: prevProject.sections.map((section) =>
            section._id === sectionId ? mergedSection : section
          ),
        };
      });
    } catch (error) {
      console.error("Failed to update section:", error);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!project || !project._id || !sectionId) {
      console.error("Cannot delete section: Missing project or section ID");
      return;
    }

    try {
      console.log("Attempting to delete section:", {
        projectId: project._id,
        sectionId,
      });
      await deleteSection(project._id, sectionId);
      console.log("Section deleted successfully");

      // Update local state to remove the deleted section
      setProject((prev) => {
        if (!prev) return null;
        const updatedProject = {
          ...prev,
          sections: prev.sections.filter(
            (section) => section._id !== sectionId
          ),
        };
        console.log("Updated project state:", updatedProject);
        return updatedProject;
      });

      setOriginalProject((prev) => {
        if (!prev) return null;
        const updatedOriginalProject = {
          ...prev,
          sections: prev.sections.filter(
            (section) => section._id !== sectionId
          ),
        };
        console.log("Updated original project state:", updatedOriginalProject);
        return updatedOriginalProject;
      });
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  const handleDeleteTask = async (sectionId: string, taskId: string) => {
    if (!project || !originalProject) return;

    try {
      await deleteTask(taskId);

      // Update both project and originalProject
      const updatedSections = project.sections.map((section) => {
        if (section._id === sectionId) {
          return {
            ...section,
            tasks: section.tasks.filter((task) => task._id !== taskId),
          };
        }
        return section;
      });

      const updatedOriginalSections = originalProject.sections.map(
        (section) => {
          if (section._id === sectionId) {
            return {
              ...section,
              tasks: section.tasks.filter((task) => task._id !== taskId),
            };
          }
          return section;
        }
      );

      setProject({
        ...project,
        sections: updatedSections,
      });

      setOriginalProject({
        ...originalProject,
        sections: updatedOriginalSections,
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source } = result;

    if (!destination || !project) return;

    // If dropped in the same spot
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle section reordering
    if (result.type === "section") {
      const newSections = Array.from(project.sections);
      const [removed] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, removed);

      // Optimistically update UI
      setProject({
        ...project,
        sections: newSections,
      });

      try {
        await reorderSections(
          project._id,
          newSections.map((section) => section._id)
        );
      } catch (error) {
        console.error("Error reordering sections:", error);
        // Revert to original state if API call fails
        setProject(originalProject);
      }
      return;
    }

    // Handle task movement
    const sourceSection = project.sections.find(
      (section) => section._id === source.droppableId
    );
    const destSection = project.sections.find(
      (section) => section._id === destination.droppableId
    );

    if (!sourceSection || !destSection) return;

    // Create copies of the task arrays
    const newSourceTasks = Array.from(sourceSection.tasks);
    const newDestTasks =
      source.droppableId === destination.droppableId
        ? newSourceTasks
        : Array.from(destSection.tasks);

    // Remove the task from source
    const [removed] = newSourceTasks.splice(source.index, 1);

    // Insert the task at the destination with the correct order
    if (source.droppableId === destination.droppableId) {
      // Same section - just reorder
      newSourceTasks.splice(destination.index, 0, removed);
    } else {
      // Different section - move to new section at the exact position dropped
      // Set the task's section property to the destination section
      removed.section = destination.droppableId;

      // Insert at the exact destination index (not at the end)
      newDestTasks.splice(destination.index, 0, removed);
    }

    // Update the order property of tasks based on their new indices
    // This is crucial for real-time visual updating
    if (source.droppableId === destination.droppableId) {
      // Update order in the same section
      newSourceTasks.forEach((task, index) => {
        task.order = index;
      });
    } else {
      // Update order in both sections
      newSourceTasks.forEach((task, index) => {
        task.order = index;
      });
      newDestTasks.forEach((task, index) => {
        task.order = index;
      });
    }

    // Create new sections array for optimistic update
    const newSections = project.sections.map((section) => {
      if (section._id === source.droppableId) {
        return { ...section, tasks: newSourceTasks };
      }
      if (section._id === destination.droppableId) {
        return { ...section, tasks: newDestTasks };
      }
      return section;
    });

    // Store the current state before update
    const previousState = project;

    // Optimistically update UI with the new order values
    setProject({
      ...project,
      sections: newSections,
    });

    // Also update originalProject to ensure filters work correctly
    setOriginalProject({
      ...originalProject,
      sections: newSections,
    });

    try {
      if (source.droppableId === destination.droppableId) {
        // If tasks were reordered within the same section, update the order in the database
        console.log("Reordering tasks within section:", source.droppableId);
        console.log(
          "New task order:",
          newSourceTasks.map((task) => task._id)
        );

        await reorderTasks(
          source.droppableId,
          newSourceTasks.map((task) => task._id)
        );
      } else {
        // If task was moved to a different section, use moveTask
        console.log("Moving task between sections");
        console.log("Task ID:", removed._id);
        console.log("New section:", destination.droppableId);
        console.log("New order:", destination.index);

        // Move the task to the exact destination index, not just appending to the end
        await moveTask(removed._id, destination.droppableId, destination.index);

        // After moving the task, also reorder all tasks in the destination section
        // to ensure they have the correct order values in the database
        await reorderTasks(
          destination.droppableId,
          newDestTasks.map((task) => task._id)
        );
      }
    } catch (error) {
      console.error("Error updating task position:", error);
      // Revert to previous state if API call fails
      setProject(previousState);
      setOriginalProject(previousState);
    }
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Sorting function for tasks
  const sortTasks = (tasks: Task[], sortConfig: SortConfig | null) => {
    if (!sortConfig) return tasks;

    return [...tasks].sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;

      switch (sortConfig.option) {
        case "title":
          return a.title.localeCompare(b.title) * direction;

        case "dueDate":
          // Handle null or undefined due dates
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1 * direction;
          if (!b.dueDate) return -1 * direction;
          return (
            (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) *
            direction
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
          return (aPriority - bPriority) * direction;
        }

        case "assignee":
          // Handle null assignees
          if (!a.assignee && !b.assignee) return 0;
          if (!a.assignee) return 1 * direction;
          if (!b.assignee) return -1 * direction;
          return a.assignee.localeCompare(b.assignee) * direction;

        // For dateCreated and dateUpdated, we would need these fields in the Task type
        // For now, we'll just return the original order
        default:
          return 0;
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Show the header bar with controls only for board and list views */}
      {(activeView === "board" || activeView === "list") && (
        <div className="flex items-center justify-between px-4 h-14 border-b border-neutral-800 bg-[#121212]">
          <div className="flex items-center gap-2">
            {canEditTasks && (
              <Button
                variant="outline"
                className="text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200"
                onClick={() => {
                  if (project?.sections.length > 0) {
                    const firstSectionId = project.sections[0]._id;
                    if (activeView === "board" || activeView === "list") {
                      const sectionRef = document.querySelector(
                        `[data-section-id="${firstSectionId}"]`
                      );
                      if (sectionRef) {
                        const addTaskButton = sectionRef.querySelector(
                          "button[data-add-task]"
                        ) as HTMLButtonElement;
                        if (addTaskButton) {
                          addTaskButton.click();
                        }
                      }
                    }
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add task
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TaskFilters
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
            />
            <SortMenu activeSort={activeSort} onSortChange={handleSortChange} />
          </div>
        </div>
      )}

      <div
        className={`flex-1 bg-[#121212] ${
          activeView === "overview" ? "h-full" : "p-6 overflow-x-auto"
        }`}
      >
        {activeView === "board" && (
          <BoardView
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
            deleteSection={handleDeleteSection}
            deleteTask={handleDeleteTask}
            activeSort={activeSort}
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
            deleteSection={handleDeleteSection}
            deleteTask={handleDeleteTask}
            activeSort={activeSort}
          />
        )}

        {activeView === "overview" && (
          <Overview
            project={project}
            updateProjectStatus={handleProjectStatusUpdate}
          />
        )}
      </div>
    </div>
  );
}
