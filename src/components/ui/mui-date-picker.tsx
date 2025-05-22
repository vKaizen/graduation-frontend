"use client";

import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Create a dark theme for MUI components
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#454545",
    },
    background: {
      paper: "#252525",
    },
    text: {
      primary: "#ffffff",
      secondary: "#bbbbbb",
    },
  },
  typography: {
    fontFamily: "inherit",
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#252525",
          borderColor: "#454545",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#353535",
          borderColor: "transparent",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#454545",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#555555",
          },
        },
        notchedOutline: {
          borderColor: "transparent",
        },
      },
    },
  },
});

interface MuiDatePickerProps {
  date: Date | null;
  onDateChange: (date: Date | undefined) => void;
  className?: string;
}

export function MuiDatePickerComponent({
  date,
  onDateChange,
  // We're using a space instead of placeholder to avoid mm/dd/yyyy
  className,
}: MuiDatePickerProps) {
  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <div className={cn("relative", className)}>
          <div
            className={cn(
              "flex h-7 w-full items-center rounded-md bg-[#353535] px-3 py-1 text-sm text-white",
              !date && "text-neutral-400"
            )}
          >
            <DatePicker
              value={date || null}
              onChange={(newDate) => onDateChange(newDate || undefined)}
              slots={{
                openPickerIcon: () => (
                  <CalendarIcon className="h-3.5 w-3.5 text-neutral-400" />
                ),
              }}
              slotProps={{
                textField: {
                  placeholder: " ", // Use empty space to avoid mm/dd/yyyy
                  variant: "standard",
                  InputProps: {
                    disableUnderline: true,
                    style: { color: "white" },
                  },
                  sx: {
                    width: "100%",
                    "& .MuiInput-input": {
                      color: date ? "white" : "#9ca3af",
                      fontSize: "0.875rem",
                      padding: 0,
                    },
                    // Remove outline on focus
                    "& .MuiInput-root:before": {
                      borderBottom: "none",
                    },
                    "& .MuiInput-root:after": {
                      borderBottom: "none",
                    },
                    "& .MuiInput-root:hover:not(.Mui-disabled):before": {
                      borderBottom: "none",
                    },
                  },
                },
                day: {
                  sx: {
                    "&.MuiPickersDay-today": {
                      backgroundColor: "#333333",
                      fontWeight: "bold",
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
