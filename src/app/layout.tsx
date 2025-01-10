"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import  AppHeader  from "@/components/AppHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

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
  

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}
      >
        
        {/* Main Layout */}
        <div className="flex pt-18">
          {/* Sidebar */}
          
          
          {/* Main Content */}
          <div className="flex-grow p-10 overflow-y-auto h-[calc(100vh-4rem)]">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
