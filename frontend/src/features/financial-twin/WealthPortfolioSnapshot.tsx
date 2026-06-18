import React, { useState } from 'react';
import { FinancialTwinProfile } from './types';

interface WealthPortfolioSnapshotProps {
  profile: FinancialTwinProfile;
}

export function WealthPortfolioSnapshot({ profile }: WealthPortfolioSnapshotProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const absoluteReturn = profile.current_value - profile.total_invested;
  const returnPercentage = (absoluteReturn / profile.total_invested) * 100;
  
  // Clean banking formatting
  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(2)}L`;

  return (
    <div className="bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-sm font-bold text-slate-800">Your Wealth Portfolio</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Updated Today</p>
        </div>
        <button className="text-slate-400 p-1">
          {isExpanded ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 bg-slate-50/50">
          {/* Main Portfolio Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex justify-between items-end">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Value</p>
              <h3 className="text-2xl font-black text-slate-900 leading-none">
                {formatCurrency(profile.current_value)}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Returns</p>
              <p className={`text-sm font-bold flex items-center justify-end gap-0.5 ${absoluteReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {absoluteReturn >= 0 ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                )}
                {formatCurrency(Math.abs(absoluteReturn))} ({returnPercentage.toFixed(1)}%)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* SIP Card */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Active SIPs</p>
              <p className="text-sm font-bold text-slate-800">₹{(profile.sip_amount / 1000).toFixed(0)}k <span className="text-[10px] text-slate-400 font-medium">/mo</span></p>
            </div>
            
            {/* Liquidity Card */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Emergency Fund</p>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${profile.emergency_fund_months >= 6 ? 'bg-emerald-500' : profile.emergency_fund_months >= 3 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                <p className="text-sm font-bold text-slate-800">{profile.emergency_fund_months} Months</p>
              </div>
            </div>
          </div>

          {/* Goals Progress */}
          {profile.goals.length > 0 && (
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Goals</p>
              <div className="space-y-3">
                {profile.goals.map((goal, idx) => {
                  const progressPct = Math.min(100, Math.max(0, goal.progressPercent));
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">{goal.name}</span>
                        <span className="font-bold text-slate-900">{Math.round(progressPct)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full" 
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
