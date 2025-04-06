import { Button } from "@/components/ui/button";
import { Plus, Filter, MoreHorizontal, Calendar, Tag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TasksNavProps {
  onFilterChange?: (filters: string[]) => void;
  onSortChange?: (
    sort: { field: string; direction: "asc" | "desc" } | null
  ) => void;
}

export function TasksNav({ onFilterChange, onSortChange }: TasksNavProps) {
  return (
    <div className="flex items-center justify-between px-6 h-14 border-b border-[#262626] bg-black">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="text-neutral-300 border-[#262626] hover:bg-[#262626] hover:text-neutral-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add task
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-neutral-300 hover:bg-[#262626]"
            >
              <Filter className="h-4 w-4 mr-2" />
              Priority
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 bg-black border-[#262626]">
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-neutral-300 focus:bg-[#262626] focus:text-neutral-200">
                High
              </DropdownMenuItem>
              <DropdownMenuItem className="text-neutral-300 focus:bg-[#262626] focus:text-neutral-200">
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem className="text-neutral-300 focus:bg-[#262626] focus:text-neutral-200">
                Low
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-neutral-300 hover:bg-[#262626]"
            >
              <Tag className="h-4 w-4 mr-2" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 bg-black border-[#262626]">
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-neutral-300 focus:bg-[#262626] focus:text-neutral-200">
                Not Started
              </DropdownMenuItem>
              <DropdownMenuItem className="text-neutral-300 focus:bg-[#262626] focus:text-neutral-200">
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem className="text-neutral-300 focus:bg-[#262626] focus:text-neutral-200">
                Completed
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-neutral-300 hover:bg-[#262626]"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Due Date
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 bg-black border-[#262626]">
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-neutral-300 focus:bg-[#262626] focus:text-neutral-200">
                Today
              </DropdownMenuItem>
              <DropdownMenuItem className="text-neutral-300 focus:bg-[#262626] focus:text-neutral-200">
                This Week
              </DropdownMenuItem>
              <DropdownMenuItem className="text-neutral-300 focus:bg-[#262626] focus:text-neutral-200">
                This Month
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-400 hover:text-neutral-300 hover:bg-[#262626]"
        >
          Sort
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-400 hover:text-neutral-300 hover:bg-[#262626]"
        >
          Group
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-400 hover:text-neutral-300 hover:bg-[#262626]"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
