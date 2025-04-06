"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, User2, X, Circle, FileText } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createProject } from "@/api-service";

// Predefined task widths and tag configurations
const TASK_CONFIGS = [
  { width: "70%", tags: ["green", "purple"] },
  { width: "45%", tags: ["green", "yellow"] },
  { width: "85%", tags: ["purple"] },
  { width: "60%", tags: ["green", "purple", "yellow"] },
  { width: "50%", tags: ["green"] },
];

const PREVIEW_SECTIONS = [
  { id: 1, tasks: [0, 1, 2] }, // Using indices from TASK_CONFIGS
  { id: 2, tasks: [3, 4, 1, 2] },
  { id: 3, tasks: [0, 3] },
];

// Available project colors
const PROJECT_COLORS = [
  { name: "Purple", value: "bg-purple-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Red", value: "bg-red-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Pink", value: "bg-pink-500" },
];

export function NewProjectForm() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [privacy, setPrivacy] = useState("workspace");
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0].value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!projectName.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      // Convert UI color class to hex color
      const colorHex =
        selectedColor === "bg-purple-500"
          ? "#A855F7"
          : selectedColor === "bg-blue-500"
          ? "#3B82F6"
          : selectedColor === "bg-green-500"
          ? "#22C55E"
          : selectedColor === "bg-red-500"
          ? "#EF4444"
          : selectedColor === "bg-yellow-500"
          ? "#EAB308"
          : selectedColor === "bg-pink-500"
          ? "#EC4899"
          : "#3B82F6"; // default to blue

      const newProject = await createProject({
        name: projectName,
        description: "", // Optional
        color: colorHex,
        status: "active",
      });

      if (newProject && newProject._id) {
        router.push(`/projects/${newProject._id}/board`);
      } else {
        setError("Failed to create project");
      }
    } catch (err) {
      console.error("Error creating project:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create project. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const PreviewTask = ({ config }: { config: (typeof TASK_CONFIGS)[0] }) => (
    <div className="flex items-start gap-3 py-2">
      <Circle className="h-4 w-4 mt-1 text-[#353535]" />
      <div className="flex-1 space-y-2">
        {/* Task title bar */}
        <div
          className="h-2 rounded-full bg-[#353535]"
          style={{ width: config.width }}
        />
        {/* Task details */}
        <div className="flex items-center gap-4">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="bg-[#353535] flex items-center justify-center">
              <User2 className="h-3 w-3 text-[#808080]" />
            </AvatarFallback>
          </Avatar>
          <div className="h-2 w-16 rounded-full bg-[#353535]" />
          {config.tags.includes("green") && (
            <div className="h-2 w-12 rounded-full bg-green-500/20" />
          )}
          {config.tags.includes("purple") && (
            <div className="h-2 w-12 rounded-full bg-purple-500/20" />
          )}
          {config.tags.includes("yellow") && (
            <div className="h-2 w-12 rounded-full bg-yellow-500/20" />
          )}
        </div>
      </div>
    </div>
  );

  const PreviewSection = ({ taskIndices }: { taskIndices: number[] }) => (
    <div className="space-y-1 mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-24 rounded-full bg-[#353535]" />
        <div className="h-2 w-4 rounded-full bg-[#353535]" />
      </div>
      {/* Tasks */}
      {taskIndices.map((index, i) => (
        <PreviewTask key={i} config={TASK_CONFIGS[index]} />
      ))}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#1E1E1E]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
        <Link href="/home">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Link href="/home">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-[400px] space-y-6">
          <h1 className="text-2xl font-semibold text-white">New project</h1>

          {/* Project name */}
          <div className="space-y-1.5">
            <label className="text-sm text-[#A1A1A1]">Project name</label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-[#121212] border-0 text-white h-11 text-base"
              placeholder="Enter project name"
            />
          </div>

          {/* Project color */}
          <div className="space-y-1.5">
            <label className="text-sm text-[#A1A1A1]">Project color</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-full ${color.value} ${
                    selectedColor === color.value
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#1E1E1E]"
                      : ""
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-1.5">
            <label className="text-sm text-[#A1A1A1]">Privacy</label>
            <Select value={privacy} onValueChange={setPrivacy}>
              <SelectTrigger className="w-full bg-[#121212] border-0 text-white h-11">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4" />
                    My workspace
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border-[#353535] text-white">
                <SelectItem value="workspace">
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4" />
                    My workspace
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Setup Button */}
          <Button
            variant="outline"
            className="w-full h-11 bg-[#1E1E1E] border-[#353535] text-[#A1A1A1] hover:bg-[#353535] hover:text-white"
          >
            Set up with Asana AI
          </Button>

          {/* Error message */}
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {/* Continue Button */}
          <Button
            className="w-full h-11 bg-[#4573D2] hover:bg-[#3D67BE] text-white font-medium"
            onClick={handleSubmit}
            disabled={!projectName.trim() || isLoading}
          >
            {isLoading ? "Creating..." : "Continue"}
          </Button>
        </div>
      </div>

      {/* Right side - Preview */}
      <div className="flex-1 bg-[#121212] p-8">
        <div className="h-full w-full rounded-lg bg-[#1A1A1A] border border-[#353535] p-6">
          {/* Project header */}
          {projectName && (
            <div className="flex items-center gap-3 mb-8">
              <div
                className={`h-8 w-8 rounded ${selectedColor} flex items-center justify-center text-white font-medium`}
              >
                {projectName[0]?.toUpperCase()}
              </div>
              <h2 className="text-white text-lg font-medium">{projectName}</h2>
            </div>
          )}

          {/* Project content preview */}
          <div className="space-y-8">
            {/* Top bar */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-2 w-20 rounded-full bg-[#353535]" />
              <div className="h-2 w-20 rounded-full bg-[#353535]" />
              <div className="h-2 w-20 rounded-full bg-[#353535]" />
              <div className="h-2 w-20 rounded-full bg-[#353535]" />
            </div>

            {/* Sections */}
            {PREVIEW_SECTIONS.map((section) => (
              <PreviewSection key={section.id} taskIndices={section.tasks} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
