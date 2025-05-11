"use client";

import { useState } from "react";
import { GoalsLayout } from "@/components/insights/GoalsLayout";
import { MissionSection } from "@/components/insights/MissionSection";
import { GoalItem } from "@/components/insights/GoalItem";

// Sample data
const SAMPLE_GOALS = [
  {
    _id: "1",
    title: "Graduate",
    progress: 0,
    status: "off-track",
    dueDate: "2025-06-30",
    owner: "Kai",
  },
];

export default function GoalsOverviewPage() {
  const [goals, setGoals] = useState(SAMPLE_GOALS);

  const handleCreateGoal = () => {
    // Implement goal creation logic
    console.log("Create goal clicked");
  };

  return (
    <GoalsLayout workspaceName="My workspace" onCreateGoal={handleCreateGoal}>
      <MissionSection />

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-6 text-white">Goals</h2>

        <div className="grid grid-cols-1 gap-4">
          {goals.map((goal) => (
            <div
              key={goal._id}
              className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{goal.title}</h3>
                <div className="flex items-center">
                  <span className="text-gray-400 mr-2">No status • 0%</span>
                  <span className="text-yellow-500">⚡</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <button className="mr-2 text-gray-400 hover:text-white transition-colors">
                    1 sub-goal
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400">
                    <span className="mr-1">🔒</span>
                    Q2 FY25
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#4573D2] flex items-center justify-center text-white font-medium text-sm">
                    Ka
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GoalsLayout>
  );
}
