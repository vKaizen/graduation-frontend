"use client"

import { useState } from "react"
import { GreetingSection } from "@/components/dashboard/GreetingSection"
import { CustomizeFeature } from "@/components/dashboard/CustomizeFeature"
import { DashboardGrid } from "@/components/dashboard/DashboardGrid"
import { DashboardProvider } from "@/contexts/DashboardContext"

// Map color IDs to actual background classes with more vibrant gradients
const backgroundMap = {
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
}

export default function DashboardPage() {
  // State for background theme
  const [backgroundTheme, setBackgroundTheme] = useState("purple")

  // Handle background change
  const handleBackgroundChange = (colorId: string) => {
    setBackgroundTheme(colorId)
  }

  return (
    <DashboardProvider>
      {/* Full-screen background */}
      <div
        className={`fixed inset-0 bg-gradient-to-b ${backgroundMap[backgroundTheme]} -z-10 transition-colors duration-300`}
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
  )
}

