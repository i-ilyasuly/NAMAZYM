import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLogo } from "./AppLogo";
import { cn } from "../lib/utils";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message, fullScreen = true }: LoadingScreenProps) {
  const [activeLetter, setActiveLetter] = useState<'n' | 'm1' | 'z' | 'm2' | null>(null);
  
  // Glow Cycle (6)
  useEffect(() => {
    const letters: ('n' | 'm1' | 'z' | 'm2')[] = ['n', 'm1', 'z', 'm2'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      setActiveLetter(letters[currentIndex]);
      currentIndex = (currentIndex + 1) % letters.length;
    }, 600);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn(
      "flex flex-col items-center justify-center bg-background transition-colors duration-500",
      fullScreen ? "fixed inset-0 z-[100]" : "w-full h-full py-12"
    )}>
      <div className="relative">
        <AppLogo size={fullScreen ? 120 : 80} animatedLetter={activeLetter} />
      </div>
      
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
