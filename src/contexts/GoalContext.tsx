"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Goal } from "@/types";
import { fetchGoals, fetchGoalById } from "@/api-service";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthCookie } from "@/lib/cookies";

type GoalContextType = {
  goals: Goal[];
  refreshGoal: (goalId: string) => Promise<Goal | null>;
  updateGoalProgress: (goalId: string, newProgress: number) => void;
  loading: boolean;
};

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const useGoals = () => {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error("useGoals must be used within a GoalProvider");
  }
  return context;
};

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Fetch all goals initially, but only if authenticated
  useEffect(() => {
    // Skip fetchGoals during initial render
    if (typeof window === 'undefined') return;
    
    const authToken = getAuthCookie();
    if (!authToken || !isAuthenticated) {
      // No token or not authenticated - don't even try to load goals
      console.log("GoalProvider: No auth token or not authenticated, skipping goal fetch");
      setLoading(false);
      return;
    }

    const loadGoals = async () => {
      try {
        console.log("GoalProvider: Attempting to load goals with auth token");
        setLoading(true);
        const fetchedGoals = await fetchGoals();
        setGoals(fetchedGoals);
        console.log(`GoalProvider: Successfully loaded ${fetchedGoals.length} goals`);
      } catch (error) {
        console.error("GoalProvider: Error loading goals:", error);
        // Silently fail - don't set error state as this might be expected during logout
        setGoals([]);
      } finally {
        setLoading(false);
      }
    };

    // Only load goals if we have a token and we're authenticated
    if (authToken && isAuthenticated) {
      loadGoals();
    }
  }, [isAuthenticated]); // Re-run when authentication state changes

  // Function to refresh a specific goal's data
  const refreshGoal = useCallback(
    async (goalId: string): Promise<Goal | null> => {
      // Skip if not authenticated or no token
      const authToken = getAuthCookie();
      if (!authToken || !isAuthenticated) return null;
      
      try {
        const updatedGoal = await fetchGoalById(goalId);

        // Update the goal in our local state
        setGoals((prevGoals) =>
          prevGoals.map((goal) => (goal._id === goalId ? updatedGoal : goal))
        );

        return updatedGoal;
      } catch (error) {
        console.error(`Error refreshing goal ${goalId}:`, error);
        return null;
      }
    },
    [isAuthenticated]
  );

  // Function to manually update a goal's progress in the local state
  const updateGoalProgress = useCallback(
    (goalId: string, newProgress: number) => {
      setGoals((prevGoals) =>
        prevGoals.map((goal) =>
          goal._id === goalId ? { ...goal, progress: newProgress } : goal
        )
      );
    },
    []
  );

  return (
    <GoalContext.Provider
      value={{ goals, refreshGoal, updateGoalProgress, loading }}
    >
      {children}
    </GoalContext.Provider>
  );
};
