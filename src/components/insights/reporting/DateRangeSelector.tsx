"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangeSelectorProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export function DateRangeSelector({
  dateRange,
  onDateRangeChange,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localRange, setLocalRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: dateRange.from,
    to: dateRange.to,
  });

  const presetRanges = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
    { label: "Year to date", days: "ytd" },
  ];

  const applyDateRange = () => {
    if (localRange.from && localRange.to) {
      onDateRangeChange({
        from: localRange.from,
        to: localRange.to,
      });
    }
    setIsOpen(false);
  };

  const selectPresetRange = (days: number | string) => {
    const to = new Date();
    // Force current year
    to.setFullYear(2025);

    let from: Date;

    if (days === "ytd") {
      from = new Date(2025, 0, 1); // January 1st of 2025
    } else {
      from = new Date();
      from.setDate(to.getDate() - (days as number));
      // Force current year
      from.setFullYear(2025);
    }

    setLocalRange({ from, to });
    onDateRangeChange({ from, to });
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!dateRange.from || !dateRange.to) return "Select date range";
    return `${format(dateRange.from, "MMM d, yyyy")} - ${format(
      dateRange.to,
      "MMM d, yyyy"
    )}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="bg-[#1a1a1a] border border-[#353535] rounded-lg p-3 flex items-center space-x-2 w-64">
          <Calendar className="h-5 w-5 text-[#4573D2]" />
          <span className="flex-grow text-left">{formatDateRange()}</span>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-[#1a1a1a] border border-[#353535] text-white"
        align="start"
      >
        <div className="p-3 border-b border-[#353535]">
          <div className="grid grid-cols-2 gap-2">
            {presetRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => selectPresetRange(range.days)}
                className="text-left text-sm hover:bg-[#252525] p-2 rounded"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3">
          <div className="flex justify-center mb-2">
            <span className="text-sm">Or select custom range</span>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-sm mb-2">From</p>
              <CalendarComponent
                mode="single"
                selected={localRange.from}
                onSelect={(date) =>
                  setLocalRange({ ...localRange, from: date })
                }
                disabled={(date) =>
                  date > new Date() ||
                  (localRange.to ? date > localRange.to : false)
                }
                defaultMonth={new Date(2025, new Date().getMonth(), 1)}
                className="bg-[#1a1a1a] border border-[#353535] rounded-md"
              />
            </div>
            <div>
              <p className="text-sm mb-2">To</p>
              <CalendarComponent
                mode="single"
                selected={localRange.to}
                onSelect={(date) => setLocalRange({ ...localRange, to: date })}
                disabled={(date) =>
                  date > new Date() ||
                  (localRange.from ? date < localRange.from : false)
                }
                defaultMonth={new Date(2025, new Date().getMonth(), 1)}
                className="bg-[#1a1a1a] border border-[#353535] rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setIsOpen(false)}
              className="mr-2 px-3 py-1 rounded border border-[#353535] hover:bg-[#252525]"
            >
              Cancel
            </button>
            <button
              onClick={applyDateRange}
              className="px-3 py-1 rounded bg-[#4573D2] hover:bg-[#3A62B3]"
              disabled={!localRange.from || !localRange.to}
            >
              Apply
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
