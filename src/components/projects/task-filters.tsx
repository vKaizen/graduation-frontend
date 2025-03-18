"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, ChevronDown, Check, Clock, User2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskFiltersProps {
  activeFilters: string[]
  onFilterChange: (filters: string[]) => void
}

export function TaskFilters({ activeFilters, onFilterChange }: TaskFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const toggleFilter = (filter: string) => {
    const newFilters = activeFilters.includes(filter)
      ? activeFilters.filter((f) => f !== filter)
      : [...activeFilters, filter]

    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    onFilterChange([])
  }

  const FilterButton = ({ filter, icon: Icon }: { filter: string; icon: React.ElementType }) => (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300",
        activeFilters.includes(filter) && "bg-neutral-800 text-neutral-200",
      )}
      onClick={() => toggleFilter(filter)}
    >
      <Icon className="mr-2 h-4 w-4" />
      {filter}
    </Button>
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800",
            isOpen && "bg-neutral-800 text-neutral-300",
          )}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-neutral-900 border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-neutral-200">Filters</h4>
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-neutral-300 h-auto p-0 text-sm"
            onClick={clearFilters}
          >
            Clear
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-neutral-400 mb-3">Quick filters</h5>
            <div className="flex flex-wrap gap-2">
              <FilterButton filter="Incomplete tasks" icon={Check} />
              <FilterButton filter="Completed tasks" icon={Check} />
              <FilterButton filter="Just my tasks" icon={User2} />
              <FilterButton filter="Due this week" icon={Clock} />
              <FilterButton filter="Due next week" icon={Clock} />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add filter
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

