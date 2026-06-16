"use client";

import React, { useState } from "react";
import { WelcomeScreen } from "@/features/banking/WelcomeScreen";
import { RiskProfilingScreen } from "@/features/banking/RiskProfilingScreen";
import { MobileBankingDashboard } from "@/features/banking/MobileBankingDashboard";
import { FinancialTwinProfile } from "@/features/financial-twin/types";
import { ChatContainer } from "@/features/chat/ChatContainer";
import { MessageSquare, X } from "lucide-react";

type AppState = "WELCOME" | "RISK_PROFILE" | "DASHBOARD";

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>("WELCOME");
  const [selectedPersona, setSelectedPersona] = useState<FinancialTwinProfile | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);

  if (appState === "WELCOME") {
    return <WelcomeScreen onNext={() => setAppState("RISK_PROFILE")} />;
  }

  if (appState === "RISK_PROFILE") {
    return (
      <RiskProfilingScreen 
        onSelectProfile={(profile) => {
          setSelectedPersona(profile);
          setAppState("DASHBOARD");
        }} 
      />
    );
  }

  if (appState === "DASHBOARD" && selectedPersona) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        {/* 1. Native Banking Dashboard */}
        <MobileBankingDashboard 
          profile={selectedPersona} 
          onLogout={() => {
            setAppState("WELCOME");
            setProactiveMessage(null);
            setIsChatOpen(false);
          }} 
          onProactiveTrigger={(msg) => {
            setProactiveMessage(msg);
            setIsChatOpen(true);
          }}
        />

        {/* 2. Chat UI Modal / Slide-Up Overlay */}
        <div 
          className={`absolute inset-0 bg-gray-950 flex flex-col transition-transform duration-300 ease-in-out z-40 ${isChatOpen ? 'translate-y-0' : 'translate-y-full'}`}
        >
          {/* Chat Header with Minimize Button */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200 shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center text-xs font-bold uppercase">
                {selectedPersona.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-brand-navy leading-none">Dhan</span>
                <span className="text-[10px] text-green-600 font-medium">Active • Connected to {selectedPersona.name}</span>
              </div>
            </div>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* The Chat UI */}
          {/* Key is used to force re-mount if proactive message changes so state resets */}
          <ChatContainer 
            key={proactiveMessage || "default"} 
            customer={selectedPersona} 
            proactiveMessage={proactiveMessage} 
          />
        </div>

        {/* 3. Floating Action Button (FAB) */}
        {!isChatOpen && (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="absolute bottom-6 right-6 w-14 h-14 bg-brand-gold rounded-full shadow-2xl shadow-brand-navy/20 flex items-center justify-center hover:bg-amber-400 hover:scale-105 transition-all z-30 group"
          >
            <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center"></div>
            <MessageSquare className="w-6 h-6 text-brand-navy" />
          </button>
        )}
      </div>
    );
  }

  return null;
}
