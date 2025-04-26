import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BaseCard } from "./BaseCard";

// Sample people data
const people = [
  {
    id: "1",
    email: "nourkattan7000@gmail.com",
    initials: "NO",
    color: "bg-pink-400",
  },
];

interface PeopleCardProps {
  onRemove?: () => void;
  cardId?: string;
  isFullWidth?: boolean;
  onSizeChange?: (isFullWidth: boolean) => void;
}

export function PeopleCard({ 
  onRemove,
  cardId = "people-card",
  isFullWidth = false,
  onSizeChange
}: PeopleCardProps) {
  return (
    <BaseCard 
      title="People" 
      onRemove={onRemove}
      cardId={cardId}
      isFullWidth={isFullWidth}
      onSizeChange={onSizeChange}
    >
      <Button
        variant="ghost"
        className="w-full justify-start text-gray-400 gap-3 mb-4 hover:bg-white/5 p-2"
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
              <AvatarFallback className={person.color}>
                {person.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-white">nourkattan7000@gmail...</div>
            </div>
          </div>
        ))}
      </div>
    </BaseCard>
  );
}
