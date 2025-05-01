"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function TestDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-700 p-0">
          <Plus className="h-4 w-4 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>
            This is a test to see if dialogs are working properly.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>If you can see this, the dialog is working!</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
