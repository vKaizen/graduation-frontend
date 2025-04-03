import { Settings, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BaseCard } from "./BaseCard"

// Sample projects data
const projects = [
  { id: "1", name: "AboRas", color: "bg-purple-400" },
  { id: "2", name: "Cross-functional project pl...", color: "bg-teal-400" },
  { id: "3", name: "9999", color: "bg-blue-400" },
]

export function ProjectsCard() {
  return (
    <BaseCard title="Projects">
      <Button variant="ghost" className="w-full justify-start gap-3 mb-4 text-white font-medium hover:bg-white/5 p-2">
        <div className="h-10 w-10 rounded flex items-center justify-center border-2 border-dashed border-gray-600">
          <Plus className="h-5 w-5" />
        </div>
        Create project
      </Button>
      <div className="space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
          >
            <div className={`h-10 w-10 rounded ${project.color} flex items-center justify-center`}>
              <Settings className="h-5 w-5 text-white" />
            </div>
            <span className="text-white">{project.name}</span>
          </div>
        ))}
      </div>
    </BaseCard>
  )
}

