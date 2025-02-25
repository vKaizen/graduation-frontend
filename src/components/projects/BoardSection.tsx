import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MoreHorizontal, Plus, User } from "lucide-react"

interface Task {
    id: string
    title: string
    assignee: string | null
}

interface BoardSectionProps {
    title: string
    tasks: Task[]
}

export function BoardSection({ title, tasks }: BoardSectionProps) {
    return (
        <div className="w-80 shrink-0">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white">{title}</h3>
                    <span className="text-xs text-gray-500">1</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>
            <div className="space-y-3">
                {tasks.map((task) => (
                    <Card key={task.id} className="p-3 bg-[#2f2d45] border-0">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-white">{task.title}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400">
                                <User className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
                <Button variant="ghost" className="w-full justify-start text-gray-400 h-auto py-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Add task
                </Button>
            </div>
        </div>
    )
}

