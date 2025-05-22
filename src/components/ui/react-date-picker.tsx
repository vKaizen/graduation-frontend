"use client";

import React from "react";
import DatePicker from "react-datepicker";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "react-datepicker/dist/react-datepicker.css";

interface ReactDatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function ReactDatePickerComponent({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
}: ReactDatePickerProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border-0 bg-[#353535] px-3 py-2 text-sm text-white focus-within:ring-1 focus-within:ring-neutral-500",
          !date && "text-neutral-400"
        )}
      >
        <DatePicker
          selected={date}
          onChange={onDateChange}
          placeholderText={placeholder}
          className="w-full bg-transparent border-0 focus:outline-none cursor-pointer text-white placeholder:text-neutral-400"
          popperClassName="react-datepicker-dark"
          dateFormat="MMM d, yyyy"
          popperModifiers={[
            {
              name: "offset",
              options: {
                offset: [0, 8],
              },
            },
          ]}
          calendarClassName="bg-[#252525] border border-[#454545] text-white rounded-md shadow-md"
          dayClassName={(date) => "text-white hover:bg-[#353535] rounded-md"}
          wrapperClassName="w-full"
        />
        <CalendarIcon className="h-4 w-4 text-neutral-400" />
      </div>
      <style jsx global>{`
        .react-datepicker {
          background-color: #252525 !important;
          border-color: #454545 !important;
          border-radius: 0.375rem;
          font-family: inherit;
        }
        .react-datepicker__header {
          background-color: #1a1a1a !important;
          border-bottom-color: #454545 !important;
        }
        .react-datepicker__current-month,
        .react-datepicker__day-name,
        .react-datepicker-time__header {
          color: #ffffff !important;
        }
        .react-datepicker__day {
          color: #ffffff !important;
        }
        .react-datepicker__day:hover {
          background-color: #353535 !important;
          border-radius: 0.3rem;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #454545 !important;
          border-radius: 0.3rem;
        }
        .react-datepicker__day--outside-month {
          color: #666666 !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #ffffff !important;
        }
        .react-datepicker__navigation:hover *::before {
          border-color: #cccccc !important;
        }
        .react-datepicker__year-read-view--down-arrow,
        .react-datepicker__month-read-view--down-arrow {
          border-color: #ffffff !important;
        }
        .react-datepicker__year-dropdown,
        .react-datepicker__month-dropdown,
        .react-datepicker__month-year-dropdown {
          background-color: #252525 !important;
          border-color: #454545 !important;
        }
        .react-datepicker__year-option,
        .react-datepicker__month-option,
        .react-datepicker__month-year-option {
          color: #ffffff !important;
        }
        .react-datepicker__year-option:hover,
        .react-datepicker__month-option:hover,
        .react-datepicker__month-year-option:hover {
          background-color: #353535 !important;
        }
        .react-datepicker__day--today {
          background-color: #333333 !important;
          font-weight: bold;
        }
        .react-datepicker__input-container input {
          outline: none;
        }
      `}</style>
    </div>
  );
}
