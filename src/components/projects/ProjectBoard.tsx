"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Filter, MoreHorizontal, Plus } from "lucide-react";
import { BoardSection } from "./BoardSection";

interface Task {
  id: string;
  title: string;
  assignee: string | null;
}

interface Project {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
}

const scrollbarHideClass = `
    overflow-x-auto 
    scrollbar-hide 
    [&::-webkit-scrollbar]:hidden 
    [-ms-overflow-style:'none'] 
    [scrollbar-width:none]
`;

export function ProjectBoard({ projectId }: Readonly<{ projectId: string }>) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching project data from an API (Replace with actual API call)
    setTimeout(() => {
      const projects: Record<string, Project> = {
        AboRas: {
          id: "AboRas",
          name: "AboRas",
          color: "bg-purple-500",
          tasks: [
            { id: "1", title: "Design homepage", assignee: "CX" },
            { id: "2", title: "Implement API", assignee: "JD" },
          ],
        },
        Crossfunctional: {
          id: "Cross-functional project",
          name: "Cross-functional Project",
          color: "bg-teal-500",
          tasks: [{ id: "3", title: "Database setup", assignee: null }],
        },
      };

      setProject(projects[projectId] || null);
      setLoading(false);
    }, 500);
  }, [projectId]);

  if (loading) {
    return (
      <div className="text-white text-center py-20">Loading project...</div>
    );
  }

  if (!project) {
    return (
      <div className="text-white text-center py-20">Project not found</div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Board Actions */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-gray-400 border-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-400">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400">
            Sort
          </Button>
          
          <Button variant="ghost" size="sm" className="text-gray-400">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Board Content */}
      <div className={`flex-1 p-6 ${scrollbarHideClass}`}>
        <div className="flex gap-6">
          {project.tasks.map((task) => (
            <BoardSection key={task.id} title={task.title} tasks={[task]} />
          ))}
          <Button
            variant="outline"
            className="h-auto py-3 px-4 border-dashed border-gray-800 text-gray-400 hover:border-gray-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add section
          </Button>
        </div>
      </div>
    </div>
  );
}
