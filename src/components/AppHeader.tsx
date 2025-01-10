import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

interface AppHeaderProps {
  toggleSidebar: () => void;
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ toggleSidebar, className }) => {
  return (
    <header className={`p-4 bg-white dark:bg-gray-900 shadow ${className}`}>
      <div className="flex items-center justify-between">
        {/* Sidebar Trigger */}
        <SidebarTrigger>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <Menu className="w-6 h-6 text-gray-800 dark:text-gray-300" />
          </button>
        </SidebarTrigger>

        {/* Title */}
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">Dashboard</h1>
      </div>
    </header>
  );
};

export default AppHeader;
