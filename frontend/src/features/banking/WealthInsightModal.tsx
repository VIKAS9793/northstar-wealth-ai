import React, { useEffect } from 'react';
import { FinancialTwinProfile } from '@/features/financial-twin/types';
import { X, ShieldAlert, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAudio } from '@/shared/hooks/useAudio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: "SIP Health" | "Goal Track" | "Spending Habits" | "Safety Net" | null;
  profile: FinancialTwinProfile;
}

export function WealthInsightModal({ isOpen, onClose, title, profile }: Props) {
  const { playSound } = useAudio();
  
  const { telemetry } = profile;

  useEffect(() => {
    if (isOpen && title) {
      if (
        (title === "SIP Health" && telemetry.sip_health_status === "Optimization Possible") ||
        (title === "Spending Habits" && telemetry.discretionary_spend >= 30000) ||
        (title === "Safety Net" && profile.emergency_fund_months < 6)
      ) {
        playSound('alert');
      } else {
        playSound('success');
      }
    }
  }, [isOpen, title, telemetry, profile.emergency_fund_months, playSound]);

  if (!isOpen || !title) return null;

  // Deterministic RM VOC Analogies with Dynamic Emojis
  const getInsight = () => {
    switch (title) {
      case "SIP Health":
        if (telemetry.sip_health_status === "Optimization Possible") {
          return {
            emoji: "🧘‍♂️",
            text: "Your SIPs are like a fitness routine. We noticed your EMIs are taking up a large portion of your inflow. A small optimization here can protect your long-term consistency. Let's balance this out."
          };
        }
        return {
          emoji: "🌱",
          text: "Your SIPs are running perfectly on track. Consistency is the key to building the muscle. Keep the routine going!"
        };
      case "Spending Habits":
        if (telemetry.discretionary_spend >= 30000) {
          return {
            emoji: "⚖️",
            text: "Think of your income as a bucket of water. We noticed some extra discretionary spends this month. Balancing these will ensure maximum water reaches the roots of your investments."
          };
        }
        return {
          emoji: "🎯",
          text: "Your spending is well within limits. The bucket has no leaks, allowing maximum water to reach the roots of your investments."
        };
      case "Safety Net":
        if (profile.emergency_fund_months < 6) {
          return {
            emoji: "🧱",
            text: `An emergency fund is your financial shock absorber. Right now, your absorber is at ${profile.emergency_fund_months} months. Let's gradually build this up to protect your long-term SIPs from bumpy roads.`
          };
        }
        return {
          emoji: "🛡️",
          text: `Your financial shock absorber is strong (${profile.emergency_fund_months} months). You are well protected against any bumpy roads in life.`
        };
      case "Goal Track":
        return {
          emoji: "🥭",
          text: "You are planting your Mango Tree perfectly. The roots have taken hold, and your SIPs are consistent. Now, let compounding do the heavy lifting."
        };
      default:
        return { emoji: "💡", text: "" };
    }
  };

  const insight = getInsight();

  // Telemetry Visuals
  const renderVisuals = () => {
    switch (title) {
      case "Spending Habits":
      case "SIP Health":
        const inflow = telemetry.monthly_inflow;
        const emiPct = Math.round((telemetry.total_emis / inflow) * 100);
        const spendPct = Math.round((telemetry.discretionary_spend / inflow) * 100);
        const savePct = Math.round(((inflow - telemetry.total_emis - telemetry.discretionary_spend) / inflow) * 100);

        return (
          <div className="space-y-4 mt-6">
            <h4 className="text-sm font-bold text-gray-700">Monthly Cashflow Telemetry</h4>
            <div className="flex h-6 rounded-full overflow-hidden">
              <div style={{ width: `${emiPct}%` }} className="bg-rose-500 flex items-center justify-center text-[10px] text-white font-bold">{emiPct}%</div>
              <div style={{ width: `${spendPct}%` }} className="bg-amber-400 flex items-center justify-center text-[10px] text-white font-bold">{spendPct}%</div>
              <div style={{ width: `${savePct}%` }} className="bg-teal-500 flex items-center justify-center text-[10px] text-white font-bold">{savePct}%</div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> EMIs</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Spends</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-500"></div> Retained</span>
            </div>
          </div>
        );
      case "Safety Net":
        const maxMonths = 12;
        const currentMonths = profile.emergency_fund_months;
        const progress = Math.min((currentMonths / maxMonths) * 100, 100);
        const isLow = currentMonths < 6;

        return (
          <div className="space-y-4 mt-6">
            <h4 className="text-sm font-bold text-gray-700">Shock Absorber Capacity</h4>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div style={{ width: `${progress}%` }} className={`h-full ${isLow ? 'bg-amber-500' : 'bg-teal-500'}`}></div>
            </div>
            <p className="text-xs text-gray-500 font-medium">{currentMonths} Months / {maxMonths} Months Recommended</p>
          </div>
        );
      case "Goal Track":
        return (
          <div className="space-y-4 mt-6">
            <h4 className="text-sm font-bold text-gray-700">Mango Tree Progress</h4>
            {profile.goals.map((g, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>{g.name}</span>
                  <span>{g.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div style={{ width: `${g.progress}%` }} className="h-full bg-indigo-500"></div>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[390px] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full duration-300">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-indigo-100">
              {title === "SIP Health" && <TrendingUp className="w-5 h-5 text-indigo-600" />}
              {title === "Goal Track" && <CheckCircle className="w-5 h-5 text-indigo-600" />}
              {title === "Spending Habits" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {title === "Safety Net" && <ShieldAlert className="w-5 h-5 text-rose-500" />}
            </div>
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          
          {/* AI Educative Analogy Box */}
          <div className="bg-gradient-to-br from-indigo-600 to-teal-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex gap-3 relative z-10">
              <div className="mt-1">
                <span className="text-2xl">{insight.emoji}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-indigo-100 mb-1">Behavioral Insight</h3>
                <p className="text-sm leading-relaxed font-medium text-white/90">
                  {insight.text}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Visuals */}
          {renderVisuals()}

        </div>
      </div>
    </div>
  );
}
