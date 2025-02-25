"use client"

import React from "react"
import {
  ChevronDown,
  Home,
  Inbox,
  Info,
  Mail,
  Menu,
  Plus,
  Search,
  Settings,
  Users,
  User,
  LogOut,
  CircleDot,
  FileText,
  MessageSquare,
  Folder,
  Triangle,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function TaskLayout({
  children,
  widgetColor = "#222831",
}: { children: React.ReactNode; widgetColor?: string }) {
  return (
    <div className="min-h-screen bg-[#1E201E]">
      {/* Top Header */}
      <header className="h-14 border-b border-[#3f3d5b] bg-[#222831] flex items-center px-4 gap-4">
        <Button variant="ghost" size="icon" className="text-gray-400">
          <Menu className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2 bg-[#0B5269] hover:bg-[#0B5269]/90">
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mt-2 p-0 bg-[#2f2d45] border-[#3f3d5b] text-white">
            <DropdownMenuItem className="py-2.5 focus:bg-white/10">
              <CircleDot className="mr-2 h-4 w-4" />
              Task
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5 focus:bg-white/10">
              <FileText className="mr-2 h-4 w-4" />
              Project
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5 focus:bg-white/10">
              <MessageSquare className="mr-2 h-4 w-4" />
              Message
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5 focus:bg-white/10">
              <Folder className="mr-2 h-4 w-4" />
              Portfolio
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#3f3d5b]" />
            <DropdownMenuItem className="py-2.5 focus:bg-white/10">
              <Triangle className="mr-2 h-4 w-4" />
              Goal
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5 focus:bg-white/10">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        <div className="relative w-96">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search" className="pl-9 bg-[#171717] border-0 text-white w-full" />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <kbd className="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">Ctrl</kbd>
            <kbd className="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded ml-1">K</kbd>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-400">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 mr-2 mt-2 p-0 bg-[#2f2d45] border-[#3f3d5b] text-white">
            <div className="p-4 flex items-center gap-3">
              <Avatar className="h-12 w-12 bg-orange-300">
                <AvatarFallback>CX</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">My workspace</div>
                <div className="text-sm text-gray-400">vd7comm@gmail.com</div>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-[#3f3d5b]" />
            <DropdownMenuItem className="py-2.5 focus:bg-white/10">
              <Settings className="mr-2 h-4 w-4" />
              Admin console
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5 focus:bg-white/10">
              <Plus className="mr-2 h-4 w-4" />
              New workspace
            </DropdownMenuItem>
            <div className="p-3">
              <Button className="w-full bg-orange-300 text-orange-900 hover:bg-orange-400">Upgrade</Button>
            </div>
            <DropdownMenuSeparator className="bg-[#3f3d5b]" />
            <DropdownMenuItem className="py-2.5 focus:bg-white/10">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5 focus:bg-white/10">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5 focus:bg-white/10">
              <Plus className="mr-2 h-4 w-4" />
              Add another account
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#3f3d5b]" />
            <DropdownMenuItem className="py-2.5 focus:bg-white/10">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex">
        {/* Rest of the component remains unchanged */}
        <aside className="w-64 min-h-[calc(100vh-3.5rem)] bg-[#222831] p-2 flex flex-col border-r border-[#3f3d5b]">
          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-gray-300" asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-3" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-300">
              <Info className="h-4 w-4 mr-3" />
              My tasks
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-300">
              <Inbox className="h-4 w-4 mr-3" />
              Inbox
            </Button>
          </nav>

          <div className="mt-6">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-gray-400">Insights</span>
              <Button variant="ghost" size="icon" className="h-4 w-4 text-gray-400">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-gray-400">Projects</span>
              <Button variant="ghost" size="icon" className="h-4 w-4 text-gray-400">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="pl-3 space-y-1">
              <Button variant="ghost" className="w-full justify-start text-gray-300">
                <div className="h-3 w-3 rounded bg-purple-400 mr-3" />
                AboRas
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-300">
                <div className="h-3 w-3 rounded bg-teal-400 mr-3" />
                Cross-functional project p...
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-300">
                <div className="h-3 w-3 rounded bg-blue-400 mr-3" />
                gggg
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-300">
                <div className="h-3 w-3 rounded bg-pink-400 mr-3" />
                Bydato
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-gray-400">Team</span>
            </div>
            <Button variant="ghost" className="w-full justify-start text-gray-300">
              <Users className="h-4 w-4 mr-3" />
              My workspace
              <ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </div>

          <div className="mt-auto space-y-2 p-2">
            <Button variant="ghost" className="w-full justify-start text-gray-300" asChild>
              <Link href="/about">
                <Info className="h-4 w-4 mr-3" />
                About
              </Link>
            </Button>
            <Button variant="outline" className="w-full border-gray-600 text-gray-300">
              <Mail className="h-4 w-4 mr-2" />
              Invite teammates
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-[#171717] text-white">
          {React.Children.map(children, (child) =>
            React.isValidElement(child) ? React.cloneElement(child, { widgetColor }) : child,
          )}
        </main>
      </div>
    </div>
  )
}

