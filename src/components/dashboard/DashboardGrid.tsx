"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TasksCard } from "./TasksCard";
import { ProjectsCard } from "./ProjectsCard";
import { PeopleCard } from "./PeopleCard";
import { GoalsCard } from "./GoalsCard";
import { CalendarCard } from "./CalendarCard";
import { useDashboard, type DashboardCard } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";

// Component to render the appropriate card based on type
function CardRenderer({
  type,
  onRemove,
  cardId,
  isFullWidth,
}: {
  type: string;
  onRemove: () => void;
  cardId: string;
  isFullWidth: boolean;
}) {
  const { toggleCardSize } = useDashboard();

  const handleSizeChange = (isFullSize: boolean) => {
    toggleCardSize(cardId, isFullSize);
  };

  return (
    <div className="h-full">
      {type === "tasks" && (
        <TasksCard
          onRemove={onRemove}
          cardId={cardId}
          isFullWidth={isFullWidth}
          onSizeChange={handleSizeChange}
        />
      )}
      {type === "projects" && (
        <ProjectsCard
          onRemove={onRemove}
          cardId={cardId}
          isFullWidth={isFullWidth}
          onSizeChange={handleSizeChange}
        />
      )}
      {type === "people" && (
        <PeopleCard
          onRemove={onRemove}
          cardId={cardId}
          isFullWidth={isFullWidth}
          onSizeChange={handleSizeChange}
        />
      )}
      {type === "goals" && (
        <GoalsCard
          onRemove={onRemove}
          cardId={cardId}
          isFullWidth={isFullWidth}
          onSizeChange={handleSizeChange}
        />
      )}
      {type === "calendar" && (
        <CalendarCard
          onRemove={onRemove}
          cardId={cardId}
          isFullWidth={isFullWidth}
          onSizeChange={handleSizeChange}
        />
      )}
    </div>
  );
}

// Sortable card wrapper
function SortableCard({ card }: { card: DashboardCard }) {
  const { removeCard } = useDashboard();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    height: "350px", // Fixed height to match BaseCard
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-all duration-200 ease-in-out h-[350px]",
        card.fullWidth ? "col-span-full" : "col-span-1"
      )}
      {...attributes}
      {...listeners}
    >
      <CardRenderer
        type={card.type}
        onRemove={() => removeCard(card.id)}
        cardId={card.id}
        isFullWidth={!!card.fullWidth}
      />
    </div>
  );
}

// Simple grid for server-side rendering
function SimpleGrid({ cards }: { cards: DashboardCard[] }) {
  const visibleCards = cards.filter((card) => card.visible);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      {visibleCards.map((card) => (
        <div
          key={card.id}
          className={cn(
            "h-[350px]",
            card.fullWidth ? "col-span-full" : "col-span-1"
          )}
        >
          <CardRenderer
            type={card.type}
            onRemove={() => {}}
            cardId={card.id}
            isFullWidth={!!card.fullWidth}
          />
        </div>
      ))}
    </div>
  );
}

// Main dashboard grid component
export function DashboardGrid() {
  const { cards, reorderCards } = useDashboard();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Only enable client-side rendering after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only show visible cards
  const visibleCards = cards.filter((card) => card.visible);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    })
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderCards(active.id as string, over.id as string);
    }

    setActiveId(null);
  };

  // Find the active card for overlay
  const activeCard = activeId
    ? cards.find((card) => card.id === activeId)
    : null;

  // Use a simple grid for server-side rendering, and DnD for client-side
  if (!isClient) {
    return <SimpleGrid cards={cards} />;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={visibleCards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {visibleCards.map((card) => (
            <SortableCard key={card.id} card={card} />
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay for visual feedback */}
      <DragOverlay adjustScale={false}>
        {activeId && activeCard && (
          <div
            className={cn(
              "opacity-80 h-[350px]",
              activeCard.fullWidth ? "w-full" : "w-[calc(50%-0.5rem)]"
            )}
          >
            <CardRenderer
              type={activeCard.type}
              onRemove={() => {}}
              cardId={activeCard.id}
              isFullWidth={!!activeCard.fullWidth}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
