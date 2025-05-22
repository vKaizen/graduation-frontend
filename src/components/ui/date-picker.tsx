"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full flex justify-between items-center text-left font-normal bg-[#353535] border-0 hover:bg-[#444444] focus:ring-1 focus:ring-neutral-500",
            !date && "text-neutral-400",
            className
          )}
        >
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-[#252525] border-[#454545] text-white">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
          className="bg-[#252525] text-white"
          classNames={{
            months: "text-white",
            caption_label: "text-white",
            day: "text-white hover:bg-[#353535] focus:bg-[#353535] focus:text-white",
            day_selected: "bg-[#454545] text-white hover:bg-[#555555]",
            day_today: "bg-[#333333] text-white",
            head_cell: "text-neutral-400",
            table: "text-white",
            nav_button: "text-white hover:bg-[#353535]",
            nav_button_previous: "hover:bg-[#353535]",
            nav_button_next: "hover:bg-[#353535]",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
