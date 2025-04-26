"use client";

import { useState, useEffect } from "react";
import { GreetingSection } from "@/components/dashboard/GreetingSection";
import { CustomizeFeature } from "@/components/dashboard/CustomizeFeature";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";
import { getUserPreferences, updateBackgroundColor } from "@/api-service";
import { getUserIdCookie } from "@/lib/cookies";

// Define background color type for type safety
type BackgroundColorKey =
  | "purple"
  | "orange"
  | "lime"
  | "teal"
  | "turquoise"
  | "lightblue"
  | "blue"
  | "lavender"
  | "purple2"
  | "pink"
  | "white"
  | "black";

// Map color IDs to actual background classes with more vibrant gradients
const backgroundMap: Record<BackgroundColorKey, string> = {
  purple: "from-purple-800/80 via-[#1E201E] to-[#1E201E]",
  orange: "from-orange-500/80 via-[#1E201E] to-[#1E201E]",
  lime: "from-lime-400/80 via-[#1E201E] to-[#1E201E]",
  teal: "from-teal-700/80 via-[#1E201E] to-[#1E201E]",
  turquoise: "from-cyan-500/80 via-[#1E201E] to-[#1E201E]",
  lightblue: "from-cyan-200/80 via-[#1E201E] to-[#1E201E]",
  blue: "from-blue-500/80 via-[#1E201E] to-[#1E201E]",
  lavender: "from-purple-400/80 via-[#1E201E] to-[#1E201E]",
  purple2: "from-purple-500/80 via-[#1E201E] to-[#1E201E]",
  pink: "from-pink-300/80 via-[#1E201E] to-[#1E201E]",
  white: "from-gray-100/80 via-[#1E201E] to-[#1E201E]",
  black: "from-[#1E201E] via-[#1E201E] to-[#1E201E]",
};

export default function DashboardPage() {
  // States for current and previous background themes
  const [backgroundTheme, setBackgroundTheme] =
    useState<BackgroundColorKey>("purple");
  const [prevBackgroundTheme, setPrevBackgroundTheme] =
    useState<BackgroundColorKey>("purple");
  const [activeLayer, setActiveLayer] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(true);

  // Load user preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        const userId = getUserIdCookie();

        // Only attempt to fetch preferences if user is logged in
        if (userId) {
          const preferences = await getUserPreferences();

          if (
            preferences &&
            preferences.uiPreferences &&
            preferences.uiPreferences.backgroundColor
          ) {
            // If user has a saved color preference, apply it
            const savedColor = preferences.uiPreferences.backgroundColor;

            // Verify the saved color is valid
            if (Object.keys(backgroundMap).includes(savedColor)) {
              setBackgroundTheme(savedColor as BackgroundColorKey);
              setPrevBackgroundTheme(savedColor as BackgroundColorKey);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Handle background change with proper animation and save preference
  const handleBackgroundChange = async (colorId: string) => {
    // Make sure the color is a valid key
    if (
      colorId !== backgroundTheme &&
      Object.keys(backgroundMap).includes(colorId)
    ) {
      const typedColorId = colorId as BackgroundColorKey;

      // Update the UI immediately
      setPrevBackgroundTheme(backgroundTheme);
      setBackgroundTheme(typedColorId);
      setActiveLayer(activeLayer === 1 ? 2 : 1);

      try {
        // Save the preference to the backend
        await updateBackgroundColor(colorId);
      } catch (error) {
        console.error("Error saving background color preference:", error);
        // Don't revert the UI since the user already sees the new color
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1E201E] flex justify-center items-center">
        <div className="animate-pulse text-white/50">
          Loading preferences...
        </div>
      </div>
    );
  }

  return (
    <DashboardProvider>
      {/* Dark background layer to prevent any white flash */}
      <div className="fixed inset-0 bg-[#1E201E] -z-30" />

      {/* Layer 1 */}
      <div
        className={cn(
          "fixed inset-0 bg-gradient-to-b -z-20 transition-opacity duration-1000 ease-in-out",
          backgroundMap[
            activeLayer === 1 ? backgroundTheme : prevBackgroundTheme
          ],
          activeLayer === 1 ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Layer 2 */}
      <div
        className={cn(
          "fixed inset-0 bg-gradient-to-b -z-10 transition-opacity duration-1000 ease-in-out",
          backgroundMap[
            activeLayer === 2 ? backgroundTheme : prevBackgroundTheme
          ],
          activeLayer === 2 ? "opacity-100" : "opacity-0"
        )}
      />

      <div className="min-h-screen w-full overflow-y-auto">
        <div className="flex-1 space-y-4 p-8 pt-6 relative">
          <div className="absolute top-0 right-0 p-8 z-10">
            <CustomizeFeature onBackgroundChange={handleBackgroundChange} />
          </div>
          <GreetingSection />
          <DashboardGrid />
        </div>
      </div>
    </DashboardProvider>
  );
}
