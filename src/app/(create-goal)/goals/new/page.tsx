"use client";

import { NewGoalForm } from "@/components/insights/new-goal-form";
import { PermissionGuard } from "@/components/permission/PermissionGuard";
import { useSearchParams } from "next/navigation";

export default function NewGoalPage() {
  console.log("Rendering NewGoalPage");
  const searchParams = useSearchParams();
  const goalType = searchParams.get("type");

  // For workspace goals, we require admin/owner permissions
  // For personal goals, anyone can create
  const requiresPermissionCheck = goalType === "workspace";

  return requiresPermissionCheck ? (
    <PermissionGuard action="create" resource="goal">
      <NewGoalForm />
    </PermissionGuard>
  ) : (
    <NewGoalForm />
  );
}
