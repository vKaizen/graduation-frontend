"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoalsLayout } from "@/components/insights/GoalsLayout";
import { GoalTableView } from "@/components/insights/GoalTableView";
import { Goal, GoalStatus } from "@/types";

// Sample team goals matching Goal interface
const SAMPLE_TEAM_GOALS: Goal[] = [
  {
    _id: "1",
    title: "Graduate",
    description: "Complete graduation requirements",
    progress: 0,
    ownerId: "user1",
    status: "no-status" as GoalStatus,
    isPrivate: true,
    timeframe: "Q2",
    timeframeYear: 2025,
    workspaceId: "workspace1",
    owner: {
      _id: "user1",
      email: "kai@example.com",
      fullName: "Kai",
    },
    children: [],
  },
];

export default function TeamGoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState(SAMPLE_TEAM_GOALS);

  const handleCreateGoal = () => {
    // Navigate to the new goal creation page
    router.push("/goals/new");
  };

  const handleGoalClick = (goal: Goal) => {
    // Navigate to goal details or expand
    console.log("Goal clicked:", goal);
  };

  return (
    <GoalsLayout
      workspaceName="My workspace"
      onCreateGoal={handleCreateGoal}
      showFilter={true}
      filterText="Filter: Teams"
    >
      <GoalTableView goals={goals} onGoalClick={handleGoalClick} />
    </GoalsLayout>
  );
}
