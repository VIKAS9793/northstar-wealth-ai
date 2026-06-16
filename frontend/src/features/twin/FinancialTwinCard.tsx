import React from "react";
import { User, Target, ShieldAlert, Briefcase, IndianRupee } from "lucide-react";

/**
 * Financial Twin Visualization (Asset Category 7)
 * 
 * A signature asset providing a digital financial health snapshot.
 * Built entirely with native React and Lucide icons for maximum performance
 * and 2D flat banking aesthetic.
 */
export function FinancialTwinCard(): React.ReactElement {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm w-full max-w-md">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-indigo-50 rounded-xl">
          <User className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Financial Twin Profile</h3>
          <p className="text-sm text-gray-500">Mid-Career Goal Planner</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Target className="w-5 h-5 text-blue-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Primary Goal</p>
            <p className="text-sm font-semibold text-gray-900">Home Purchase</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Risk Appetite</p>
            <p className="text-sm font-semibold text-gray-900">Moderate-High</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Briefcase className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Emergency Fund</p>
            <p className="text-sm font-semibold text-gray-900">3 Months (Low)</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <IndianRupee className="w-5 h-5 text-purple-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Income Stability</p>
            <p className="text-sm font-semibold text-gray-900">Stable</p>
          </div>
        </div>
      </div>
    </div>
  );
}
