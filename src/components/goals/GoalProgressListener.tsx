"use client";

import { useEffect, useCallback } from "react";
import { useGoals } from "@/contexts/GoalContext";
import {
  updateTaskCompletionAndProgress,
  updateProjectStatusAndProgress,
  fetchGoals,
  calculateGoalProgress,
} from "@/api-service";

// Global tracking of recently updated tasks/projects
const recentUpdates = {
  lastTaskUpdate: 0,
  lastProjectUpdate: 0,
  updatingGoals: false,
};

// Component that listens for goal progress updates
export const GoalProgressListener = () => {
  const { goals, refreshGoal, updateGoalProgress } = useGoals();

  // Helper function to refresh all goals
  const refreshAllGoals = useCallback(async () => {
    if (recentUpdates.updatingGoals) return;

    try {
      recentUpdates.updatingGoals = true;
      console.log("Refreshing all goals progress");

      // Get all goals with task/project progress source
      const allGoals = await fetchGoals();

      for (const goal of allGoals) {
        if (
          goal.progressResource === "tasks" ||
          goal.progressResource === "projects"
        ) {
          const progress = await calculateGoalProgress(goal._id);
          updateGoalProgress(goal._id, progress);
        }
      }
    } catch (error) {
      console.error("Error refreshing goals:", error);
    } finally {
      recentUpdates.updatingGoals = false;
    }
  }, [updateGoalProgress]);

  // Patch the task completion method
  const patchTaskCompletionMethod = useCallback(() => {
    if (typeof window === "undefined") return;

    // Store original function if not already stored
    if (!(window as any).__originalUpdateTaskCompletion) {
      (window as any).__originalUpdateTaskCompletion =
        updateTaskCompletionAndProgress;
    }

    // Create patched version
    (window as any).updateTaskCompletionAndProgress = async (
      taskId: string,
      completionStatus: boolean,
      goalId?: string
    ) => {
      // Track that we've had a recent update
      recentUpdates.lastTaskUpdate = Date.now();

      // Call the original function
      const result = await (window as any).__originalUpdateTaskCompletion(
        taskId,
        completionStatus,
        goalId
      );

      // Update goals in context
      if (result.updatedGoals && result.updatedGoals.length > 0) {
        result.updatedGoals.forEach(
          (goalUpdate: { goalId: string; progress: number }) => {
            updateGoalProgress(goalUpdate.goalId, goalUpdate.progress);
          }
        );
      } else {
        // If no goals were updated, trigger a full refresh
        refreshAllGoals();
      }

      return result;
    };
  }, [updateGoalProgress, refreshAllGoals]);

  // Patch the project status method
  const patchProjectStatusMethod = useCallback(() => {
    if (typeof window === "undefined") return;

    // Store original function if not already stored
    if (!(window as any).__originalUpdateProjectStatus) {
      (window as any).__originalUpdateProjectStatus =
        updateProjectStatusAndProgress;
    }

    // Create patched version
    (window as any).updateProjectStatusAndProgress = async (
      projectId: string,
      completionStatus: boolean,
      goalId?: string
    ) => {
      // Track that we've had a recent update
      recentUpdates.lastProjectUpdate = Date.now();

      // Call the original function
      const result = await (window as any).__originalUpdateProjectStatus(
        projectId,
        completionStatus,
        goalId
      );

      // Update goals in context
      if (result.updatedGoals && result.updatedGoals.length > 0) {
        result.updatedGoals.forEach(
          (goalUpdate: { goalId: string; progress: number }) => {
            updateGoalProgress(goalUpdate.goalId, goalUpdate.progress);
          }
        );
      } else {
        // If no goals were updated, trigger a full refresh
        refreshAllGoals();
      }

      return result;
    };
  }, [updateGoalProgress, refreshAllGoals]);

  // Setup the patched methods and polling for updates
  useEffect(() => {
    // Patch the API methods
    patchTaskCompletionMethod();
    patchProjectStatusMethod();

    // Set up a periodic check for goal updates (every 5 seconds)
    const intervalId = setInterval(() => {
      const now = Date.now();
      const taskUpdateAge = now - recentUpdates.lastTaskUpdate;
      const projectUpdateAge = now - recentUpdates.lastProjectUpdate;

      // If there was a recent task or project update and we're not already updating
      if (
        (taskUpdateAge < 10000 || projectUpdateAge < 10000) &&
        !recentUpdates.updatingGoals
      ) {
        refreshAllGoals();
      }
    }, 5000);

    // Initial refresh
    refreshAllGoals();

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [patchTaskCompletionMethod, patchProjectStatusMethod, refreshAllGoals]);

  // This component doesn't render anything
  return null;
};
