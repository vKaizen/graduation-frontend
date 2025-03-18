import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { fetchProjectData } from "@/lib/fetchProjectData";

export default async function Layout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: { projectId: string } }>) {
  const project = await fetchProjectData(params.projectId);
  console.log(project);
  return (
    <div className="flex flex-col h-screen bg-black">
      <ProjectHeader project={project} />

      <ProjectTabs projectId={params.projectId} />

      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}
