import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MoreHorizontal, Plus } from "lucide-react"

// Sample people data
const people = [{ id: "1", email: "nourkattan7000@gmail.com", initials: "NO", color: "bg-pink-400" }]

export function PeopleCard() {
  return (
    <Card className="bg-[#1a1a1a] border-0 shadow-md h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-xl font-semibold text-white">People</h3>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
          <MoreHorizontal className="h-5 w-5" />
          <span className="sr-only">More options</span>
        </Button>
      </CardHeader>
      <CardContent>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 gap-3 mb-4 hover:bg-[#353535] hover:text-white p-2"
        >
          <div className="h-10 w-10 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </div>
          Invite
        </Button>
        <div className="space-y-2">
          {people.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className={person.color}>{person.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-white">nourkattan7000@gmail...</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

