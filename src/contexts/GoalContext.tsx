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

type GoalContextType = {
  goals: Goal[];
  refreshGoal: (goalId: string) => Promise<Goal | null>;
  updateGoalProgress: (goalId: string, newProgress: number) => void;
  loading: boolean;
};

const GoalContext = createContext<GoalContextType | null>(null);

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
  const [loading, setLoading] = useState(true);

  // Fetch all goals initially
  useEffect(() => {
    const loadGoals = async () => {
      try {
        setLoading(true);
        const fetchedGoals = await fetchGoals();
        setGoals(fetchedGoals);
      } catch (error) {
        console.error("Error loading goals:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, []);

  // Function to refresh a specific goal's data
  const refreshGoal = useCallback(
    async (goalId: string): Promise<Goal | null> => {
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
    []
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
