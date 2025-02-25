"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const views = [
    { name: "Board", key: "board" },
    { name: "List", key: "list" },
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
        <div className="sticky top-0 bg-black border-b border-gray-800 z-10">
            <Tabs defaultValue={activeView} value={activeView} onValueChange={handleTabChange} className="inline-flex h-10 items-center justify-start rounded-md p-1 text-white">
                <TabsList className="flex space-x-4">
                    {views.map((view) => (
                        <TabsTrigger key={view.key} value={view.key} className="text-white">
                            {view.name}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
    );
}
