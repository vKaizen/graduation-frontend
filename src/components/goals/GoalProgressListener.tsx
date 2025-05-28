"use client";

import { useEffect, useCallback } from "react";
import { useGoals } from "@/contexts/GoalContext";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthCookie } from "@/lib/cookies";
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
  const { isAuthenticated } = useAuth();

  // Helper function to refresh all goals
  const refreshAllGoals = useCallback(async () => {
    // Don't try to update if there's no auth token
    const authToken = getAuthCookie();
    if (recentUpdates.updatingGoals || !isAuthenticated || !authToken) return;

    try {
      recentUpdates.updatingGoals = true;
      console.log("GoalProgressListener: Refreshing all goals progress");

      // Get all goals with task/project progress source
      try {
        const allGoals = await fetchGoals();

        for (const goal of allGoals) {
          if (
            goal.progressResource === "tasks" ||
            goal.progressResource === "projects"
          ) {
            try {
              const progress = await calculateGoalProgress(goal._id);
              updateGoalProgress(goal._id, progress);
            } catch (goalError) {
              console.error(
                `Error calculating progress for goal ${goal._id}:`,
                goalError
              );
              // Continue with next goal
            }
          }
        }
      } catch (fetchError) {
        console.error("Error fetching goals in refreshAllGoals:", fetchError);
      }
    } catch (error) {
      console.error("GoalProgressListener: Error refreshing goals:", error);
    } finally {
      recentUpdates.updatingGoals = false;
    }
  }, [updateGoalProgress, isAuthenticated]);

  // Patch the task completion method
  const patchTaskCompletionMethod = useCallback(() => {
    // Don't try to patch if there's no auth token
    const authToken = getAuthCookie();
    if (typeof window === "undefined" || !isAuthenticated || !authToken) return;

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

      try {
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
      } catch (error) {
        console.error(
          "Error in patched updateTaskCompletionAndProgress:",
          error
        );
        // Return empty result to avoid breaking the UI
        return { task: null, updatedGoals: [] };
      }
    };
  }, [updateGoalProgress, refreshAllGoals, isAuthenticated]);

  // Patch the project status method
  const patchProjectStatusMethod = useCallback(() => {
    // Don't try to patch if there's no auth token
    const authToken = getAuthCookie();
    if (typeof window === "undefined" || !isAuthenticated || !authToken) return;

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

      try {
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
      } catch (error) {
        console.error(
          "Error in patched updateProjectStatusAndProgress:",
          error
        );
        // Return empty result to avoid breaking the UI
        return { project: null, updatedGoals: [] };
      }
    };
  }, [updateGoalProgress, refreshAllGoals, isAuthenticated]);

  // Setup the patched methods and polling for updates
  useEffect(() => {
    // Skip everything if we're not in a browser
    if (typeof window === "undefined") return;

    // Skip setting up listeners if not authenticated or no token
    const authToken = getAuthCookie();
    if (!isAuthenticated || !authToken) {
      console.log(
        "GoalProgressListener: No auth token or not authenticated, skipping setup"
      );
      return;
    }

    console.log("GoalProgressListener: Setting up goal progress listeners");

    // Patch the API methods
    patchTaskCompletionMethod();
    patchProjectStatusMethod();

    // Set up a periodic check for goal updates (every 5 seconds)
    const intervalId = setInterval(() => {
      // Skip if no longer authenticated or token is gone
      const currentToken = getAuthCookie();
      if (!isAuthenticated || !currentToken) {
        console.log(
          "GoalProgressListener: Lost authentication during interval, skipping update"
        );
        return;
      }

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

    // Initial refresh with a slight delay to ensure auth is fully established
    setTimeout(() => {
      if (isAuthenticated && getAuthCookie()) {
        refreshAllGoals();
      }
    }, 2000);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [
    patchTaskCompletionMethod,
    patchProjectStatusMethod,
    refreshAllGoals,
    isAuthenticated,
  ]);

  // This component doesn't render anything
  return null;
};
