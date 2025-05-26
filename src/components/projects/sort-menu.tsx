"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowDownAZ, Calendar, ChevronDown, Clock, SortAsc, SortDesc } from "lucide-react"
import { cn } from "@/lib/utils"

export type SortOption = {
  id: string
  label: string
  icon: React.ElementType
}

export type SortDirection = "asc" | "desc"

export type SortConfig = {
  option: string
  direction: SortDirection
}

interface SortMenuProps {
  activeSort: SortConfig | null
  onSortChange: (sort: SortConfig | null) => void
}

export const SORT_OPTIONS: SortOption[] = [
  { id: "title", label: "Title", icon: ArrowDownAZ },
  { id: "dueDate", label: "Due date", icon: Calendar },
  { id: "priority", label: "Priority", icon: SortAsc },
  { id: "assignee", label: "Assignee", icon: ArrowDownAZ },
  
]

export function SortMenu({ activeSort, onSortChange }: SortMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleSortSelect = (optionId: string) => {
    if (activeSort?.option === optionId) {
      // Toggle direction if the same option is selected
      onSortChange({
        option: optionId,
        direction: activeSort.direction === "asc" ? "desc" : "asc",
      })
    } else {
      // Set new option with default ascending direction
      onSortChange({
        option: optionId,
        direction: "asc",
      })
    }
    setIsOpen(false)
  }

  const clearSort = () => {
    onSortChange(null)
    setIsOpen(false)
  }

  const getActiveSortLabel = () => {
    if (!activeSort) return "Sort"
    const option = SORT_OPTIONS.find((opt) => opt.id === activeSort.option)
    return option ? option.label : "Sort"
  }

  const SortIcon = activeSort ? SORT_OPTIONS.find((opt) => opt.id === activeSort.option)?.icon || SortAsc : SortAsc

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800",
            isOpen && "bg-neutral-800 text-neutral-300",
            activeSort && "text-neutral-200",
          )}
        >
          {activeSort ? (
            <>
              <SortIcon className="h-4 w-4 mr-2" />
              {getActiveSortLabel()}
              {activeSort.direction === "asc" ? (
                <SortAsc className="h-3 w-3 ml-1" />
              ) : (
                <SortDesc className="h-3 w-3 ml-1" />
              )}
            </>
          ) : (
            <>
              <SortAsc className="h-4 w-4 mr-2" />
              Sort
            </>
          )}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0 bg-neutral-900 border-neutral-800">
        <div className="py-1">
          {SORT_OPTIONS.map((option) => {
            const isActive = activeSort?.option === option.id
            const Icon = option.icon
            return (
              <Button
                key={option.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-between px-3 py-2 text-sm rounded-none",
                  isActive
                    ? "bg-neutral-800 text-neutral-200"
                    : "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800",
                )}
                onClick={() => handleSortSelect(option.id)}
              >
                <div className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" />
                  {option.label}
                </div>
                {isActive &&
                  (activeSort.direction === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
              </Button>
            )
          })}
          {activeSort && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start px-3 py-2 text-sm rounded-none text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800"
              onClick={clearSort}
            >
              Clear sort
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

