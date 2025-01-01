"use client";

import { useState } from "react";
import "./globals.css";
import AsanaSidebar from "@/components/app-sidebar";
import { AppHeader } from "@/components/AppHeader";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <html lang="en"> {/* Add this tag */}
      <body className="antialiased bg-gray-100"> {/* Add this tag */}
        <div className="flex h-screen">
          {/* Sidebar */}
          <AsanaSidebar isCollapsed={isSidebarCollapsed} />

          {/* Main Content Layout */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <AppHeader toggleSidebar={setIsSidebarCollapsed} />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 bg-gray-100">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
