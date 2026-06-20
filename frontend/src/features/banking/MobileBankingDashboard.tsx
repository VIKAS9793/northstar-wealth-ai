import React, { useState } from "react";
import { FinancialTwinProfile } from "@/features/financial-twin/types";
import { WealthPortfolioSnapshot } from "@/features/financial-twin/WealthPortfolioSnapshot";
import { CreditCard, Wallet, ArrowRightLeft, ShieldCheck, ChevronDown, ChevronUp, User } from "lucide-react";
import { WealthInsightModal } from "./WealthInsightModal";
import { GoalTracker } from "@/features/goals/GoalTracker";
import { FinancialTwinCard } from "@/features/twin/FinancialTwinCard";

interface Props {
  profile: FinancialTwinProfile;
  onLogout: () => void;
  onProactiveTrigger: (msg: string) => void;
}

export function MobileBankingDashboard({ profile, onLogout, onProactiveTrigger }: Props) {
  const [activeModal, setActiveModal] = useState<"SIP Health" | "Goal Track" | "Spending Habits" | "Safety Net" | null>(null);
  // ③ Collapsed by default — progressive disclosure. JTBD: see number → ask Dhan.
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Summary pills for the collapsed trigger row
  const emergencyStatus = profile.emergency_fund_months >= 6
    ? { label: `${profile.emergency_fund_months}m fund`, color: "bg-emerald-100 text-emerald-700" }
    : profile.emergency_fund_months >= 3
    ? { label: `${profile.emergency_fund_months}m fund`, color: "bg-amber-100 text-amber-700" }
    : { label: "Fund gap", color: "bg-rose-100 text-rose-700" };

  const goalCount = profile.goals.length;

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
            <span className="text-[10px] text-gray-600">Tap to review your money readiness</span>
            <span className="text-[8px] text-gray-400 mt-1">Simulated Event Trigger. Production: POST /api/webhooks/salary-credit</span>
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      </div>

      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="bg-brand-navy px-6 pt-6 pb-6 rounded-b-[40px] shadow-sm">
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
      </div>

      {/* ─── ① PORTFOLIO SNAPSHOT ─────────────────────────────────────────────── */}
      <div className="mt-4 mb-2">
        <WealthPortfolioSnapshot profile={profile} />
      </div>

      {/* ─── ② QUICK ACTIONS ──────────────────────────────────────────────────── */}
      <div className="px-6 mt-4 mb-4">
        <div className="grid grid-cols-4 gap-4">
          <button onClick={() => setActiveModal("SIP Health")} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-800 group-hover:bg-teal-50 transition-colors">
              <ArrowRightLeft className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center leading-tight">SIP<br />Health</span>
          </button>
          <button onClick={() => setActiveModal("Goal Track")} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-800 group-hover:bg-indigo-50 transition-colors">
              <Wallet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center leading-tight">Goal<br />Track</span>
          </button>
          <button onClick={() => setActiveModal("Spending Habits")} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-800 group-hover:bg-rose-50 transition-colors">
              <CreditCard className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center leading-tight">Spending<br />Habits</span>
          </button>
          <button onClick={() => setActiveModal("Safety Net")} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-800 group-hover:bg-amber-50 transition-colors">
              <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 text-center leading-tight">Safety<br />Net</span>
          </button>
        </div>
      </div>

      {/* ─── ③ PROGRESSIVE DETAIL DRAWER ──────────────────────────────────────── */}
      {/*
        Default: collapsed. Shows a single trigger row with summary pills.
        Tap → expands to reveal FinancialTwinCard + GoalTracker.
        This keeps the initial screen: portfolio → actions → chat FAB.
        Detail is available on demand, not forced above the fold.
      */}
      <div className="mx-4 mb-24 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Trigger row — always visible */}
        <button
          onClick={() => setIsDetailOpen(prev => !prev)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">Your Financial Details</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Risk profile · Goals · Emergency fund</p>
            </div>
          </div>
          {/* Summary pills — visible only when collapsed */}
          <div className="flex items-center gap-2">
            {!isDetailOpen && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  {profile.risk_profile}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                  {goalCount} goal{goalCount !== 1 ? "s" : ""}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${emergencyStatus.color}`}>
                  {emergencyStatus.label}
                </span>
              </div>
            )}
            <div className="text-gray-400 ml-1 shrink-0">
              {isDetailOpen
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />
              }
            </div>
          </div>
        </button>

        {/* Expandable content — smooth max-height CSS transition */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: isDetailOpen ? "1000px" : "0px" }}
        >
          <div className="border-t border-gray-100 dark:border-slate-800 px-3 pb-3 pt-3 space-y-3">
            <FinancialTwinCard profile={profile} />
            <GoalTracker goals={profile.goals} />
          </div>
        </div>
      </div>
    </div>
  );
}
