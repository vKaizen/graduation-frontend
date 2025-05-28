"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoalProvider } from "@/contexts/GoalContext";
import { GoalProgressListener } from "@/components/goals/GoalProgressListener";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// This function is used to determine if the current path should load the GoalProvider
const shouldEnableGoals = (pathname: string) => {
  // Login and registration pages don't need goals
  if (pathname === "/" || pathname === "/register" || pathname === "/login") {
    return false;
  }
  return true;
};

// Wrapped component that conditionally includes GoalProvider and GoalProgressListener
const ConditionalGoalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const [shouldLoadGoals, setShouldLoadGoals] = useState(false);

  useEffect(() => {
    // Only enable goals on non-auth pages
    setShouldLoadGoals(shouldEnableGoals(pathname));
  }, [pathname]);

  // Skip goal context on auth pages
  if (!shouldLoadGoals) {
    return <>{children}</>;
  }

  // Include goal context on dashboard and other pages
  return (
    <GoalProvider>
      <GoalProgressListener />
      {children}
    </GoalProvider>
  );
};

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
        <AuthProvider>
          <ConditionalGoalProvider>{children}</ConditionalGoalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
