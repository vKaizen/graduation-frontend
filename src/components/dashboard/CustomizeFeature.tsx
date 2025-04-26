"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LayoutGrid, ChevronRight, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useDashboard,
  type CardType,
  availableCardTemplates,
} from "@/contexts/DashboardContext";

interface CustomizeFeatureProps {
  onBackgroundChange?: (color: string) => void;
}

// Background color options with more vibrant colors
const backgroundColors = [
  { id: "purple", color: "bg-purple-800" },
  { id: "orange", color: "bg-orange-500" },
  { id: "lime", color: "bg-lime-400" },
  { id: "teal", color: "bg-teal-700" },
  { id: "turquoise", color: "bg-cyan-500" },
  { id: "lightblue", color: "bg-cyan-200" },
  { id: "blue", color: "bg-blue-500" },
  { id: "lavender", color: "bg-purple-400" },
  { id: "purple2", color: "bg-purple-500" },
  { id: "pink", color: "bg-pink-300" },
  { id: "white", color: "bg-gray-100" },
  { id: "black", color: "bg-gray-900" },
];

export function CustomizeFeature({
  onBackgroundChange,
}: CustomizeFeatureProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("purple");
  const [animationClass, setAnimationClass] = useState("");
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const { addCard, isCardVisible } = useDashboard();

  // Create a ref to measure header height
  const headerRef = useRef<number>(0);

  // Set up portal container and measure header height on mount
  useEffect(() => {
    setPortalContainer(document.body);

    // Measure header height - find the header element and get its height
    const headerElement = document.querySelector("header");
    if (headerElement) {
      headerRef.current = headerElement.getBoundingClientRect().height;
    }

    // Ensure body scrolling is enabled on mount
    document.body.style.overflow = "";

    // Clean up on unmount - ensure body scrolling is enabled
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Handle animation classes
  useEffect(() => {
    if (isSidebarOpen) {
      setAnimationClass("translate-x-0");
      // Only prevent scrolling on mobile devices
      if (window.innerWidth < 768) {
        document.body.style.overflow = "hidden";
      }
    } else {
      setAnimationClass("translate-x-full");
      document.body.style.overflow = "";
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  // Handle color selection with simple animation
  const handleColorSelect = (colorId: string) => {
    // Just a brief click animation
    setActiveColor(colorId);

    // Update color selection
    setSelectedColor(colorId);
    if (onBackgroundChange) {
      onBackgroundChange(colorId);
    }

    // Clear the active state after a short time
    setTimeout(() => {
      setActiveColor(null);
    }, 300);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Handle adding a card
  const handleAddCard = (cardType: CardType) => {
    addCard(cardType);
  };

  return (
    <>
      {/* Customize Button */}
      <Button
        variant="outline"
        className="bg-white/10 text-white border-white/20 hover:bg-white/20"
        onClick={toggleSidebar}
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Customize
      </Button>

      {/* Portal for Sidebar */}
      {portalContainer &&
        createPortal(
          <>
            {/* Overlay when sidebar is open - only visible on smaller screens */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={closeSidebar}
              />
            )}

            {/* Customize Sidebar */}
            <div
              className={cn(
                "fixed right-0 w-80 bg-[#1a1a1a] shadow-xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto",
                animationClass
              )}
              style={{
                top: `${headerRef.current}px`, // Position below header
                height: `calc(100vh - ${headerRef.current}px)`, // Adjust height to account for header
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-[#1a1a1a] z-10">
                <h2 className="text-xl font-semibold text-white">
                  Customize home
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeSidebar}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-8">
                {/* Background Section */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    Background
                  </h3>
                  <div className="grid grid-cols-6 gap-3">
                    {backgroundColors.map((bg) => (
                      <button
                        key={bg.id}
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          "transform transition-all duration-200",
                          "hover:scale-110 hover:shadow-lg hover:shadow-black/30",
                          bg.color,
                          selectedColor === bg.id
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]"
                            : "",
                          activeColor === bg.id ? "scale-95" : ""
                        )}
                        onClick={() => handleColorSelect(bg.id)}
                      >
                        {selectedColor === bg.id && (
                          <div className="relative">
                            <Check className="h-4 w-4 text-white animate-in fade-in duration-300" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Widgets Section */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Widgets
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Click add or drag widgets below to your home screen. You can
                    also reorder and remove them.
                  </p>

                  <div className="space-y-4">
                    {availableCardTemplates.map((widget) => {
                      const isVisible = isCardVisible(widget.type);

                      return (
                        <div
                          key={widget.id}
                          className="rounded-lg border border-gray-800 bg-[#212121] p-4"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-white font-medium">
                              {widget.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "text-gray-400 hover:text-white",
                                isVisible && "opacity-50 pointer-events-none"
                              )}
                              onClick={() => handleAddCard(widget.type)}
                              disabled={isVisible}
                            >
                              {isVisible ? (
                                <Check className="h-4 w-4 mr-1" />
                              ) : (
                                <Plus className="h-4 w-4 mr-1" />
                              )}
                              {isVisible ? "Added" : "Add"}
                            </Button>
                          </div>

                          {/* Widget preview */}
                          {widget.type === "tasks" && (
                            <div className="space-y-3 mt-3">
                              {[1, 2].map((i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2"
                                >
                                  <div className="h-5 w-5 rounded-full bg-gray-700 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-gray-500" />
                                  </div>
                                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                </div>
                              ))}
                            </div>
                          )}

                          {widget.type === "goals" && (
                            <div className="space-y-2 mt-3">
                              <div className="space-y-1">
                                <div className="h-4 bg-gray-700 rounded w-full"></div>
                                <div className="h-2 bg-orange-400 rounded w-3/4"></div>
                              </div>
                              <div className="space-y-1">
                                <div className="h-4 bg-gray-700 rounded w-full"></div>
                                <div className="h-2 bg-teal-400 rounded w-1/2"></div>
                              </div>
                            </div>
                          )}

                          {widget.type === "calendar" && (
                            <div className="grid grid-cols-7 gap-1 mt-3">
                              {Array.from({ length: 14 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="aspect-square rounded bg-gray-700"
                                />
                              ))}
                            </div>
                          )}

                          {(widget.type === "projects" ||
                            widget.type === "people") && (
                            <div className="space-y-2 mt-3">
                              {[1, 2].map((i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2"
                                >
                                  <div className="h-6 w-6 rounded bg-gray-700"></div>
                                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>,
          portalContainer
        )}
    </>
  );
}
