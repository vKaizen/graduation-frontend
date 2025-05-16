"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoalsLayout } from "@/components/insights/GoalsLayout";
import { MissionSection } from "@/components/insights/MissionSection";

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

// Reusable Avatar component
const Avatar = ({ initials }: { initials: string }) => (
  <div className="w-9 h-9 rounded-full bg-[#4573D2] flex items-center justify-center text-white font-semibold text-base leading-none">
    {initials}
  </div>
);

export default function GoalsOverviewPage() {
  const [goals] = useState(SAMPLE_GOALS);
  const router = useRouter();

  const handleCreateGoal = () => {
    // Implement goal creation logic
    console.log("Create goal clicked");
  };

  const handleGoalClick = (goalId: string) => {
    router.push(`/insights/goals/${goalId}`);
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
              className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-4 cursor-pointer hover:bg-[#252525] transition-colors"
              onClick={() => handleGoalClick(goal._id)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">{goal.title}</h3>
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
                  <Avatar initials={goal.owner.slice(0, 2)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GoalsLayout>
  );
}
