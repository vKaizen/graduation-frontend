import { BaseCard } from "./BaseCard"

export function GoalsCard() {
  return (
    <BaseCard title="Goals">
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-2 bg-orange-400 rounded w-3/4"></div>
        </div>
        <div className="space-y-1">
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-2 bg-teal-400 rounded w-1/2"></div>
        </div>
        <div className="space-y-1">
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-2 bg-red-400 rounded w-1/4"></div>
        </div>
      </div>
    </BaseCard>
  )
}

