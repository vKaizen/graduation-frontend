import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MoreHorizontal, Plus, Settings } from "lucide-react"

// Sample projects data
const projects = [
  { id: "1", name: "AboRas", color: "bg-purple-400" },
  { id: "2", name: "Cross-functional project pl...", color: "bg-teal-400" },
  { id: "3", name: "9999", color: "bg-blue-400" },
]

export function ProjectsCard() {
  return (
    <Card className="bg-[#1a1a1a] border-0 shadow-md h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-xl font-semibold text-white">Projects</h3>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
          <MoreHorizontal className="h-5 w-5" />
          <span className="sr-only">More options</span>
        </Button>
      </CardHeader>
      <CardContent>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 mb-4 text-white font-bold hover:bg-[#353535] hover:text-white p-2"
        >
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
      </CardContent>
    </Card>
  )
}

