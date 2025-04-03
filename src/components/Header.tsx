import {
  CircleDot,
  FileText,
  Folder,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Triangle,
  User,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import Link from "next/link";

export function Header() {
  return (
    <header className="h-14 border-b border-[#353535] bg-[#1a1a1a] flex items-center">
      <div className="flex items-center w-64 px-4">
        <Button variant="ghost" size="icon" className="text-gray-400 -ml-2">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-white font-medium ml-3">My Workspace</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="text-white font-bold hover:bg-[#353535] hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 mt-2 p-0 bg-[#1a1a1a] border-[#353535] text-white">
          <DropdownMenuItem className="py-2.5 focus:bg-[#353535] text-white">
            <CircleDot className="mr-2 h-4 w-4" />
            Task
          </DropdownMenuItem>
          <DropdownMenuItem
            className="py-2.5 focus:bg-[#353535] text-white"
            asChild
          >
            <Link href="/projects/new">
              <FileText className="mr-2 h-4 w-4" />
              Project
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="py-2.5 focus:bg-[#353535] text-white">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </DropdownMenuItem>
          <DropdownMenuItem className="py-2.5 focus:bg-[#353535] text-white">
            <Folder className="mr-2 h-4 w-4" />
            Portfolio
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#353535]" />
          <DropdownMenuItem className="py-2.5 focus:bg-[#353535] text-white">
            <Triangle className="mr-2 h-4 w-4" />
            Goal
          </DropdownMenuItem>
          <DropdownMenuItem className="py-2.5 focus:bg-[#353535] text-white">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      <div className="relative w-96">
        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search"
          className="pl-9 bg-[#171717] border-0 text-white w-full"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <kbd className="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">
            Ctrl
          </kbd>
          <kbd className="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded ml-1">
            K
          </kbd>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-gray-400">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 mr-2 mt-2 p-0 bg-[#1a1a1a] border-[#353535] text-white">
          <div className="p-4 flex items-center gap-3">
            <Avatar className="h-12 w-12 bg-orange-300">
              <AvatarFallback>CX</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-white">My workspace</div>
              <div className="text-sm text-gray-400">vd7comm@gmail.com</div>
            </div>
          </div>
          <DropdownMenuSeparator className="bg-[#353535]" />
          <DropdownMenuItem className="py-2.5 focus:bg-[#353535] text-white">
            <Settings className="mr-2 h-4 w-4" />
            Admin console
          </DropdownMenuItem>
          <DropdownMenuItem className="py-2.5 focus:bg-[#353535] text-white">
            <Plus className="mr-2 h-4 w-4" />
            New workspace
          </DropdownMenuItem>
          <div className="p-3">
            <Button className="w-full bg-orange-300 text-orange-900 hover:bg-orange-400">
              Upgrade
            </Button>
          </div>
          <DropdownMenuSeparator className="bg-[#353535]" />
          <DropdownMenuItem className="py-2.5 focus:bg-[#353535] text-white">
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="py-2.5 focus:bg-[#353535] text-white">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem className="py-2.5 focus:bg-[#353535] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add another account
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#353535]" />
          <DropdownMenuItem className="py-2.5 focus:bg-[#353535] text-white">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
