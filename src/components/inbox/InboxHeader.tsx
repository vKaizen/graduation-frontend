"use client";

import { Bell } from "lucide-react";

interface InboxHeaderProps {
  title: string;
}

export function InboxHeader({ title }: InboxHeaderProps) {
  return (
    <header className="flex items-center mb-8">
      <div className="p-2 rounded-md bg-[#4573D2]/10 text-[#4573D2] mr-3">
        <Bell className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-[#a1a1a1] text-sm mt-1">
          Stay updated with notifications and invitations
        </p>
      </div>
    </header>
  );
}
