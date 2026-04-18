import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface MoonProps {
  className?: string;
  size?: number;
}

export const Moon: React.FC<MoonProps> = ({ className, size = 120 }) => {
  const moonPhase = useMemo(() => {
    const lunarCycle = 29.530588853;
    const knownNewMoon = new Date('2024-02-09T23:00:00Z');
    const now = new Date();
    const age = ((now.getTime() - knownNewMoon.getTime()) / 86400000) % lunarCycle;
    return age / lunarCycle; // 0 to 1
  }, []);

  // Calculate the path for the lit part of the moon based on phase
  // Phase 0: New, 0.25: First Quarter, 0.5: Full, 0.75: Last Quarter
  const moonPath = useMemo(() => {
    const r = size / 2;
    const angle = moonPhase * Math.PI * 2;
    const isWaxing = moonPhase <= 0.5;
    
    // The width of the middle part (terminator)
    // Co-ordinate system: x from -r to r
    const curveX = r * Math.cos(angle);
    
    // We draw two semi-circles and one elliptical curve
    // SVG path: M x y A rx ry x-axis-rotation large-arc-flag sweep-flag x y
    
    if (isWaxing) {
      // Lit part is on the right
      // Right semi-circle + Elliptical curve (terminator)
      // If phase < 0.25, the terminator is concave (crescent)
      // If phase > 0.25, the terminator is convex (gibbous)
      const sweepFlag = moonPhase > 0.25 ? 1 : 0;
      return `M ${r} ${-r} A ${r} ${r} 0 0 1 ${r} ${r} A ${Math.abs(curveX)} ${r} 0 0 ${sweepFlag} ${r} ${-r} Z`;
    } else {
      // Lit part is on the left
      // Left semi-circle + Elliptical curve (terminator)
      const sweepFlag = moonPhase > 0.75 ? 0 : 1;
      return `M ${-r} ${-r} A ${r} ${r} 0 0 0 ${-r} ${r} A ${Math.abs(curveX)} ${r} 0 0 ${sweepFlag} ${-r} ${-r} Z`;
    }
  }, [moonPhase, size]);

  return (
    <div 
      className={cn("relative pointer-events-none select-none", className)}
      style={{ width: size, height: size }}
    >
      {/* Background Glow */}
      <div 
        className="absolute inset-0 rounded-full bg-white opacity-20 blur-2xl transform scale-150"
      />
      
      {/* The Moon SVG */}
      <svg 
        viewBox={`${-size/2} ${-size/2} ${size} ${size}`}
        className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
      >
        {/* Full moon silhouette (very faint) */}
        <circle cx="0" cy="0" r={size/2} fill="white" opacity="0.05" />
        
        {/* The Lit Part - pure white for the mix-blend-mode effect */}
        <path d={moonPath} fill="white" />
        
        {/* Subtle texture/craters */}
        <g opacity="0.1" style={{ mixBlendMode: 'multiply' }}>
          {[...Array(10)].map((_, i) => (
            <circle 
              key={i}
              cx={(Math.sin(i * 13) * size/2 * 0.7)}
              cy={(Math.cos(i * 17) * size/2 * 0.7)}
              r={Math.random() * (size/15) + 2}
              fill="black"
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default Moon;
