import { redirect } from "next/navigation";

// Make this a server component by removing "use client"
export default function WorkspaceDefaultPage({
  params,
}: {
  params: { workspaceId: string };
}) {
  const workspaceId = params.workspaceId;

  // Server-side redirect to the overview page
  if (workspaceId) {
    redirect(`/workspaces/${workspaceId}/overview`);
  }

  return null;
}
