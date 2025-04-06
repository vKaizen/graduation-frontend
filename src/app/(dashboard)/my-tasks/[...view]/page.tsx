import { MyTasksView } from "@/components/my-tasks/MyTasksView";

export default function MyTasksPage({
  params,
}: Readonly<{ params: { view: string[] } }>) {
  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      <MyTasksView view={params.view?.[0]} />
    </div>
  );
}
