import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarState } from "./avatarStates";

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface DhanAvatarProps {
  state: AvatarState;
  customerName: string;
  isTransparent?: boolean;
}

/**
 * DhanAvatar Component
 * A purely presentational component that renders the Lottie animation mapped to the current state,
 * complete with smooth Framer Motion transitions and status indicators.
 */
export function DhanAvatar({ state, customerName, isTransparent = false }: DhanAvatarProps): React.ReactElement {
  const [animationData, setAnimationData] = useState<any>(null);

  // Map state to the appropriate JSON file
  useEffect(() => {
    let lottieFile = "/lottie/avatar_idle.json";
    
    switch(state) {
      case "IDLE":
      case "LISTENING":
        lottieFile = "/lottie/avatar_idle.json"; // Listening can be the same as idle for now, or a specific listening loop if available.
        break;
      case "THINKING":
        lottieFile = "/lottie/avatar_thinking.json";
        break;
      case "SPEAKING":
        lottieFile = "/lottie/avatar_speaking.json";
        break;
      case "COACHING":
        lottieFile = "/lottie/avatar_speaking.json"; // Assuming coaching uses a speaking animation variant
        break;
    }

    fetch(lottieFile)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Failed to load Lottie animation:", err));
  }, [state]);

  // Determine status color based on state
  let statusColor = "bg-green-500";
  if (state === "LISTENING") statusColor = "bg-blue-400";
  if (state === "THINKING") statusColor = "bg-purple-400";
  if (state === "COACHING") statusColor = "bg-rose-500"; // Resilience Flag triggers warm/urgent state

  return (
    <div className={`flex flex-col items-center justify-center w-full shrink-0 overflow-hidden ${isTransparent ? 'bg-transparent py-4' : 'h-[180px] bg-slate-50 border-b border-slate-200 shadow-inner'}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.95, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -5 }}
          transition={{ duration: 0.3 }}
          className={`relative w-24 h-24 rounded-full overflow-hidden border-4 shadow-xl flex items-center justify-center shrink-0 ${state === 'COACHING' ? 'border-rose-200 bg-rose-50' : 'border-white bg-indigo-50'}`}
        >
          {/* LAYER 1: The Reactive Lottie Background (Aura) */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-80 scale-125">
            {animationData && (
              <Lottie 
                animationData={animationData} 
                loop={true} 
                style={{ width: '150%', height: '150%' }} 
              />
            )}
          </div>
          
          {/* LAYER 2: The Actual Character/Face (Foreground) */}
          <div className="absolute inset-0 z-10 flex items-center justify-center p-1">
            <img 
              src="/dhan_avatar.png" 
              alt="Dhan Companion" 
              className="w-full h-full object-cover rounded-full drop-shadow-md bg-white"
            />
          </div>

          {/* Status Indicator Dot */}
          <div className={`absolute bottom-0 right-1 z-20 w-3.5 h-3.5 rounded-full border-2 border-white ${statusColor} ${state === 'THINKING' ? 'animate-pulse' : ''}`}></div>
        </motion.div>
      </AnimatePresence>
      
      <div className="mt-3 text-center">
        <h2 className={`text-[20px] font-bold leading-tight ${isTransparent ? 'text-white' : 'text-slate-800'}`}>Dhan</h2>
        <p className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 ${isTransparent ? 'text-violet-300' : 'text-slate-500'}`}>Wealth Companion</p>
      </div>
    </div>
  );
}
