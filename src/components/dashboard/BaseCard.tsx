import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { MoreHorizontal, X, ArrowUpWideNarrowIcon as ArrowsHorizontal, ArrowsUpFromLineIcon as ArrowsIn } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GlowEffect } from "@/components/ui/glow-effect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BaseCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  onRemove?: () => void;
  isFullWidth?: boolean;
  onSizeChange?: (isFullWidth: boolean) => void;
  cardId?: string;
  glowSize?: number;
}

export function BaseCard({
  title,
  icon,
  children,
  className,
  headerAction,
  onRemove,
  isFullWidth = false,
  onSizeChange,
  cardId,
  glowSize,
}: BaseCardProps) {
  const [isFullSize, setIsFullSize] = useState(isFullWidth);

  // Sync local state with prop when it changes from outside
  useEffect(() => {
    setIsFullSize(isFullWidth);
  }, [isFullWidth]);

  const toggleSize = () => {
    const newSize = !isFullSize;
    setIsFullSize(newSize);

    // Notify parent component about the size change
    if (onSizeChange) {
      onSizeChange(newSize);
    }
  };

  return (
    <GlowEffect glowSize={glowSize}>
      <div className="h-[350px] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </div>
          <div className="flex items-center">
            {headerAction || (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#262626] border-gray-700 text-white"
                >
                  <DropdownMenuItem
                    onClick={toggleSize}
                    className="hover:bg-[#333333] cursor-pointer"
                  >
                    {isFullSize ? (
                      <>
                        <ArrowsIn className="h-4 w-4 mr-2" />
                        Half width
                      </>
                    ) : (
                      <>
                        <ArrowsHorizontal className="h-4 w-4 mr-2" />
                        Full width
                      </>
                    )}
                  </DropdownMenuItem>
                  {onRemove && (
                    <DropdownMenuItem
                      onClick={onRemove}
                      className="text-red-400 hover:text-red-300 hover:bg-[#333333] cursor-pointer"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove widget
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(350px-64px)]">{children}</div>
      </div>
    </GlowEffect>
  );
}