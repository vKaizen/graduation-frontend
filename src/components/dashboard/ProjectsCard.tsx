import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MoreHorizontal, Plus, Settings } from "lucide-react"

export function ProjectsCard() {
    return (
        <Card className="bg-[#1a1a1a] border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-xl font-semibold text-white">Projects</h3>
                <Button variant="ghost" size="icon" className="text-gray-400">
                    <MoreHorizontal className="h-5 w-5" />
                </Button>
            </CardHeader>
            <CardContent>
                <Button variant="ghost" className="w-full justify-start gap-3 mb-4 text-white font-bold hover:bg-[#353535] hover:text-white p-2">
                    <div className="h-10 w-10 rounded border-2 border-dashed border-gray-600 flex items-center justify-center">
                        <Plus className="h-5 w-5" />
                    </div>
                    Create project
                </Button>
                <div className="space-y-4 ">
                    {[
                        { name: "AboRas", color: "bg-purple-400" },
                        { name: "Cross-functional project pl...", color: "bg-teal-400" },
                        { name: "9999", color: "bg-blue-400" },
                    ].map((project) => (
                        <Button key={project.name} variant="ghost" className="w-full justify-start text-white gap-3">
                            <div className={`h-10 w-10 rounded ${project.color} flex items-center justify-center`}>
                                <Settings className="h-5 w-5" />
                            </div>
                            {project.name}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

