"use client";

import { Bell, User, Search, Menu } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface AppHeaderProps {
  toggleSidebar: Dispatch<SetStateAction<boolean>>;
}

export function AppHeader({ toggleSidebar }: AppHeaderProps) {
  return (
    <header className="header flex justify-between items-center px-4 py-2 bg-gray-900 text-white shadow-md">
      {/* Left Section: Sidebar Toggle and Logo */}
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle Button */}
        <button
          type="button"
          onClick={() => toggleSidebar((prev) => !prev)}
          className="p-2 rounded-md hover:bg-gray-800 focus:outline-none"
        >
          <Menu className="w-6 h-6 text-gray-300" />
        </button>
        <h1 className="text-lg font-semibold">asana</h1>
      </div>

      {/* Middle Section: Search Bar */}
      <div className="flex-1 mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Right Section: Icons */}
      <div className="flex items-center space-x-4">
        {/* Notification Icon */}
        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-800 focus:outline-none"
        >
          <Bell className="w-6 h-6 text-gray-300" />
        </button>

        {/* User Profile Icon */}
        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-800 focus:outline-none"
        >
          <User className="w-6 h-6 text-gray-300" />
        </button>
      </div>
    </header>
  );
}
