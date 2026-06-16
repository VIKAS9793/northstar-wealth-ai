import React from "react";
import { ShieldCheck } from "lucide-react";

/**
 * Global Navigation Header Component
 * 
 * Provides top-level branding for the NorthStar Wealth Companion.
 * 
 * @returns The main application header.
 */
export function Header(): React.ReactElement {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 md:px-12 max-w-7xl mx-auto justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white leading-tight">
              NorthStar Wealth Companion
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
