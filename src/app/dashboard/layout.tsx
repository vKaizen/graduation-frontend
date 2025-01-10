import { AppSidebar } from "@/components/app-sidebar";
import AppHeader from "@/components/AppHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Users, Briefcase, List } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <AppHeader className="fixed top-0 left-0 w-full z-50">
            <div className="flex items-center">
              {/* Sidebar Trigger */}
              <SidebarTrigger>
                <button className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                  <List className="w-6 h-6 text-gray-800 dark:text-gray-300" />
                </button>
              </SidebarTrigger>
            </div>
          </AppHeader>

          {/* Main Content */}
          <div className="pt-16 p-6 bg-gray-100 dark:bg-gray-800 flex-1">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Welcome to the Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Here’s an overview of your workspace.
              </p>
            </header>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tasks Card */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-500 text-blue-600">
                  <List className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    Tasks
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    42 tasks pending
                  </p>
                </div>
              </div>

              {/* Projects Card */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-500 text-green-600">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    Projects
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    8 active projects
                  </p>
                </div>
              </div>

              {/* Members Card */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-500 text-yellow-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    Members
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    25 workspace members
                  </p>
                </div>
              </div>
            </div>

            {/* Separator */}
            <Separator className="my-6" />

            {/* Additional Content */}
            <p className="text-gray-600 dark:text-gray-300">
              You can add more details here, such as recent activities, charts,
              or other workspace statistics.
            </p>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
