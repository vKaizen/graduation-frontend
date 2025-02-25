import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreHorizontal } from "lucide-react"

export function TasksCard() {
    return (
        <Card className="bg-[#1a1a1a]">
            < CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" >
                <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-WUXcKQSumnMERmyMj9qQSP48QcRvJY.png" />
                        <AvatarFallback>CI</AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-semibold text-white">My tasks</h3>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-400">
                    <MoreHorizontal className="h-5 w-5" />
                </Button>
            </CardHeader >
            <CardContent>
                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="bg-transparent w-full justify-start h-auto p-0 mb-4 ">
                        <TabsTrigger
                            value="upcoming"
                            className="text-gray-400  data-[state=active]:border-white data-[state=active]:text-white rounded-lg  px-4 py-2"
                        >
                            Upcoming
                        </TabsTrigger>
                        <TabsTrigger
                            value="overdue"
                            className="text-gray-400 border-transparent data-[state=active]:border-white data-[state=active]:text-white rounded-lg bg-transparent px-4 py-2"
                        >
                            Overdue (1)
                        </TabsTrigger>
                        <TabsTrigger
                            value="completed"
                            className="text-gray-400 border-transparent data-[state=active]:border-white data-[state=active]:text-white rounded-lg bg-transparent px-4 py-2"
                        >
                            Completed
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="upcoming" className="mt-0">
                        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-full border-2 border-gray-500 group-hover:border-white" />
                                <span className="text-white">Draft project brief</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded bg-teal-400/20 text-teal-400 text-xs">Cross-functional</span>
                                <span className="text-gray-400 text-sm">Oct 15, 2024</span>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card >
    )
}

