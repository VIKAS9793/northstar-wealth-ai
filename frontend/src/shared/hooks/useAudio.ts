import { useCallback, useRef } from 'react';

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  
  const getCtx = useCallback((): AudioContext | null => {
    if (ctxRef.current) return ctxRef.current;
    const AC = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AC) return null;
    ctxRef.current = new AC();
    return ctxRef.current;
  }, []);

  const playSound = useCallback((type: 'send' | 'receive' | 'success' | 'alert' | 'confirmation' | 'stress' | 'happy') => {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume(); // Mobile: resume after user gesture

      
      const playTone = (freq: number, waveType: OscillatorType, duration: number, startTime: number, vol = 0.1) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        // Quick attack
        gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
        // Smooth release
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;

      switch (type) {
        case 'send':
          // Soft muted pop
          playTone(300, 'sine', 0.15, now, 0.8);
          playTone(150, 'sine', 0.15, now, 0.8);
          break;
        case 'receive':
          // Soft harmonic chime
          playTone(600, 'sine', 0.4, now, 0.8);
          playTone(800, 'sine', 0.6, now + 0.1, 0.8);
          break;
        case 'success':
          // Bright ascending arpeggio (Mango tree planted / On track)
          playTone(440, 'sine', 0.4, now, 0.8);       // A4
          playTone(554.37, 'sine', 0.4, now + 0.1, 0.8); // C#5
          playTone(659.25, 'sine', 0.4, now + 0.2, 0.8); // E5
          playTone(880, 'sine', 0.6, now + 0.3, 0.9);    // A5
          break;
        case 'alert':
          // Gentle low double pulse (Attention needed / Balancing required)
          playTone(350, 'triangle', 0.4, now, 0.7);
          playTone(350, 'triangle', 0.4, now + 0.2, 0.7);
          break;
        case 'confirmation':
          // Crisp, reassuring ping
          playTone(523.25, 'sine', 0.2, now, 0.8);       // C5
          playTone(1046.50, 'sine', 0.4, now + 0.1, 0.8); // C6
          break;
        case 'stress':
          // Reassuring, grounding, and calm chord for resilience (prevent panic)
          // Uses a perfect fifth (F4 and C5) which is inherently stable and comforting
          playTone(349.23, 'sine', 1.0, now, 0.8);       // F4
          playTone(523.25, 'sine', 1.2, now + 0.1, 0.6); // C5
          break;
        case 'happy':
          // Exciting, energetic triad for acceleration/windfall
          playTone(523.25, 'sine', 0.3, now, 0.8);       // C5
          playTone(659.25, 'sine', 0.3, now + 0.1, 0.8); // E5
          playTone(783.99, 'sine', 0.5, now + 0.2, 0.9); // G5
          break;
      }
    } catch (e) {
      console.warn("Audio synthesis failed or blocked by browser.", e);
    }
  }, [getCtx]);

  // Called synchronously on user gesture (iOS/Safari requirement).
  // Initializes ctxRef.current and moves it to 'running' state so that
  // subsequent playSound() calls from async callbacks are not blocked.
  // A throwaway new AudioContext() in the click handler would NOT work here —
  // it has no connection to ctxRef.current and closing it unlocks nothing.
  const prewarm = useCallback(() => {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }, [getCtx]);

  return { playSound, prewarm };
}
