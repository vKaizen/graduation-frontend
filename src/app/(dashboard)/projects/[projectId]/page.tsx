import { redirect } from "next/navigation";

export default function ProjectDefaultPage({ params }: { params: { projectId: string } }) {
    redirect(`/projects/${params.projectId}/board`);
}
