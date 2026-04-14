import React, { useId } from "react";
import { cn } from "../lib/utils";

interface AppLogoProps {
  className?: string;
  size?: number;
  withBackground?: boolean;
  animatedLetter?: 'n' | 'm1' | 'z' | 'm2' | null;
}

export function AppLogo({ className, size = 100, withBackground = true, animatedLetter = null }: AppLogoProps) {
  const id = useId();
  
  return (
    <div 
      className={cn(
        "relative flex items-center justify-center overflow-hidden transition-colors duration-300",
        withBackground ? "bg-white dark:bg-black" : "bg-transparent",
        className
      )}
      style={{ width: size, height: size, borderRadius: size * 0.15 }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <clipPath id={`${id}-n`}>
            <rect x="23" y="23" width="24" height="24" />
          </clipPath>
          <clipPath id={`${id}-m1`}>
            <rect x="53" y="23" width="24" height="24" />
          </clipPath>
          <clipPath id={`${id}-z`}>
            <rect x="23" y="53" width="24" height="24" />
          </clipPath>
          <clipPath id={`${id}-m2`}>
            <rect x="53" y="53" width="24" height="24" />
          </clipPath>
        </defs>

        {/* Outer Square Frame */}
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="miter"
          className="text-black dark:text-white"
        />

        {/* Letters */}
        <g 
          stroke="currentColor" 
          strokeWidth="5" 
          strokeLinejoin="miter" 
          strokeMiterlimit="10" 
          strokeLinecap="butt"
          className="text-black dark:text-white"
        >
          {/* N */}
          <path 
            clipPath={`url(#${id}-n)`} 
            d="M 25.5 51 L 25.5 25.5 L 44.5 44.5 L 44.5 19" 
            className={cn("transition-opacity duration-300", animatedLetter ? (animatedLetter === 'n' ? "opacity-100" : "opacity-20") : "")}
          />
          {/* M (Top) */}
          <path 
            clipPath={`url(#${id}-m1)`} 
            d="M 55.5 51 L 55.5 25.5 L 65 35 L 74.5 25.5 L 74.5 51" 
            className={cn("transition-opacity duration-300", animatedLetter ? (animatedLetter === 'm1' ? "opacity-100" : "opacity-20") : "")}
          />
          {/* Z */}
          <path 
            clipPath={`url(#${id}-z)`} 
            d="M 19 55.5 L 44.5 55.5 L 25.5 74.5 L 51 74.5" 
            className={cn("transition-opacity duration-300", animatedLetter ? (animatedLetter === 'z' ? "opacity-100" : "opacity-20") : "")}
          />
          {/* M (Bottom) */}
          <path 
            clipPath={`url(#${id}-m2)`} 
            d="M 55.5 81 L 55.5 55.5 L 65 65 L 74.5 55.5 L 74.5 81" 
            className={cn("transition-opacity duration-300", animatedLetter ? (animatedLetter === 'm2' ? "opacity-100" : "opacity-20") : "")}
          />
        </g>
      </svg>
    </div>
  );
}
