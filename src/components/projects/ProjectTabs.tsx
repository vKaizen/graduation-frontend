"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutGrid, List, LineChart } from "lucide-react";

const views = [
  { name: "Overview", key: "overview", icon: LineChart },
  { name: "Board", key: "board", icon: LayoutGrid },
  { name: "List", key: "list", icon: List },
];

export function ProjectTabs({ projectId }: Readonly<{ projectId: string }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeView, setActiveView] = useState<string>("board");

  useEffect(() => {
    const currentView = pathname.split("/").pop() || "board";
    setActiveView(currentView);
  }, [pathname]);

  const handleTabChange = (value: string) => {
    setActiveView(value);
    router.push(`/projects/${projectId}/${value}`);
  };

  return (
    <div className="bg-[#1a1a1a] border-b border-[#353535]">
      <div className="container mx-auto px-3">
        <div className="flex">
          {views.map((view) => (
            <button
              key={view.key}
              className={`px-4 py-3 text-[13px] font-medium ${
                activeView === view.key
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => handleTabChange(view.key)}
            >
              <view.icon className="h-3 w-3 inline mr-1" />
              {view.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
