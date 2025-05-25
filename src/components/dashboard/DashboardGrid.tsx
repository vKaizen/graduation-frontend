"use client";

import { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
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
  const [isClient, setIsClient] = useState(false);

  // Only enable client-side rendering after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only show visible cards
  const visibleCards = cards.filter((card) => card.visible);

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // If dropped outside the list or didn't move
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    // Get the dragged card ID
    const draggedCardId = visibleCards[source.index].id;
    // Get the card ID we dropped onto (or its position)
    const targetCardId = visibleCards[destination.index].id;

    // Call the reorder function
    reorderCards(draggedCardId, targetCardId);
  };

  // Use a simple grid for server-side rendering, and DnD for client-side
  if (!isClient) {
    return <SimpleGrid cards={cards} />;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="dashboard-grid" direction="vertical">
        {(provided) => (
          <div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-2"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {visibleCards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                      "transition-all duration-200 ease-in-out h-[350px]",
                      card.fullWidth ? "col-span-full" : "col-span-1",
                      snapshot.isDragging
                        ? "opacity-60 z-10"
                        : "opacity-100 z-1"
                    )}
                    style={{
                      ...provided.draggableProps.style,
                    }}
                  >
                    <CardRenderer
                      type={card.type}
                      onRemove={() => useDashboard().removeCard(card.id)}
                      cardId={card.id}
                      isFullWidth={!!card.fullWidth}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
