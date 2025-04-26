"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getUserPreferences, updateDashboardLayout } from "@/api-service";

// Define card types
export type CardType = "tasks" | "projects" | "people" | "goals" | "calendar";

// Define card interface
export interface DashboardCard {
  id: string;
  type: CardType;
  position: number;
  visible: boolean;
  title: string;
  fullWidth?: boolean;
}

// Initial cards configuration
const initialCards: DashboardCard[] = [
  {
    id: "tasks-card",
    type: "tasks",
    position: 0,
    visible: true,
    title: "My Tasks",
    fullWidth: false, // Changed to false to match other cards
  },
  {
    id: "projects-card",
    type: "projects",
    position: 1,
    visible: true,
    title: "Projects",
  },
  {
    id: "people-card",
    type: "people",
    position: 2,
    visible: true,
    title: "People",
  },
];

// Available card templates that can be added
export const availableCardTemplates: Omit<
  DashboardCard,
  "position" | "visible"
>[] = [
  {
    id: "tasks-card",
    type: "tasks",
    title: "My Tasks",
    fullWidth: false, // Changed to false to match other cards
  },
  {
    id: "projects-card",
    type: "projects",
    title: "Projects",
  },
  {
    id: "people-card",
    type: "people",
    title: "People",
  },
  {
    id: "goals-card",
    type: "goals",
    title: "Goals",
  },
  {
    id: "calendar-card",
    type: "calendar",
    title: "Calendar",
    fullWidth: true,
  },
];

// Define context type
interface DashboardContextType {
  cards: DashboardCard[];
  addCard: (cardType: CardType) => void;
  removeCard: (cardId: string) => void;
  reorderCards: (activeId: string, overId: string) => void;
  isCardVisible: (cardType: CardType) => boolean;
  toggleCardSize: (cardId: string, isFullWidth: boolean) => void;
}

// Create context
const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

// Provider component
export function DashboardProvider({ children }: { children: ReactNode }) {
  // Initialize with initial cards first to avoid hydration mismatch
  const [cards, setCards] = useState<DashboardCard[]>(initialCards);
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load cards from backend on first mount
  useEffect(() => {
    const loadCards = async () => {
      try {
        const preferences = await getUserPreferences();
        if (preferences?.uiPreferences?.dashboardLayout) {
          setCards(preferences.uiPreferences.dashboardLayout);
          console.log("Loaded dashboard layout from backend");
        } else {
          console.log(
            "No dashboard layout found in backend, using default layout"
          );
        }
      } catch (error) {
        console.error("Error loading cards from backend:", error);
        console.log("Using default dashboard layout due to backend error");
      } finally {
        setInitialized(true);
        setIsLoading(false);
      }
    };

    loadCards();
  }, []);

  // Save to backend when cards change
  useEffect(() => {
    const saveCards = async () => {
      if (initialized && !isLoading) {
        // Only save visible cards
        const visibleCards = cards.filter((card) => card.visible);

        if (visibleCards.length === 0) {
          console.log("No visible cards to save");
          return;
        }

        try {
          console.log("Saving dashboard layout to backend:", visibleCards);
          await updateDashboardLayout(visibleCards);
          console.log("Dashboard layout saved successfully to backend");
        } catch (error) {
          console.error("Error saving dashboard layout to backend:", error);
        }
      }
    };

    saveCards();
  }, [cards, initialized, isLoading]);

  // Add a new card
  const addCard = (cardType: CardType) => {
    const template = availableCardTemplates.find((t) => t.type === cardType);
    if (!template) return;

    // Check if card already exists but is hidden
    const existingCardIndex = cards.findIndex((c) => c.id === template.id);

    if (existingCardIndex >= 0) {
      // Card exists, make it visible
      setCards((prev) =>
        prev.map((card, i) =>
          i === existingCardIndex ? { ...card, visible: true } : card
        )
      );
    } else {
      // Add new card at the end
      const newPosition = cards.length;
      setCards((prev) => [
        ...prev,
        { ...template, position: newPosition, visible: true },
      ]);
    }
  };

  // Remove a card (hide it)
  const removeCard = (cardId: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, visible: false } : card
      )
    );
  };

  // Toggle card size (full width or half width)
  const toggleCardSize = (cardId: string, isFullWidth: boolean) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, fullWidth: isFullWidth } : card
      )
    );
  };

  // Reorder cards when dragged
  const reorderCards = (activeId: string, overId: string) => {
    setCards((cards) => {
      const oldIndex = cards.findIndex((card) => card.id === activeId);
      const newIndex = cards.findIndex((card) => card.id === overId);

      if (oldIndex === -1 || newIndex === -1) return cards;

      const newCards = [...cards];
      const [movedCard] = newCards.splice(oldIndex, 1);
      newCards.splice(newIndex, 0, movedCard);

      // Update positions
      return newCards.map((card, index) => ({
        ...card,
        position: index,
      }));
    });
  };

  // Check if a card type is currently visible
  const isCardVisible = (cardType: CardType) => {
    return cards.some((card) => card.type === cardType && card.visible);
  };

  return (
    <DashboardContext.Provider
      value={{
        cards,
        addCard,
        removeCard,
        reorderCards,
        isCardVisible,
        toggleCardSize,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook to use the dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
