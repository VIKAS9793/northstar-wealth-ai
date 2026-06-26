import React from 'react';
import { FinancialTwinProfile } from './types';

interface WealthPortfolioSnapshotProps {
  profile: FinancialTwinProfile;
}

export function WealthPortfolioSnapshot({ profile }: WealthPortfolioSnapshotProps) {

  const absoluteReturn = profile.current_value - profile.total_invested;
  const returnPercentage = (absoluteReturn / profile.total_invested) * 100;
  
  // Clean banking formatting
  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(2)}L`;

  return (
    <div className="bg-white border-b border-slate-200 shrink-0 shadow-sm z-10 p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Your Wealth Portfolio</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Updated Today</p>
        </div>
        <div className="bg-indigo-50 px-2 py-1 rounded text-xs font-bold text-indigo-700">
          SIP: ₹{(profile.sip_amount / 1000).toFixed(0)}k/mo
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-end">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Value</p>
          <h3 className="text-3xl font-black text-slate-900 leading-none">
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
    </div>
  );
}
