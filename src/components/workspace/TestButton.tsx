"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function TestButton() {
  const handleClick = () => {
    console.log("Test button clicked");
    toast.success("Test button clicked successfully!");
  };

  return (
    <Button
      className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-700 p-0"
      onClick={handleClick}
    >
      TB
    </Button>
  );
}
