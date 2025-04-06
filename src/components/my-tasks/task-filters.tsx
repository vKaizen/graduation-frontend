"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarIcon, FilterIcon, TagIcon, UserIcon } from "lucide-react";

interface TaskFiltersProps {
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

type FilterCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
  options: { id: string; name: string }[];
};

const filterCategories: FilterCategory[] = [
  {
    id: "priority",
    name: "Priority",
    icon: <FilterIcon className="h-4 w-4 mr-2" />,
    options: [
      { id: "high", name: "High" },
      { id: "medium", name: "Medium" },
      { id: "low", name: "Low" },
    ],
  },
  {
    id: "status",
    name: "Status",
    icon: <TagIcon className="h-4 w-4 mr-2" />,
    options: [
      { id: "not_started", name: "Not Started" },
      { id: "in_progress", name: "In Progress" },
      { id: "completed", name: "Completed" },
    ],
  },
  {
    id: "due_date",
    name: "Due Date",
    icon: <CalendarIcon className="h-4 w-4 mr-2" />,
    options: [
      { id: "today", name: "Today" },
      { id: "this_week", name: "This Week" },
      { id: "next_week", name: "Next Week" },
      { id: "overdue", name: "Overdue" },
    ],
  },
];

export function TaskFilters({
  activeFilters,
  onFilterChange,
}: TaskFiltersProps) {
  const toggleFilter = (filterId: string) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter((id) => id !== filterId)
      : [...activeFilters, filterId];

    onFilterChange(newFilters);
  };

  return (
    <div className="flex items-center space-x-2">
      {filterCategories.map((category) => (
        <DropdownMenu key={category.id}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-[#353535] bg-transparent text-neutral-400 hover:bg-[#2f2d45] hover:text-white"
            >
              {category.icon}
              {category.name}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="bg-[#1a1a1a] border-[#353535] text-neutral-300"
          >
            <DropdownMenuLabel className="text-neutral-400">
              {category.name}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#353535]" />
            {category.options.map((option) => {
              const filterId = `${category.id}_${option.id}`;
              return (
                <DropdownMenuCheckboxItem
                  key={filterId}
                  checked={activeFilters.includes(filterId)}
                  onCheckedChange={() => toggleFilter(filterId)}
                  className="focus:bg-[#2f2d45]"
                >
                  {option.name}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
}
