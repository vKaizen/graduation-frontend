import { GreetingSection } from "@/components/dashboard/GreetingSection"
import { TasksCard } from "@/components/dashboard/TasksCard"
import { ProjectsCard } from "@/components/dashboard/ProjectsCard"
import { PeopleCard } from "@/components/dashboard/PeopleCard"

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <GreetingSection />
      <TasksCard />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <ProjectsCard />
        <PeopleCard />
      </div>
    </div>
  )
}

