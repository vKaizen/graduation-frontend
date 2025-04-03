import type { ReactNode } from "react"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BaseCardProps {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
  headerAction?: ReactNode
}

export function BaseCard({ title, icon, children, className, headerAction }: BaseCardProps) {
  return (
    <Card className={cn("bg-[#1a1a1a] border-0 shadow-md h-[350px] rounded-lg overflow-hidden", className)}>
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center">
          {headerAction || (
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
              <MoreHorizontal className="h-5 w-5" />
              <span className="sr-only">More options</span>
            </Button>
          )}
        </div>
      </div>
      <div className="p-4 overflow-y-auto h-[calc(350px-64px)]">{children}</div>
    </Card>
  )
}

