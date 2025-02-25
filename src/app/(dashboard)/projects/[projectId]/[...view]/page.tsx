import { ProjectView } from "@/components/projects/ProjectView";

export default function Project({ params }: Readonly<{ params: { projectId: string; view?: string[] } }>) {
    return (
        <div className="flex flex-col h-screen bg-black overflow-hidden">
            <ProjectView projectId={params.projectId} view={params.view?.[0]} />
        </div>
    );
}
