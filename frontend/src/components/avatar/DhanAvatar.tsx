"use client";
import React from "react";
import dynamic from "next/dynamic";
import { AvatarState } from "./avatarStates";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
type LottieAnimationData = Record<string, unknown>;

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
const AVATAR_FILES: Record<AvatarState, string> = {
  IDLE: '/lottie/avatar_idle.json',
  LISTENING: '/lottie/avatar_listening.json',
  THINKING: '/lottie/avatar_thinking.json',
  SPEAKING: '/lottie/avatar_speaking.json',
  COACHING: '/lottie/avatar_coaching.json'
};

const preloadedCache: Partial<Record<AvatarState, LottieAnimationData>> = {};

export function DhanAvatar({ state, customerName, isTransparent = false }: DhanAvatarProps): React.ReactElement {
  const [, forceCacheRefresh] = React.useReducer((version: number) => version + 1, 0);
  const animationData = preloadedCache[state] ?? null;
  
  React.useEffect(() => {
    // Preload all animations asynchronously so they are instantly available
    Object.entries(AVATAR_FILES).forEach(async ([key, path]) => {
      const avatarState = key as AvatarState;
      if (!preloadedCache[avatarState]) {
        try {
          const res = await fetch(path);
          if (res.ok) {
            preloadedCache[avatarState] = await res.json() as LottieAnimationData;
            forceCacheRefresh();
          }
        } catch (e) {
          console.error(`Failed to preload ${path}`, e);
        }
      }
    });
  }, []);

  React.useEffect(() => {
    if (preloadedCache[state]) return;

    fetch(AVATAR_FILES[state] || AVATAR_FILES.IDLE)
      .then(res => res.json())
      .then(data => {
        preloadedCache[state] = data as LottieAnimationData;
        forceCacheRefresh();
      })
      .catch(e => console.error(e));
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
        <div
          className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 shadow-sm flex items-center justify-center shrink-0 transition-colors duration-300 ${state === 'COACHING' ? 'border-rose-200 bg-rose-50' : 'border-slate-100 bg-slate-50'}`}
        >
          {/* Main Scenic Lottie Animation */}
          <div className="absolute inset-0 z-10 flex items-center justify-center p-1 w-full h-full">
            {animationData && (
              <Lottie 
                animationData={animationData} 
                loop={true} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}
          </div>
        </div>
        
        {/* Status Indicator Dot (Moved outside overflow-hidden) */}
        <div className={`absolute bottom-0 right-0 z-20 w-4 h-4 rounded-full border-2 border-white ${statusColor} transition-colors duration-300 ${state === 'THINKING' ? 'animate-pulse' : ''}`}></div>
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
