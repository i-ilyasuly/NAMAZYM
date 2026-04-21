import React from "react";
import { motion } from "framer-motion";
import NightSky from "../NightSky";
import { Moon as MoonComponent } from "../Moon";
import { useStore } from "../../store";

interface GlobalBackgroundProps {
  activeTab: string;
}

export const GlobalBackground: React.FC<GlobalBackgroundProps> = ({ activeTab }) => {
  const { isDarkMode, isStarrySky, backgroundType, backgroundUrl } = useStore();

  if (activeTab !== "home") return null;

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none" aria-hidden="true">
      {/* Stars Background */}
      {backgroundType === 'stars' && isDarkMode && isStarrySky && (
        <>
          <NightSky />
          <div className="fixed -left-12 -top-12 z-0 opacity-100">
            <MoonComponent size={140} className="scale-x-[-1] opacity-90" />
          </div>
        </>
      )}

      {/* Image Background */}
      {backgroundType === 'image' && backgroundUrl && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img 
            src={backgroundUrl} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
            alt=""
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </motion.div>
      )}

      {/* Video Background */}
      {backgroundType === 'video' && backgroundUrl && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <video
            src={backgroundUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        </motion.div>
      )}
    </div>
  );
};
