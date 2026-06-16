import React, { useState } from "react";
import { FinancialTwinProfile } from "@/features/financial-twin/types";
import { WealthPortfolioSnapshot } from "@/features/financial-twin/WealthPortfolioSnapshot";
import { CreditCard, Send, Wallet, ArrowRightLeft, ShieldCheck } from "lucide-react";
import { WealthInsightModal } from "./WealthInsightModal";

interface Props {
  profile: FinancialTwinProfile;
  onLogout: () => void;
  onProactiveTrigger: (msg: string) => void;
}

export function MobileBankingDashboard({ profile, onLogout, onProactiveTrigger }: Props) {
  const [activeModal, setActiveModal] = useState<"SIP Health" | "Goal Track" | "Spending Habits" | "Safety Net" | null>(null);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto">
      {/* Wealth Insight Modal Overlay */}
      <WealthInsightModal 
        isOpen={activeModal !== null} 
        onClose={() => setActiveModal(null)} 
        title={activeModal} 
        profile={profile} 
      />

      {/* Simulated Proactive Push Notification */}
      <div 
        className="bg-green-50 border-b border-green-100 p-3 flex items-center justify-between cursor-pointer hover:bg-green-100 transition-colors z-20 shadow-sm"
        onClick={() => onProactiveTrigger(`I noticed your salary was credited! Your emergency fund is short by 2 months. Let's redirect 10% of this month's inflow to close that gap. Sound good?`)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center shrink-0">
            <span className="text-green-700 font-bold text-xs">₹</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-800">Salary Credited</span>
            <span className="text-[10px] text-gray-600">Tap to review your Financial Twin</span>
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      </div>

      {/* Header */}
      <div className="bg-brand-navy px-6 pt-6 pb-24 rounded-b-[40px] shadow-sm relative">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-indigo-200 text-sm font-medium">Welcome back,</p>
            <h1 className="text-white text-2xl font-bold">{profile.name}</h1>
          </div>
          <button 
            onClick={onLogout}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold border border-white/20 hover:bg-white/20 transition-colors"
            title="Switch Account"
          >
            {profile.name.charAt(0)}
          </button>
        </div>
        
        {/* Main Balance Card */}
        <div className="absolute -bottom-16 left-6 right-6 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xl border border-gray-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Investable Surplus</p>
            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold">OPTIMAL</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">
            ₹{(profile.income * 0.15).toLocaleString('en-IN')}
          </h2>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-navy"></span> A/c ending in •••• 4092
          </p>
        </div>
      </div>

      {/* Wealth Quick Actions Grid */}
      <div className="px-6 mt-24 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <button onClick={() => setActiveModal("SIP Health")} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-800 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 transition-colors">
              <ArrowRightLeft className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center leading-tight">SIP<br/>Health</span>
          </button>
          <button onClick={() => setActiveModal("Goal Track")} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
              <Wallet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center leading-tight">Goal<br/>Track</span>
          </button>
          <button onClick={() => setActiveModal("Spending Habits")} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-800 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20 transition-colors">
              <CreditCard className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center leading-tight">Spending<br/>Habits</span>
          </button>
          <button onClick={() => setActiveModal("Safety Net")} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-800 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 transition-colors">
              <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center leading-tight">Safety<br/>Net</span>
          </button>
        </div>
      </div>

      {/* Wealth Integration Module */}
      <div className="px-6 mb-24">
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">NorthStar Wealth</h3>
          <button className="text-xs text-brand-navy font-bold flex items-center underline">
            Details
          </button>
        </div>
        <WealthPortfolioSnapshot profile={profile} />
      </div>
    </div>
  );
}
