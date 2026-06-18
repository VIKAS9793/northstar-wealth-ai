import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
type LottieAnimationData = Record<string, unknown>;

interface Props {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: Props) {
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);

  useEffect(() => {
    fetch('/lottie/wealth_hero_ui.json')
      .then(res => res.json())
      .then(data => setAnimationData(data as LottieAnimationData))
      .catch(err => console.error("Failed to load hero animation:", err));
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-brand-light text-brand-navy p-6 relative overflow-y-auto w-full">
      {/* Content Group */}
      <div className="z-10 flex flex-col items-center max-w-lg w-full px-4 gap-6">
        {/* Hero Animation Container */}
        <div className="w-full max-w-xs mx-auto flex justify-center h-64">
          {animationData && (
            <Lottie 
              animationData={animationData} 
              loop={true} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          )}
        </div>

        {/* Greeting Text */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-3xl font-light text-center tracking-tight text-brand-navy">
            Welcome to your <br/><span className="font-semibold text-brand-gold-dark">digital wealth manager.</span>
          </h1>
          
          <p className="text-sm text-center text-brand-navy/70 font-light leading-relaxed max-w-sm mx-auto">
            I will help you to assist and make informed decisions based on your goals.
          </p>
        </div>

        {/* Button */}
        <button 
          onClick={onNext}
          className="group flex items-center gap-3 bg-brand-navy text-white px-8 py-3.5 rounded-md font-medium text-lg hover:bg-brand-navy-light transition-all duration-300 transform active:scale-95 shadow-md hover:shadow-lg w-full max-w-xs justify-center mt-4"
        >
          Let&apos;s Begin
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
