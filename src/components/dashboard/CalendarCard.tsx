import { cn } from "@/lib/utils"
import { BaseCard } from "./BaseCard"

export function CalendarCard() {
  return (
    <BaseCard title="Calendar">
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 31 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square rounded flex items-center justify-center text-sm",
              i % 7 === 0 || i % 7 === 6 ? "bg-gray-800 text-gray-400" : "bg-gray-700 text-white",
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </BaseCard>
  )
}

