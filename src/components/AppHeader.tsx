import { Bell, User, Search } from "lucide-react";

export function AppHeader() {
  return (
    <header className="header flex justify-between items-center px-6 py-3 bg-gray-900 text-white shadow-md">
      {/* Left Section: Logo/Title */}
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold">Asana Clone</h1>
      </div>

      {/* Middle Section: Search Bar */}
      <div className="flex-1 mx-4">
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
      <div className="flex items-center space-x-6">
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
