"use client";

import { Home, Check, Bell, BarChart, Calendar, Mail } from "lucide-react";
import { JSX } from "react";

interface SidebarProps {
  isCollapsed: boolean;
}

export default function AsanaSidebar({ isCollapsed }: SidebarProps): JSX.Element {
  return (
    <aside
      className={`bg-gray-900 text-white h-screen shadow-lg flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
        <span className={`text-base font-semibold ${isCollapsed ? "hidden" : "block"}`}>
          Avana
        </span>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Main Links */}
        <nav className="mt-4">
          <SidebarLink icon={<Home />} label="Home" isCollapsed={isCollapsed} />
          <SidebarLink icon={<Check />} label="My tasks" isCollapsed={isCollapsed} />
          <SidebarLink icon={<Bell />} label="Inbox" isCollapsed={isCollapsed} />
        </nav>

        {/* Insights Section */}
        <CollapsibleSection
          title="Insights"
          isExpanded={true}
          isCollapsed={isCollapsed}
        >
          <SidebarLink icon={<BarChart />} label="Reporting" isCollapsed={isCollapsed} />
          <SidebarLink icon={<Calendar />} label="Portfolios" isCollapsed={isCollapsed} />
        </CollapsibleSection>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <div className="bg-gray-600 w-6 h-6 flex items-center justify-center rounded-full">
            Z
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-xs font-medium">User</p>
              <a href="#" className="text-xs text-gray-400 hover:text-gray-200">
                Switch Account
              </a>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button className="mt-4 w-full flex items-center justify-center gap-1 bg-gray-800 py-1.5 rounded hover:bg-gray-700">
            <Mail className="w-3 h-3" />
            Invite teammates
          </button>
        )}
      </div>
    </aside>
  );
}

// Sidebar Link Component
function SidebarLink({
  icon,
  label,
  isCollapsed,
}: {
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
}): JSX.Element {
  return (
    <a
      href="#"
      className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 rounded transition"
    >
      {icon}
      {!isCollapsed && <span className="text-sm">{label}</span>}
    </a>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  isCollapsed,
  children,
}: {
  title: string;
  isExpanded: boolean;
  isCollapsed: boolean;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="mt-4">
      <div
        className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-800 rounded transition"
      >
        {!isCollapsed && <span className="text-sm font-medium">{title}</span>}
      </div>
      {!isCollapsed && <div className="ml-4">{children}</div>}
    </div>
  );
}
