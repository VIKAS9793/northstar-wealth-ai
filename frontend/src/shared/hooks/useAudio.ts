import { useCallback } from 'react';

export function useAudio() {
  const playSound = useCallback((type: 'send' | 'receive' | 'success' | 'alert') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      
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
          playTone(300, 'sine', 0.15, now, 0.05);
          playTone(150, 'sine', 0.15, now, 0.05);
          break;
        case 'receive':
          // Soft harmonic chime
          playTone(600, 'sine', 0.4, now, 0.03);
          playTone(800, 'sine', 0.6, now + 0.1, 0.03);
          break;
        case 'success':
          // Bright ascending arpeggio (Mango tree planted / On track)
          playTone(440, 'sine', 0.4, now, 0.04);       // A4
          playTone(554.37, 'sine', 0.4, now + 0.1, 0.04); // C#5
          playTone(659.25, 'sine', 0.4, now + 0.2, 0.04); // E5
          playTone(880, 'sine', 0.6, now + 0.3, 0.05);    // A5
          break;
        case 'alert':
          // Gentle low double pulse (Attention needed / Balancing required)
          playTone(350, 'triangle', 0.4, now, 0.04);
          playTone(350, 'triangle', 0.4, now + 0.2, 0.04);
          break;
      }
    } catch (e) {
      console.warn("Audio synthesis failed or blocked by browser.", e);
    }
  }, []);

  return { playSound };
}
