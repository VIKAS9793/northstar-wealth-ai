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

  const stateLabel = {
    IDLE: 'Online',
    LISTENING: 'Listening...',
    THINKING: 'Analyzing...',
    SPEAKING: 'Speaking...',
    COACHING: 'Coaching You...'
  }[state];

  return (
    <div className={`flex flex-row items-center w-full shrink-0 ${isTransparent ? 'bg-transparent py-2' : 'bg-white border-b border-slate-100 shadow-sm py-3 px-6 gap-4 z-10'}`}>
      
      {/* Avatar + Status Wrapper */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 shadow-sm flex items-center justify-center shrink-0 ${state === 'COACHING' ? 'border-rose-200 bg-rose-50' : 'border-slate-100 bg-slate-50'}`}
          >
            {/* Main Scenic Lottie Animation */}
            <div className="absolute inset-0 z-10 flex items-center justify-center p-1">
              {animationData && (
                <Lottie 
                  animationData={animationData} 
                  loop={true} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Status Indicator Dot (Moved outside overflow-hidden) */}
        <div className={`absolute bottom-0 right-0 z-20 w-4 h-4 rounded-full border-2 border-white ${statusColor} ${state === 'THINKING' ? 'animate-pulse' : ''}`}></div>
      </div>
      
      {/* Text Info block (Horizontal) */}
      <div className="flex flex-col justify-center text-left">
        <h2 className={`text-lg font-bold leading-none ${isTransparent ? 'text-white' : 'text-slate-800'}`}>Dhan</h2>
        <div className="flex items-center gap-1.5 mt-1.5">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${state === 'COACHING' ? 'text-rose-500' : isTransparent ? 'text-violet-300' : 'text-slate-500'}`}>
            {stateLabel}
          </p>
          {state === 'IDLE' && customerName && (
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              • Connected to {customerName}
            </span>
          )}
        </div>
      </div>
      
    </div>
  );
}
