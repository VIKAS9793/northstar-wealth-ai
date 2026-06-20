import React from "react";
import { User, Target, ShieldAlert, ShieldCheck, Briefcase, IndianRupee } from "lucide-react";
import { FinancialTwinProfile } from "@/features/financial-twin/types";

interface FinancialTwinCardProps {
  profile: FinancialTwinProfile;
}

function getEmergencyFundLabel(months: number): { text: string; color: string } {
  if (months >= 6) return { text: `${months} Months ✓`, color: "text-emerald-700" };
  if (months >= 3) return { text: `${months} Months (Adequate)`, color: "text-amber-700" };
  return { text: `${months} Month${months !== 1 ? "s" : ""} (Build This First)`, color: "text-red-700" };
}

function getIncomeStability(cashflowProfile: string): string {
  if (cashflowProfile.toLowerCase().includes("comfortable")) return "Stable & Comfortable";
  if (cashflowProfile.toLowerCase().includes("balancing")) return "Under Pressure";
  return cashflowProfile;
}

function getPrimaryGoalName(profile: FinancialTwinProfile): string {
  if (!profile.goals || profile.goals.length === 0) return "Not Set";
  // Return the least-progressed goal — same logic as Goal Intelligence Engine
  const priority = profile.goals.reduce((prev, curr) =>
    prev.progressPercent < curr.progressPercent ? prev : curr
  );
  return priority.name;
}

/**
 * Financial Twin Visualization (Asset Category 7)
 * Renders a live snapshot from the customer's FinancialTwinProfile.
 * All fields are derived from the profile prop — nothing is hardcoded.
 */
export function FinancialTwinCard({ profile }: FinancialTwinCardProps): React.ReactElement {
  const emergencyFund = getEmergencyFundLabel(profile.emergency_fund_months);
  const primaryGoal = getPrimaryGoalName(profile);
  const incomeStability = getIncomeStability(profile.telemetry.cashflow_profile);
  const RiskIcon = profile.risk_profile === "Conservative" ? ShieldCheck : ShieldAlert;
  const riskIconColor =
    profile.risk_profile === "Conservative" ? "text-emerald-500" :
    profile.risk_profile === "Aggressive"   ? "text-red-500" : "text-amber-500";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm w-full max-w-md">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-indigo-50 rounded-xl">
          <User className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Your Wealth Profile</h3>
          <p className="text-sm text-gray-500">How Dhan understands your situation</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Target className="w-5 h-5 text-blue-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Primary Goal</p>
            <p className="text-sm font-semibold text-gray-900">{primaryGoal}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <RiskIcon className={`w-5 h-5 shrink-0 ${riskIconColor}`} />
          <div>
            <p className="text-xs text-gray-500 font-medium">Risk Profile</p>
            <p className="text-sm font-semibold text-gray-900">{profile.risk_profile}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Briefcase className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Emergency Fund</p>
            <p className={`text-sm font-semibold ${emergencyFund.color}`}>
              {emergencyFund.text}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <IndianRupee className="w-5 h-5 text-purple-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Cash Flow</p>
            <p className="text-sm font-semibold text-gray-900">{incomeStability}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
