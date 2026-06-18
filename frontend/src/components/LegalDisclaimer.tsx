import React from "react";

/**
 * Legal Disclaimer Component
 * 
 * Renders a persistent global footer to enforce hackathon brand safety rules.
 * Strictly states that this is a Proof of Concept (PoC) not affiliated with IDBI Bank.
 * 
 * @returns A non-dismissible fixed footer component.
 */
export function LegalDisclaimer(): React.ReactElement {
  return (
    <div className="w-full z-50 bg-red-950/90 border-t border-red-900/50 text-center px-4 py-3 shrink-0">
      <p className="text-xs sm:text-sm text-red-200/90 font-medium max-w-7xl mx-auto tracking-wide">
        <span className="font-bold text-red-100 uppercase mr-2">Prototype Disclaimer:</span>
        This is a Proof of Concept (PoC) for the IDBI Innovate Hackathon. The &quot;IDBI&quot; name and trademarks belong to their respective registered owners. This project is not affiliated with, endorsed by, or owned by IDBI Bank.
      </p>
    </div>
  );
}
