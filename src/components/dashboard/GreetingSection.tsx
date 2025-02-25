import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

// Dummy data
const dummyData = {
    currentUser: {
        name: "Ciitex",
        avatar: "https://example.com/avatar.jpg",
    },
    stats: {
        tasksCompleted: 1,
        collaborators: 0,
    },
    currentWeek: {
        startDate: "2023-05-01",
        endDate: "2023-05-07",
    },
}

export function GreetingSection() {
    const dateString = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    // Function to determine greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good morning"
        if (hour < 18) return "Good afternoon"
        return "Good evening"
    }

    return (
        <div className="text-center mb-8">
            <div className="text-gray-400 mb-2">{dateString}</div>
            <h1 className="text-4xl font-semibold text-white mb-6">
                {getGreeting()}, {dummyData.currentUser.name}
            </h1>

            <div className="flex items-center justify-center gap-4">
                <Button
                    variant="ghost"
                    className="bg-white/10 text-white hover:bg-white/20 rounded-full p-2 flex items-center justify-center"
                >
                    <span className="mr-2">My week</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </Button>
                <div className="bg-white/10 text-white px-4 py-2 rounded-full flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {dummyData.stats.tasksCompleted} task{dummyData.stats.tasksCompleted !== 1 ? "s" : ""} completed
                </div>
                <div className="bg-white/10 text-white px-4 py-2 rounded-full flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {dummyData.stats.collaborators} collaborator{dummyData.stats.collaborators !== 1 ? "s" : ""}
                </div>
            </div>
        </div>
    )
}

