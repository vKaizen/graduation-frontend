"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  List,
  Plus,
  Check,
  FileText,
  MessageCircle,
  Briefcase,
  Target,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

export default function AppHeader({ className }: { className?: string }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <header
      className={`flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 shadow-md ${className}`}
    >
      {/* Sidebar Trigger */}
      <div className="flex items-center">
        <SidebarTrigger>
          <button className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
            <List className="w-6 h-6 text-gray-800 dark:text-gray-300" />
          </button>
        </SidebarTrigger>
      </div>

      {/* Title */}
      <div className="text-lg font-bold text-gray-800 dark:text-white">
        Avana
      </div>

      {/* Right-Side Actions */}
      <div className="relative flex items-center space-x-4">
        {/* Create Button */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
            onClick={toggleDropdown}
          >
            <Plus className="w-5 h-5" />
            Create
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
              <ul className="py-1 text-sm text-gray-800 dark:text-gray-200">
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <Check className="w-4 h-4" />
                    Task
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <FileText className="w-4 h-4" />
                    Project
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <Briefcase className="w-4 h-4" />
                    Portfolio
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <Target className="w-4 h-4" />
                    Goal
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
