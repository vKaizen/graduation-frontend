interface AppHeaderProps {
    toggleSidebar: () => void;
  }
  
  export function AppHeader({ toggleSidebar }: AppHeaderProps) {
    return (
      <header className="fixed top-0 left-0 right-0 z-10 flex justify-between items-center px-6 py-4 bg-gray-800 text-white shadow">
        {/* Left Section: Toggle Sidebar */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-gray-700 focus:outline-none"
          >
            ☰ {/* Icon for Sidebar Toggle */}
          </button>
          <h1 className="text-xl font-semibold">Asana Clone</h1>
        </div>
  
        {/* Middle Section: Search Bar */}
        <div className="flex-1 mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
  
        {/* Right Section: Icons */}
        <div className="flex items-center space-x-6">
          <button className="p-2 rounded-full hover:bg-gray-700 focus:outline-none">
            🔔
          </button>
          <button className="p-2 rounded-full hover:bg-gray-700 focus:outline-none">
            🧑
          </button>
        </div>
      </header>
    );
  }
  