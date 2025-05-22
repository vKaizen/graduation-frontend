"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface GlowEffectProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  glowSize?: number;
}

export const GlowEffect = ({
  children,
  className,
  containerClassName,
  glowSize = 400, // Increased size for better visibility
}: GlowEffectProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPosition({ x, y });
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative rounded-lg", containerClassName)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Border container */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          padding: "1.5px", // Border width
          opacity: isHovering ? 1 : 0,
          transition: "opacity 0.3s ease",
          background: `
            radial-gradient(
              ${glowSize}px circle at ${position.x}px ${position.y}px,
              rgba(68, 188, 255, 1),
              rgba(255, 68, 236, 1),
              rgba(255, 103, 94, 0.3),
              transparent 50%
            )
          `,
        }}
      >
        {/* Inner mask to create border effect */}
        <div className="w-full h-full bg-[#1a1a1a] rounded-lg" />
      </div>
      
      {/* Content */}
      <div className={cn(
        "relative z-10 border border-gray-800 rounded-lg bg-[#1a1a1a]", 
        className,
        isHovering ? "border-transparent" : ""
      )}>
        {children}
      </div>
    </div>
  );
};