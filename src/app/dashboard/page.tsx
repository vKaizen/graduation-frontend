import { AppSidebar } from "@/components/app-sidebar";
import  AppHeader  from "@/components/AppHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardCardContainer } from "../DashboardCardContainer/DashboardCardContainer";


export default function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <AppHeader className="fixed top-0 left-0 w-full z-50" />

          {/* Main Content */}
          <div className="pt-16 p-6 bg-gray-100 dark:bg-gray-800 flex-1">
            <DashboardCardContainer />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
