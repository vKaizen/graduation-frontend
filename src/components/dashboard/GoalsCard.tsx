import { BaseCard } from "./BaseCard";

interface GoalsCardProps {
  onRemove?: () => void;
  cardId?: string;
  isFullWidth?: boolean;
  onSizeChange?: (isFullWidth: boolean) => void;
}

export function GoalsCard({
  onRemove,
  cardId = "goals-card",
  isFullWidth = false,
  onSizeChange,
}: GoalsCardProps) {
  return (
    <BaseCard
      title="Goals"
      onRemove={onRemove}
      cardId={cardId}
      isFullWidth={isFullWidth}
      onSizeChange={onSizeChange}
    >
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
  );
}
