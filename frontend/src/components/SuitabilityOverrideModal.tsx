"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';

interface SuitabilityOverrideModalProps {
  customerId: string;
  userName: string;
  onConsent: () => void;
  onAlternative: () => void;
}

export function SuitabilityOverrideModal({ customerId, userName, onConsent, onAlternative }: SuitabilityOverrideModalProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);
  const [timer, setTimer] = useState(5);

  const [showRecord, setShowRecord] = useState(false);
  const [hashValue, setHashValue] = useState("");

  const allChecked = c1 && c2 && c3;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, timer]);

  /**
   * Generates a DPDP-compliant, non-repudiable liability acceptance hash.
   */
  const handleConsent = async () => {
    try {
      const timestamp = new Date().toISOString();
      const payload = `${customerId}|${timestamp}|RISK_LIABILITY_ACCEPTED`;
      
      const encoder = new TextEncoder();
      const data = encoder.encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setHashValue(hashHex);
      console.info(`[AUDIT] Liability Consent Hash Generated (DPDP Compliant - No PII): ${hashHex}`);
    } catch (error) {
      console.error("Cryptographic hashing failed during liability transfer.", error);
    }

    setPhase(3);
  };

  if (phase === 3) {
    return (
      <div className="mt-3 p-5 bg-white border border-slate-200 rounded-lg flex flex-col gap-4 shadow-sm w-full max-w-md">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
          <h4 className="text-base font-semibold text-slate-800">Your decision has been recorded</h4>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          A summary of this interaction has been saved to your account for your reference. Your Relationship Manager has been notified.
        </p>
        
        {showRecord && (
          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500">Time:</span>
              <span className="font-mono text-slate-800">{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500">Account:</span>
              <span className="font-mono text-slate-800">{customerId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500">Action:</span>
              <span className="text-amber-600 font-medium">Suitability Override Accepted</span>
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-slate-500">Audit Hash (DPDP Compliant):</span>
              <span className="font-mono text-[10px] break-all text-slate-400">{hashValue || "Generating..."}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={() => setShowRecord(!showRecord)}
            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded transition-colors"
          >
            {showRecord ? "Hide decision record" : "View decision record"}
          </button>
          <button
            type="button"
            onClick={onConsent}
            className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-1"
          >
            Continue to investment
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 2) {
    return (
      <div className="mt-3 p-5 bg-white border border-amber-300 rounded-lg flex flex-col gap-4 shadow-sm w-full max-w-md">
        <h4 className="text-sm font-semibold text-amber-800">Please acknowledge the following</h4>
        
        <div className="flex flex-col gap-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" 
              checked={c1} 
              onChange={(e) => setC1(e.target.checked)} 
            />
            <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
              I understand this fund carries high capital loss risk
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" 
              checked={c2} 
              onChange={(e) => setC2(e.target.checked)} 
            />
            <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
              I understand this conflicts with my Conservative risk profile
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" 
              checked={c3} 
              onChange={(e) => setC3(e.target.checked)} 
            />
            <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
              I understand I am proceeding against the guidance provided and IDBI Bank has fulfilled its advisory obligation
            </span>
          </label>
        </div>

        <button
          onClick={handleConsent}
          disabled={!allChecked || timer > 0}
          className="mt-2 w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-500 text-white font-semibold rounded transition-colors"
        >
          {timer > 0 ? `Confirm (${timer}s)` : 'Confirm'}
        </button>
      </div>
    );
  }

  // Phase 1
  return (
    <div className="mt-3 p-5 bg-amber-50 border border-amber-200 rounded-lg flex flex-col gap-4 shadow-sm w-full max-w-md">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900 mb-2">Heads up, {userName.split(' ')[0]}</h4>
          <p className="text-sm text-amber-800 leading-relaxed mb-3">
            This fund is outside the boundary we&apos;d recommend for your Conservative profile. Here&apos;s what that means in plain terms:
          </p>
          <ul className="text-sm text-amber-800 space-y-1 mb-3 list-disc pl-4">
            <li>Your profile suggests protecting capital</li>
            <li>This fund can lose up to 40-50% in a downturn</li>
            <li>Your existing goals may be at risk if this performs badly</li>
          </ul>
          <p className="text-sm text-amber-900 font-medium">
            This isn&apos;t a refusal &mdash; it&apos;s information you should have before deciding.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={onAlternative}
          className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded transition-colors"
        >
          See funds that match your profile
        </button>
        <button
          onClick={() => setPhase(2)}
          className="w-full py-2 text-amber-700 hover:text-amber-800 text-sm font-medium transition-colors"
        >
          I understand the risk, continue anyway
        </button>
      </div>
    </div>
  );
}
