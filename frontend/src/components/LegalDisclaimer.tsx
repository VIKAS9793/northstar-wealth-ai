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
    <div className="w-full shrink-0 bg-gray-950/95 border-t border-gray-800 px-4 py-1.5">
      <p className="text-[10px] text-gray-500 text-center leading-tight max-w-7xl mx-auto">
        <span className="font-semibold text-gray-400">Prototype Disclaimer:</span>{" "}
        PoC for IDBI Innovate Hackathon. Not affiliated with, endorsed by, or owned by IDBI Bank. &quot;IDBI&quot; is a registered trademark of its respective owners.
      </p>
    </div>
  );
}
