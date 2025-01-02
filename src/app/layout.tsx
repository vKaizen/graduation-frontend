"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import AsanaSidebar from "@/components/app-sidebar";
import { AppHeader } from "@/components/AppHeader";
import { useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}
      >
        <SidebarProvider>
          {/* Header */}
          <AppHeader toggleSidebar={toggleSidebar} />
          <div className="flex pt-16">
            {/* Sidebar */}
            {isSidebarOpen && (
              <div className="flex-none w-64 h-[calc(100vh-4rem)] overflow-y-auto bg-gray-900 scroll-container">
                <AsanaSidebar isCollapsed={false}/>
              </div>
            )}
            {/* Main Content */}
            <div className="flex-grow p-6 overflow-y-auto h-[calc(100vh-4rem)] scroll-container">
              {children}
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
