import { ProjectView } from "@/components/projects/ProjectView";

export default async function Project({
  params,
}: Readonly<{ params: { projectId: string; view?: string[] } }>) {
  const projectId = params.projectId;
  const view = params.view?.[0];

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      <ProjectView projectId={projectId} view={view} />
    </div>
  );
}
