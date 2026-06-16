import React from 'react';
import { FinancialTwinProfile } from '@/features/financial-twin/types';
import { mockPersonas } from '@/features/financial-twin/mockData';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
  onSelectProfile: (profile: FinancialTwinProfile) => void;
}

export function RiskProfilingScreen({ onSelectProfile }: Props) {
  return (
    <div className="flex-1 flex flex-col bg-brand-light text-brand-navy p-4 overflow-y-auto w-full">

      <div className="z-10 w-full flex flex-col gap-4 pb-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="w-12 h-12 text-brand-navy" />
          </div>
          <h2 className="text-3xl font-light tracking-tight mb-2 text-brand-navy">Risk Profiling & Context</h2>
          <p className="text-brand-navy/70 font-light">Select a profile to continue.</p>
        </div>

        {/* Disclaimer Banner - Ultra Compact */}
        <div className="bg-brand-navy/5 border border-brand-navy/10 rounded-lg p-2.5 flex gap-3 items-center shadow-sm">
          <AlertCircle className="w-5 h-5 text-brand-navy shrink-0" />
          <p className="text-[10px] text-brand-navy/80 leading-snug">
            <strong className="text-brand-navy font-semibold">Demo Mode:</strong> Profiles are hardcoded here. In production, this data is auto-fetched via Bank APIs.
          </p>
        </div>

        {/* Persona Selector - Mobile List Layout */}
        <div className="flex flex-col gap-3 w-full">
          {mockPersonas.map((persona: FinancialTwinProfile) => (
            <button
              key={persona.id}
              onClick={() => onSelectProfile(persona)}
              className="w-full flex items-center p-3 rounded-xl bg-white hover:bg-brand-light transition-all border border-brand-navy/10 hover:border-brand-navy/30 relative overflow-hidden text-left group shadow-sm"
            >
              {/* Avatar - Left side */}
              <div className="w-12 h-12 rounded-full border-2 border-brand-navy/10 group-hover:border-brand-navy transition-all flex items-center justify-center bg-brand-light shrink-0 overflow-hidden mr-3">
                {persona.avatar_url ? (
                  <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-brand-navy">{persona.name.charAt(0)}</span>
                )}
              </div>
              
              {/* Details - Center */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-brand-navy leading-tight truncate">{persona.name}</h3>
                <p className="text-brand-gold-dark text-[10px] font-bold tracking-wider uppercase leading-tight truncate">{persona.persona_type}</p>
                <div className="flex gap-3 mt-1 text-[10px] text-brand-navy/60">
                  <span>Age: <span className="text-brand-navy/80">{persona.age}</span></span>
                  <span>Risk: <span className="text-brand-navy/80">{persona.risk_profile}</span></span>
                </div>
              </div>

              {/* Action - Right side */}
              <div className="shrink-0 text-brand-navy opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all pl-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
