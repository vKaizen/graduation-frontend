import { cn } from "@/lib/utils";
import { BaseCard } from "./BaseCard";

interface CalendarCardProps {
  onRemove?: () => void;
  cardId?: string;
  isFullWidth?: boolean;
  onSizeChange?: (isFullWidth: boolean) => void;
}

export function CalendarCard({
  onRemove,
  cardId = "calendar-card",
  isFullWidth = false,
  onSizeChange,
}: CalendarCardProps) {
  return (
    <BaseCard
      title="Calendar"
      onRemove={onRemove}
      cardId={cardId}
      isFullWidth={isFullWidth}
      onSizeChange={onSizeChange}
    >
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 31 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square rounded flex items-center justify-center text-sm",
              i % 7 === 0 || i % 7 === 6
                ? "bg-gray-800 text-gray-400"
                : "bg-gray-700 text-white"
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </BaseCard>
  );
}
