import React from "react";
import { Home, GraduationCap, Sunset, Shield, TrendingUp, Wallet, Target } from "lucide-react";

const goalIcons: Record<string, React.ReactElement> = {
  "Home Purchase": <Home className="w-5 h-5 text-blue-600" />,
  "Child Education": <GraduationCap className="w-5 h-5 text-indigo-600" />,
  "Retirement": <Sunset className="w-5 h-5 text-orange-600" />,
  "Emergency Fund": <Shield className="w-5 h-5 text-red-600" />,
  "Wealth Creation": <TrendingUp className="w-5 h-5 text-emerald-600" />,
  "Passive Income": <Wallet className="w-5 h-5 text-purple-600" />
};

interface GoalTrackerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  portfolios: any[];
}

/**
 * Goal Tracker Dashboard Component
 * 
 * Visualizes the customer's active portfolios mapping to Asset Category 2 (Goal Icons).
 * Built with native React and lucide-react SVGs for performance.
 */
export function GoalTracker({ portfolios }: GoalTrackerProps): React.ReactElement {
  // Empty State (Asset Category 8)
  if (!portfolios || portfolios.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm w-full">
        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-gray-900 font-semibold">No Goals Created</h3>
        <p className="text-sm text-gray-500">Plan your future with your Wealth Companion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <h3 className="text-lg font-bold text-gray-900 px-1">Active Goals</h3>
      {portfolios.map((portfolio, idx) => {
        const progress = (portfolio.current_value / portfolio.target_amount) * 100;
        
        return (
          <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg">
                  {goalIcons[portfolio.goal_name] || <Target className="w-5 h-5 text-gray-600" />}
                </div>
                <h4 className="font-semibold text-gray-900">{portfolio.goal_name}</h4>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-green-100/80 text-green-700 rounded-full border border-green-200">
                On Track
              </span>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }}></div>
            </div>
            
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-500 font-medium">₹{portfolio.current_value.toLocaleString()}</span>
              <span className="text-gray-900 font-bold">Target: ₹{portfolio.target_amount.toLocaleString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
