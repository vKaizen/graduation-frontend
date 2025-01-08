// Assuming you are using TypeScript
"use client";

import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Define a TypeScript interface for the user prop
interface IUser {
  name: string;
}

interface HeaderBarProps {
  user: IUser;
}

const HeaderBar = ({ user }: HeaderBarProps) => {
  return (
    <div style={{ background: "#333", color: "white", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <h2>{`Hello, ${user.name}`}</h2>
      </div>
      <div>
        <input type="text" placeholder="Search" style={{ padding: "8px", marginRight: "10px" }} />
        <button style={{ background: "none", border: "none", color: "white" }}>
          Customize
        </button>
      </div>
    </div>
  );
};

interface RootLayoutProps {
  children: React.ReactNode;
  user?: IUser;  // Optional user prop
}

export default function RootLayout({
  children,
  user = { name: "Default User" },  // Providing a default user if none is provided
}: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}>
        <div className="flex">
          {/* Header Bar */}
          <HeaderBar user={user} />
          {/* Main Content */}
          <main className="flex-grow p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
